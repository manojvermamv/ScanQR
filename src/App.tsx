import React, { useState, useEffect } from 'react';
import { DeviceFrame } from './components/DeviceFrame.tsx';
import { SplashScreen } from './components/SplashScreen.tsx';
import { GeneratorView } from './components/GeneratorView.tsx';
import { ScannerView } from './components/ScannerView.tsx';
import { FavoritesView } from './components/FavoritesView.tsx';
import { NavigationDrawer } from './components/NavigationDrawer.tsx';
import { ScanResultModal } from './components/ScanResultModal.tsx';
import { ImageCropperModal } from './components/ImageCropperModal.tsx';
import { PermissionDialog } from './components/PermissionDialog.tsx';
import { UpdatePasswordModal } from './components/UpdatePasswordModal.tsx';
import { DebugModal } from './components/DebugModal.tsx';
import { RateAppModal } from './components/RateAppModal.tsx';
import { AboutModal } from './components/AboutModal.tsx';
import { NetworkStatusBanner } from './components/NetworkStatusBanner.tsx';
import { 
  ScreenType, 
  DevicePlatform, 
  ThemeMode, 
  QrRecord, 
  PermissionState, 
  ToastMessage, 
  AppError 
} from './core/types.ts';
import { 
  loadRecords, 
  saveRecords, 
  addRecord, 
  toggleFavorite, 
  deleteRecord, 
  deleteMultipleRecords,
  clearAllRecords, 
  loadSettings, 
  saveSettings 
} from './core/storage.ts';
import { isNetworkUrl, normalizeUrl } from './core/qrUtils.ts';
import { CheckCircle2, AlertCircle, Info as InfoIcon, X } from 'lucide-react';

export default function App() {
  // Query param check for ?autostart=1 (skip splash as per ultra-mode testable guidelines)
  const isAutostart = new URLSearchParams(window.location.search).get('autostart') === '1';

  // Navigation & Screen state
  const [currentScreen, setCurrentScreen] = useState<ScreenType>(isAutostart ? 'generator' : 'splash');
  const [devicePlatform, setDevicePlatform] = useState<DevicePlatform>('android');
  const [theme, setTheme] = useState<ThemeMode>('dark');

  // Drawer & Modals state
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [aboutOpen, setAboutOpen] = useState<boolean>(false);
  const [rateAppOpen, setRateAppOpen] = useState<boolean>(false);
  const [debugOpen, setDebugOpen] = useState<boolean>(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState<boolean>(false);

  // Scan & Result state
  const [scanResultContent, setScanResultContent] = useState<string | null>(null);
  const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);

  // Persistence data
  const [records, setRecords] = useState<QrRecord[]>([]);

  // Permissions state
  const [permissions, setPermissions] = useState<PermissionState>({
    camera: 'granted',
    storageRead: 'granted',
    storageWrite: 'granted',
  });
  const [pendingPermission, setPendingPermission] = useState<{
    name: string;
    onGranted: () => void;
  } | null>(null);

  // Network offline state (Ported from include_connection.xml & CheckInternet.java)
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  // Diagnostics & Crash state (Ported from DebugActivity.java & MyApp.java)
  const [appError, setAppError] = useState<AppError | null>(null);

  // Toast notifications (Ported from CustomToast.java & Toasty)
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Load initial settings and records
  useEffect(() => {
    const loadedSettings = loadSettings();
    setTheme(loadedSettings.theme);
    setRecords(loadRecords());

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Global error listener to test DebugActivity crash interception
    const handleGlobalError = (event: ErrorEvent) => {
      setAppError({
        title: 'An error occured',
        message: event.message || 'Uncaught runtime exception',
        stack: event.error?.stack,
        timestamp: Date.now(),
      });
    };
    window.addEventListener('error', handleGlobalError);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const newToast: ToastMessage = {
      id: 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      message,
      type,
    };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 3200);
  };

  const handleSaveRecord = (recordData: Omit<QrRecord, 'id' | 'createdAt'>) => {
    const saved = addRecord(recordData);
    setRecords((prev) => [saved, ...prev]);
  };

  const handleToggleFavorite = (id: string) => {
    const updated = toggleFavorite(id);
    setRecords(updated);
  };

  const handleDeleteRecord = (id: string) => {
    const updated = deleteRecord(id);
    setRecords(updated);
    showToast('Record deleted', 'info');
  };

  const handleClearAllRecords = () => {
    clearAllRecords();
    setRecords([]);
  };

  const handleScanResult = (text: string) => {
    const newRecord = addRecord({
      content: text,
      type: isNetworkUrl(text) ? 'url' : 'text',
      category: 'scanned',
      isFavorite: false,
      title: `Scanned: ${text.slice(0, 24)}`,
    });
    setRecords((prev) => [newRecord, ...prev]);
    setScanResultContent(text);
  };

  const handleRequestPermission = (permissionName: string, onGranted: () => void) => {
    // If already granted, execute directly
    if (permissionName.includes('CAMERA') && permissions.camera === 'granted') {
      onGranted();
      return;
    }
    if (permissionName.includes('STORAGE') && permissions.storageWrite === 'granted') {
      onGranted();
      return;
    }

    // Otherwise show rationale dialog (matching permissionschecker library)
    setPendingPermission({ name: permissionName, onGranted });
  };

  const handleConfirmPermission = () => {
    if (pendingPermission) {
      if (pendingPermission.name.includes('CAMERA')) {
        setPermissions((p) => ({ ...p, camera: 'granted' }));
      }
      if (pendingPermission.name.includes('STORAGE')) {
        setPermissions((p) => ({ ...p, storageRead: 'granted', storageWrite: 'granted' }));
      }
      pendingPermission.onGranted();
      setPendingPermission(null);
      showToast('Permission granted', 'success');
    }
  };

  const handleDeclinePermission = () => {
    if (pendingPermission) {
      if (pendingPermission.name.includes('CAMERA')) {
        setPermissions((p) => ({ ...p, camera: 'denied' }));
      }
      if (pendingPermission.name.includes('STORAGE')) {
        setPermissions((p) => ({ ...p, storageWrite: 'denied' }));
      }
      setPendingPermission(null);
      showToast('Permission denied', 'error');
    }
  };

  const handleOpenUrl = (url: string) => {
    window.open(normalizeUrl(url), '_blank', 'noopener,noreferrer');
  };

  return (
    <DeviceFrame
      platform={devicePlatform}
      theme={theme}
      onTogglePlatform={() => setDevicePlatform((p) => (p === 'android' ? 'ios' : 'android'))}
      onToggleTheme={() => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        saveSettings({ ...loadSettings(), theme: nextTheme });
      }}
    >
      {/* Network Status Banner (Ported from include_connection.xml) */}
      <NetworkStatusBanner
        isOffline={isOffline}
        onRetry={() => {
          setIsOffline(!navigator.onLine);
          showToast(navigator.onLine ? 'Network reconnected!' : 'Still offline. Check connection.', navigator.onLine ? 'success' : 'error');
        }}
        onDismiss={() => setIsOffline(false)}
      />

      {/* Screen Render Router */}
      {currentScreen === 'splash' && (
        <SplashScreen onFinish={() => setCurrentScreen('generator')} />
      )}

      {currentScreen === 'generator' && (
        <GeneratorView
          theme={theme}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          onOpenScanner={() => setCurrentScreen('scanner')}
          onSaveRecord={handleSaveRecord}
          onShowToast={showToast}
          onRequestPermission={handleRequestPermission}
        />
      )}

      {currentScreen === 'scanner' && (
        <ScannerView
          onClose={() => setCurrentScreen('generator')}
          onScanResult={handleScanResult}
          onOpenGalleryPicker={(img) => setCropperImageSrc(img)}
          onShowToast={showToast}
          onRequestPermission={handleRequestPermission}
        />
      )}

      {currentScreen === 'favorites' && (
        <FavoritesView
          records={records}
          onBack={() => setCurrentScreen('generator')}
          onSelectRecord={(r) => setScanResultContent(r.content)}
          onToggleFavorite={handleToggleFavorite}
          onDeleteRecord={handleDeleteRecord}
          onDeleteMultiple={(ids) => {
            const updated = deleteMultipleRecords(ids);
            setRecords(updated);
          }}
          onClearAll={handleClearAllRecords}
          onShowToast={showToast}
        />
      )}

      {currentScreen === 'password_utility' && (
        <div className="flex-1 flex flex-col bg-neutral-900 text-neutral-100 p-4">
          <UpdatePasswordModal
            isOpen={true}
            onClose={() => setCurrentScreen('generator')}
            onSuccess={() => {
              showToast('Password credentials validated', 'success');
              setCurrentScreen('generator');
            }}
            onShowToast={showToast}
          />
        </div>
      )}

      {/* Side Navigation Drawer (Ported from main_drawer.xml) */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        currentScreen={currentScreen}
        devicePlatform={devicePlatform}
        theme={theme}
        onClose={() => setIsDrawerOpen(false)}
        onNavigate={(screen) => setCurrentScreen(screen)}
        onTogglePlatform={() => setDevicePlatform((p) => (p === 'android' ? 'ios' : 'android'))}
        onToggleTheme={() => {
          const next = theme === 'dark' ? 'light' : 'dark';
          setTheme(next);
          saveSettings({ ...loadSettings(), theme: next });
        }}
        onOpenAbout={() => {
          setIsDrawerOpen(false);
          setAboutOpen(true);
        }}
        onOpenRateApp={() => {
          setIsDrawerOpen(false);
          setRateAppOpen(true);
        }}
        onOpenDebug={() => {
          setIsDrawerOpen(false);
          setDebugOpen(true);
        }}
        onOpenOtherApps={() => {
          setIsDrawerOpen(false);
          showToast('Additional tools and plugins coming soon', 'info');
        }}
      />

      {/* Scan Result Modal (Ported from dialog_scan_result.xml) */}
      <ScanResultModal
        isOpen={!!scanResultContent}
        content={scanResultContent || ''}
        isFavorite={records.find((r) => r.content === scanResultContent)?.isFavorite}
        onClose={() => setScanResultContent(null)}
        onCopy={(text) => {
          navigator.clipboard.writeText(text);
          showToast('Details Copied', 'success');
        }}
        onShare={(text) => {
          if (navigator.share) {
            navigator.share({ title: 'QR Code Details', text }).catch(() => {});
          } else {
            navigator.clipboard.writeText(text);
            showToast('Details Copied to clipboard', 'success');
          }
        }}
        onToggleFavorite={() => {
          const matched = records.find((r) => r.content === scanResultContent);
          if (matched) {
            handleToggleFavorite(matched.id);
            showToast(matched.isFavorite ? 'Removed from favorites' : 'Added to favorites', 'success');
          }
        }}
        onOpenUrl={handleOpenUrl}
      />

      {/* UCrop Image Cropper Modal (Ported from ActivityBrowseGallery.java) */}
      <ImageCropperModal
        isOpen={!!cropperImageSrc}
        imageSrc={cropperImageSrc}
        onClose={() => setCropperImageSrc(null)}
        onCropAndDecode={(result) => {
          setCropperImageSrc(null);
          if (result) {
            handleScanResult(result);
          }
        }}
        onShowToast={showToast}
      />

      {/* Permission Rationale Dialog (Ported from dialog_required_permission.xml) */}
      <PermissionDialog
        isOpen={!!pendingPermission}
        title="Permission needed"
        message={
          pendingPermission?.name.includes('CAMERA')
            ? 'Camera permission is needed to scan QR codes with live viewfinder.'
            : 'Storage write permission is needed to save and export generated QR code images.'
        }
        permissionName={pendingPermission?.name || 'android.permission.CAMERA'}
        onConfirm={handleConfirmPermission}
        onDecline={handleDeclinePermission}
      />

      {/* In-App Review Modal (Ported from MainActivity.java showRateApp) */}
      <RateAppModal
        isOpen={rateAppOpen}
        onClose={() => setRateAppOpen(false)}
        onSubmitRating={(stars) => {
          showToast(`Thank you for rating us ${stars} stars!`, 'success');
        }}
      />

      {/* About Modal */}
      <AboutModal
        isOpen={aboutOpen}
        onClose={() => setAboutOpen(false)}
      />

      {/* Debug & Crash Diagnostics Modal (Ported from DebugActivity.java) */}
      <DebugModal
        isOpen={debugOpen}
        error={appError}
        onClose={() => setDebugOpen(false)}
        onRestart={() => {
          setAppError(null);
          setCurrentScreen('generator');
          showToast('App reloaded', 'info');
        }}
        onShowToast={showToast}
      />

      {/* Toast Notifications Overlay (Ported from CustomToast.java & Toasty) */}
      <div 
        aria-live="polite" 
        className="absolute bottom-6 inset-x-4 flex flex-col items-center gap-2 pointer-events-none z-50"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xl border animate-in slide-in-from-bottom duration-200 ${
              toast.type === 'success'
                ? 'bg-emerald-950/95 text-emerald-200 border-emerald-800/80 shadow-emerald-950/40'
                : toast.type === 'error'
                ? 'bg-red-950/95 text-red-200 border-red-800/80 shadow-red-950/40'
                : 'bg-neutral-800/95 text-neutral-100 border-neutral-700/80 shadow-black/40'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            {toast.type === 'info' && <InfoIcon className="w-4 h-4 text-sky-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </DeviceFrame>
  );
}

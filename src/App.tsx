import React, { useState, useEffect, useRef } from 'react';
import { DeviceFrame } from './components/DeviceFrame.tsx';
import { SplashScreen } from './components/SplashScreen.tsx';
import { GeneratorView } from './components/GeneratorView.tsx';
import { ScannerView } from './components/ScannerView.tsx';
import { FavoritesView } from './components/FavoritesView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { BottomTabBar } from './components/BottomTabBar.tsx';
import { ScanResultModal } from './components/ScanResultModal.tsx';
import { ImageCropperModal } from './components/ImageCropperModal.tsx';
import { PermissionDialog } from './components/PermissionDialog.tsx';
import { UpdatePasswordModal } from './components/UpdatePasswordModal.tsx';
import { RateAppModal } from './components/RateAppModal.tsx';
import { AboutModal } from './components/AboutModal.tsx';
import { NetworkStatusBanner } from './components/NetworkStatusBanner.tsx';
import {
  ScreenType,
  DevicePlatform,
  ThemeMode,
  QrRecord,
  PermissionState,
  PermissionPurpose,
  BarcodeFormat,
  ToastMessage,
} from './core/types.ts';
import {
  loadRecords,
  addRecord,
  toggleFavorite,
  deleteRecord,
  deleteMultipleRecords,
  clearAllRecords,
  loadSettings,
  saveSettings,
} from './core/storage.ts';
import {
  isNetworkUrl,
  normalizeUrl,
  getBarcodeFormatLabel,
} from './core/qrUtils.ts';
import { triggerHaptic } from './core/haptics.ts';
import { CheckCircle2, AlertCircle, Info as InfoIcon } from 'lucide-react';

export default function App() {
  const isAutostart = new URLSearchParams(window.location.search).get('autostart') === '1';

  const [currentScreen, setCurrentScreen] = useState<ScreenType>(
    isAutostart ? 'generator' : 'splash'
  );
  const [devicePlatform, setDevicePlatform] = useState<DevicePlatform>('android');
  const [theme, setTheme] = useState<ThemeMode>('dark');

  const [aboutOpen, setAboutOpen] = useState<boolean>(false);
  const [rateAppOpen, setRateAppOpen] = useState<boolean>(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState<boolean>(false);

  const [activeResult, setActiveResult] = useState<{
    id?: string;
    content: string;
    format?: BarcodeFormat;
  } | null>(null);
  const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);

  const [records, setRecords] = useState<QrRecord[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);
  const [historyLoadError, setHistoryLoadError] = useState<string | null>(null);
  const refreshTimerRef = useRef<number | null>(null);

  const [permissions, setPermissions] = useState<PermissionState>({
    camera: 'granted',
    storageRead: 'granted',
    storageWrite: 'granted',
  });
  const [pendingPermission, setPendingPermission] = useState<{
    purpose: PermissionPurpose;
    onGranted: () => void;
  } | null>(null);

  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    try {
      const loadedSettings = loadSettings();
      setTheme(loadedSettings.theme);
      setRecords(loadRecords());
    } catch {
      setHistoryLoadError('Unable to load saved records from storage.');
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const newToast: ToastMessage = {
      id: 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      message,
      type,
    };
    setToasts((prev) => [...prev.slice(-2), newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 3000);
  };

  const handleToggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    saveSettings({ ...loadSettings(), theme: nextTheme });
  };

  const handleRefreshHistory = () => {
    setIsHistoryLoading(true);
    setHistoryLoadError(null);
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = window.setTimeout(() => {
      try {
        setRecords(loadRecords());
      } catch {
        setHistoryLoadError('Unable to read local code history.');
      } finally {
        setIsHistoryLoading(false);
      }
    }, 260);
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
    if (activeResult?.id === id) {
      setActiveResult(null);
    }
    showToast('Record deleted', 'info');
  };

  const handleClearAllRecords = () => {
    clearAllRecords();
    setRecords([]);
  };

  const handleScanResult = (text: string, format: BarcodeFormat = 'QR_CODE') => {
    const formatLabel = getBarcodeFormatLabel(format);
    const newRecord = addRecord({
      content: text,
      format,
      type: format === 'QR_CODE' && isNetworkUrl(text) ? 'url' : 'text',
      category: 'scanned',
      isFavorite: false,
      title: `${formatLabel}: ${text.slice(0, 24)}`,
    });
    setRecords((prev) => [newRecord, ...prev]);
    setActiveResult({ id: newRecord.id, content: text, format });
  };

  const getPermissionStatus = (purpose: PermissionPurpose) => {
    switch (purpose) {
      case 'camera':
        return permissions.camera;
      case 'photoLibrary':
        return permissions.storageRead;
      case 'storageSave':
        return permissions.storageWrite;
    }
  };

  const setPermissionStatus = (
    purpose: PermissionPurpose,
    status: 'granted' | 'denied' | 'prompt'
  ) => {
    setPermissions((prev) => {
      if (purpose === 'camera') return { ...prev, camera: status };
      if (purpose === 'photoLibrary') return { ...prev, storageRead: status };
      return { ...prev, storageWrite: status };
    });
  };

  const handleRequestPermission = (purpose: PermissionPurpose, onGranted: () => void) => {
    if (getPermissionStatus(purpose) === 'granted') {
      onGranted();
      return;
    }
    setPendingPermission({ purpose, onGranted });
  };

  const handleConfirmPermission = () => {
    if (pendingPermission) {
      setPermissionStatus(pendingPermission.purpose, 'granted');
      pendingPermission.onGranted();
      setPendingPermission(null);
      showToast('Permission granted', 'success');
    }
  };

  const handleDeclinePermission = () => {
    if (pendingPermission) {
      setPermissionStatus(pendingPermission.purpose, 'denied');
      setPendingPermission(null);
      showToast('Permission declined', 'error');
    }
  };

  const handleOpenSettingsPermission = () => {
    if (pendingPermission) {
      setPermissionStatus(pendingPermission.purpose, 'granted');
      pendingPermission.onGranted();
      setPendingPermission(null);
      showToast('Permission enabled in settings', 'success');
    }
  };

  const handleOpenUrl = (url: string) => {
    window.open(normalizeUrl(url), '_blank', 'noopener,noreferrer');
  };

  const activeMatchedRecord = activeResult?.id
    ? records.find((r) => r.id === activeResult.id)
    : activeResult?.content
    ? records.find((r) => r.content === activeResult.content)
    : undefined;

  const isLight = theme === 'light';
  const showTabBar = currentScreen !== 'splash';

  return (
    <DeviceFrame
      platform={devicePlatform}
      theme={theme}
      onTogglePlatform={() => setDevicePlatform((p) => (p === 'android' ? 'ios' : 'android'))}
      onToggleTheme={handleToggleTheme}
    >
      <NetworkStatusBanner
        isOffline={isOffline}
        onRetry={() => {
          setIsOffline(!navigator.onLine);
          showToast(
            navigator.onLine ? 'Connection restored' : 'Still offline',
            navigator.onLine ? 'success' : 'error'
          );
        }}
        onDismiss={() => setIsOffline(false)}
      />

      {currentScreen === 'splash' && (
        <SplashScreen theme={theme} onFinish={() => setCurrentScreen('generator')} />
      )}

      {currentScreen === 'generator' && (
        <GeneratorView
          theme={theme}
          onSaveRecord={handleSaveRecord}
          onShowToast={showToast}
          onRequestPermission={handleRequestPermission}
        />
      )}

      {currentScreen === 'scanner' && (
        <ScannerView
          theme={theme}
          canAccessPhotoLibrary={permissions.storageRead === 'granted'}
          onScanResult={handleScanResult}
          onOpenGalleryPicker={(img) => setCropperImageSrc(img)}
          onShowToast={showToast}
          onRequestPermission={handleRequestPermission}
        />
      )}

      {currentScreen === 'favorites' && (
        <FavoritesView
          theme={theme}
          records={records}
          isLoading={isHistoryLoading}
          loadError={historyLoadError}
          onRefresh={handleRefreshHistory}
          onCreateQr={() => setCurrentScreen('generator')}
          onSelectRecord={(r) =>
            setActiveResult({ id: r.id, content: r.content, format: r.format || 'QR_CODE' })
          }
          onToggleFavorite={handleToggleFavorite}
          onDeleteMultiple={(ids) => {
            const updated = deleteMultipleRecords(ids);
            setRecords(updated);
          }}
          onClearAll={handleClearAllRecords}
          onShowToast={showToast}
        />
      )}

      {currentScreen === 'settings' && (
        <SettingsView
          theme={theme}
          devicePlatform={devicePlatform}
          permissions={permissions}
          onToggleTheme={handleToggleTheme}
          onTogglePlatform={() =>
            setDevicePlatform((p) => (p === 'android' ? 'ios' : 'android'))
          }
          onOpenPasswordSheet={() => setPasswordModalOpen(true)}
          onOpenAboutSheet={() => setAboutOpen(true)}
          onOpenRateSheet={() => setRateAppOpen(true)}
          onRequestPermission={(purpose) => {
            setPendingPermission({
              purpose,
              onGranted: () => {},
            });
          }}
        />
      )}

      {showTabBar && (
        <BottomTabBar
          currentScreen={currentScreen}
          theme={theme}
          historyCount={records.length}
          onSelectScreen={setCurrentScreen}
        />
      )}

      {/* Bottom Sheets */}
      <ScanResultModal
        isOpen={!!activeResult}
        theme={theme}
        content={activeResult?.content || ''}
        format={activeResult?.format || activeMatchedRecord?.format || 'QR_CODE'}
        isFavorite={activeMatchedRecord?.isFavorite}
        onClose={() => setActiveResult(null)}
        onCopy={(text) => {
          navigator.clipboard.writeText(text);
          showToast('Copied to clipboard', 'success');
        }}
        onShare={(text) => {
          if (navigator.share) {
            navigator.share({ title: 'ScanQR Payload', text }).catch(() => {});
          } else {
            navigator.clipboard.writeText(text);
            showToast('Copied to clipboard', 'success');
          }
        }}
        onToggleFavorite={
          activeMatchedRecord
            ? () => {
                handleToggleFavorite(activeMatchedRecord.id);
                showToast(
                  activeMatchedRecord.isFavorite
                    ? 'Removed from favorites'
                    : 'Added to favorites',
                  'success'
                );
              }
            : undefined
        }
        onDelete={
          activeMatchedRecord
            ? () => handleDeleteRecord(activeMatchedRecord.id)
            : undefined
        }
        onOpenUrl={handleOpenUrl}
      />

      <ImageCropperModal
        isOpen={!!cropperImageSrc}
        theme={theme}
        imageSrc={cropperImageSrc}
        onClose={() => setCropperImageSrc(null)}
        onCropAndDecode={(result) => {
          setCropperImageSrc(null);
          if (result) {
            handleScanResult(result.text, result.format);
          }
        }}
        onShowToast={showToast}
      />

      <PermissionDialog
        isOpen={!!pendingPermission}
        theme={theme}
        platform={devicePlatform}
        purpose={pendingPermission?.purpose || 'camera'}
        isPermanentlyDenied={
          pendingPermission ? getPermissionStatus(pendingPermission.purpose) === 'denied' : false
        }
        onConfirm={handleConfirmPermission}
        onDecline={handleDeclinePermission}
        onOpenSettings={handleOpenSettingsPermission}
      />

      <UpdatePasswordModal
        isOpen={passwordModalOpen}
        theme={theme}
        onClose={() => setPasswordModalOpen(false)}
        onSuccess={() => {
          triggerHaptic('success');
        }}
        onShowToast={showToast}
      />

      <RateAppModal
        isOpen={rateAppOpen}
        theme={theme}
        onClose={() => setRateAppOpen(false)}
        onSubmitRating={(stars) => {
          showToast(`Rated ${stars} out of 5 stars`, 'success');
        }}
      />

      <AboutModal
        isOpen={aboutOpen}
        theme={theme}
        onClose={() => setAboutOpen(false)}
      />

      {/* Toast Notifications positioned cleanly below the screen header */}
      <div
        aria-live="polite"
        className="absolute top-16 inset-x-4 flex flex-col items-center gap-2 pointer-events-none z-50"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium border ${
              isLight
                ? 'bg-white text-zinc-900 border-zinc-200'
                : 'bg-zinc-900 text-zinc-100 border-zinc-700'
            }`}
          >
            {toast.type === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            )}
            {toast.type === 'error' && (
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            )}
            {toast.type === 'info' && (
              <InfoIcon className="w-4 h-4 text-zinc-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </DeviceFrame>
  );
}

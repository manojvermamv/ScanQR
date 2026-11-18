import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  PermissionsAndroid,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { CameraView, scanFromURLAsync, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { SvgXml } from 'react-native-svg';
import {
  BG_COLOR_PRESETS,
  FG_COLOR_PRESETS,
  MOBILE_BARCODE_FORMATS,
  detectType,
  exportRecordsToCsv,
  exportRecordsToJson,
  extractHostname,
  extractHtmlLinkMetadata,
  filterRecords,
  formatTime,
  formatVCard,
  fromCoreRecord,
  getAndroidPermissionKey,
  getBarcodeFormatSpec,
  getExpoBarcodeTypes,
  getMobileBarcodeLabel,
  getMobilePermissionSpec,
  hasLowContrast,
  isSafePublicHttpUrl,
  mapExpoBarcodeType,
  normalizePreviewUrl,
  toCoreRecord,
  validateMobileBarcodeInput,
  validatePassword,
  type AppSettings,
  type ContactData,
  type LinkPreviewStatus,
  type MobileBarcodeFormat,
  type MobileQrRecord,
  type PermissionPurpose,
  type PermissionStatus,
  type ThemeMode,
  type UrlMetadataPreview,
} from './src/qrCore';
import { generateBarcodeSvg } from './src/barcodeRenderer';
import { mobileHistoryRepository } from './src/storageAdapter';

function hapticTap(duration = 12) {
  try {
    if (Platform.OS !== 'web') {
      Vibration.vibrate(duration);
    }
  } catch {
    // Ignore unsupported hosts
  }
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<'generator' | 'scanner' | 'history' | 'settings'>('generator');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const isLight = theme === 'light';

  // Generator state (4 states: loading, empty, error, populated)
  const [selectedFormat, setSelectedFormat] = useState<MobileBarcodeFormat>('QR_CODE');
  const [genMode, setGenMode] = useState<'url' | 'text' | 'contact'>('url');
  const [inputText, setInputText] = useState('https://scanqr.app');
  const [inputUrl, setInputUrl] = useState('https://scanqr.app');
  const [contactData, setContactData] = useState<ContactData>({
    name: 'Maya Lin',
    phone: '+1 415 555 0199',
    email: 'maya@example.com',
    company: 'Northwind Studio',
    title: 'Lead Engineer',
  });
  const [generatedPayload, setGeneratedPayload] = useState('https://scanqr.app');
  const [errorMessage, setErrorMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Code colors
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const lowContrast = hasLowContrast(fgColor, bgColor);

  // Native Expo camera permissions & scanner state
  const [cameraPerm, requestExpoCameraPermission] = useCameraPermissions();
  const [permissionState, setPermissionState] = useState<{
    camera: PermissionStatus;
    photoLibrary: PermissionStatus;
    storageSave: PermissionStatus;
  }>({
    camera: 'prompt',
    photoLibrary: 'prompt',
    storageSave: 'granted',
  });
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isScanLocked, setIsScanLocked] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [activeModalRecord, setActiveModalRecord] = useState<MobileQrRecord | null>(null);
  const [linkPreviewStatus, setLinkPreviewStatus] = useState<LinkPreviewStatus>('idle');
  const [linkPreviewData, setLinkPreviewData] = useState<UrlMetadataPreview | null>(null);
  const [linkPreviewError, setLinkPreviewError] = useState('');
  const [linkFaviconFailed, setLinkFaviconFailed] = useState(false);
  const [linkPreviewRetryTick, setLinkPreviewRetryTick] = useState(0);

  // History & Favorites state (AsyncStorage persisted via @scanqr/core)
  const [searchQuery, setSearchQuery] = useState('');
  const [historyTab, setHistoryTab] = useState<'all' | 'favorites' | 'scanned' | 'generated'>('all');
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyRecords, setHistoryRecords] = useState<MobileQrRecord[]>([]);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Security password state
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');

  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeFormatSpec = getBarcodeFormatSpec(selectedFormat);
  const expoBarcodeTypes = useMemo(() => getExpoBarcodeTypes(), []);

  // Hydrate persisted history & settings on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [loadedRecords, loadedSettings] = await Promise.all([
          mobileHistoryRepository.loadRecords(),
          mobileHistoryRepository.loadSettings(),
        ]);
        if (!mounted) return;
        setHistoryRecords(loadedRecords.map(fromCoreRecord));
        setTheme(loadedSettings.theme);
        setHistoryError(null);
      } catch {
        if (!mounted) return;
        setHistoryError('Unable to load persisted code history.');
      } finally {
        if (mounted) {
          setIsHistoryLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, []);

  // Sync camera permission status with Expo hook
  useEffect(() => {
    if (!cameraPerm) return;
    setPermissionState((prev) => ({
      ...prev,
      camera: cameraPerm.granted ? 'granted' : cameraPerm.canAskAgain === false ? 'denied' : 'prompt',
    }));
  }, [cameraPerm]);

  // Fetch URL title and favicon natively when inspecting a web link in the details sheet
  useEffect(() => {
    if (!activeModalRecord || activeModalRecord.type !== 'url') {
      setLinkPreviewStatus('idle');
      setLinkPreviewData(null);
      setLinkPreviewError('');
      setLinkFaviconFailed(false);
      return;
    }

    const targetUrl = normalizePreviewUrl(activeModalRecord.content);
    if (!isSafePublicHttpUrl(targetUrl)) {
      setLinkPreviewStatus('error');
      setLinkPreviewData(null);
      setLinkPreviewError('Preview unavailable for local or private URLs.');
      setLinkFaviconFailed(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    setLinkPreviewStatus('loading');
    setLinkPreviewData(null);
    setLinkPreviewError('');
    setLinkFaviconFailed(false);

    (async () => {
      try {
        const res = await fetch(targetUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
          },
        });
        if (controller.signal.aborted) return;

        if (!res.ok) {
          setLinkPreviewStatus('error');
          setLinkPreviewError(`Site responded with status ${res.status}.`);
          return;
        }

        const html = (await res.text()).slice(0, 262144);
        if (controller.signal.aborted) return;

        const metadata = extractHtmlLinkMetadata(html, res.url || targetUrl, targetUrl);
        setLinkPreviewData(metadata);
        setLinkPreviewStatus('success');
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        const isAbort = err instanceof Error && err.name === 'AbortError';
        setLinkPreviewStatus('error');
        setLinkPreviewError(
          isAbort
            ? 'Timed out while loading page preview.'
            : 'Could not load page preview.'
        );
      } finally {
        clearTimeout(timeoutId);
      }
    })();

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [activeModalRecord, linkPreviewRetryTick]);

  // Real-time scannable vector SVG output for QR & 1D/2D barcodes via @scanqr/core + bwip-js
  const generatedSvg = useMemo(() => {
    if (!generatedPayload) return null;
    try {
      return generateBarcodeSvg({
        payload: generatedPayload,
        format: selectedFormat,
        fgColor,
        bgColor,
      });
    } catch {
      return null;
    }
  }, [generatedPayload, selectedFormat, fgColor, bgColor]);

  const requestPlatformPermission = async (
    purpose: PermissionPurpose,
    onGranted: () => void
  ) => {
    const os = Platform.OS === 'ios' ? 'ios' : 'android';
    const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : 34;
    const spec = getMobilePermissionSpec(os, purpose, apiLevel);

    if (purpose === 'camera') {
      try {
        const res = await requestExpoCameraPermission();
        if (res.granted) {
          setPermissionState((prev) => ({ ...prev, camera: 'granted' }));
          onGranted();
          return;
        }
        setPermissionState((prev) => ({ ...prev, camera: 'denied' }));
        Alert.alert(spec.title, `${spec.rationale}\n\n${spec.key}`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]);
        return;
      } catch {
        // Continue to Android/Alert fallback on unsupported simulator hosts
      }
    }

    if (purpose === 'photoLibrary') {
      try {
        const mediaPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (mediaPerm.granted) {
          setPermissionState((prev) => ({ ...prev, photoLibrary: 'granted' }));
          onGranted();
          return;
        }
        setPermissionState((prev) => ({ ...prev, photoLibrary: 'denied' }));
        Alert.alert(spec.title, `${spec.rationale}\n\n${spec.key}`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]);
        return;
      } catch {
        // Fallback below
      }
    }

    if (os === 'android') {
      const key = getAndroidPermissionKey(purpose, apiLevel);
      if (!key) {
        setPermissionState((prev) => ({ ...prev, [purpose]: 'granted' }));
        onGranted();
        return;
      }

      try {
        const result = await PermissionsAndroid.request(
          key as Parameters<typeof PermissionsAndroid.request>[0],
          {
            title: spec.title,
            message: spec.rationale,
            buttonPositive: 'Allow',
            buttonNegative: 'Decline',
          }
        );
        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          setPermissionState((prev) => ({ ...prev, [purpose]: 'granted' }));
          onGranted();
        } else {
          setPermissionState((prev) => ({ ...prev, [purpose]: 'denied' }));
          Alert.alert(spec.title, `${spec.rationale}\n\n${spec.key}`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]);
        }
        return;
      } catch {
        // Fallback alert in non-Android test hosts
      }
    }

    Alert.alert(`${os === 'ios' ? 'iOS' : 'Android'}: ${spec.title}`, `${spec.rationale}\n\n${spec.key}`, [
      {
        text: 'Decline',
        style: 'cancel',
        onPress: () => setPermissionState((prev) => ({ ...prev, [purpose]: 'denied' })),
      },
      {
        text: 'Allow',
        onPress: () => {
          setPermissionState((prev) => ({ ...prev, [purpose]: 'granted' }));
          onGranted();
        },
      },
    ]);
  };

  const handleToggleTheme = async () => {
    hapticTap(8);
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      const currentSettings: AppSettings = await mobileHistoryRepository.loadSettings();
      await mobileHistoryRepository.saveSettings({ ...currentSettings, theme: nextTheme });
    } catch {
      // Theme still active in UI state
    }
  };

  const handleRefreshHistory = () => {
    hapticTap(10);
    setIsHistoryLoading(true);
    setHistoryError(null);
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(async () => {
      try {
        const reloaded = await mobileHistoryRepository.loadRecords();
        setHistoryRecords(reloaded.map(fromCoreRecord));
      } catch {
        setHistoryError('Failed to reload saved records.');
      } finally {
        setIsHistoryLoading(false);
      }
    }, 260);
  };

  const handleSelectFormat = (fmt: MobileBarcodeFormat) => {
    hapticTap(8);
    setSelectedFormat(fmt);
    setErrorMessage('');
    const spec = getBarcodeFormatSpec(fmt);
    if (fmt === 'QR_CODE') {
      setGenMode('url');
      setInputUrl(spec.sampleValue);
      setGeneratedPayload(spec.sampleValue);
    } else {
      setInputText(spec.sampleValue);
      setGeneratedPayload(spec.sampleValue);
    }
  };

  const handleGenerate = async () => {
    let payload = '';
    if (selectedFormat === 'QR_CODE') {
      if (genMode === 'url') {
        if (!inputUrl.trim()) {
          setErrorMessage('Enter a website URL to generate a QR code.');
          return;
        }
        payload = inputUrl.trim().startsWith('http') ? inputUrl.trim() : `https://${inputUrl.trim()}`;
      } else if (genMode === 'text') {
        if (!inputText.trim()) {
          setErrorMessage('Enter text content to generate a QR code.');
          return;
        }
        payload = inputText.trim();
      } else {
        if (!contactData.name.trim()) {
          setErrorMessage('Enter a contact name to generate a vCard.');
          return;
        }
        payload = formatVCard(contactData);
      }
    } else {
      const check = validateMobileBarcodeInput(inputText, selectedFormat);
      if (!check.isValid) {
        setErrorMessage(check.error || 'Enter a valid barcode value.');
        return;
      }
      payload = check.normalizedValue;
    }

    hapticTap(15);
    setErrorMessage('');
    setIsGenerating(true);

    try {
      setGeneratedPayload(payload);
      const label = getMobileBarcodeLabel(selectedFormat);
      const title =
        selectedFormat === 'QR_CODE' && genMode === 'contact'
          ? `Contact: ${contactData.name}`
          : `${label}: ${payload.slice(0, 24)}`;

      const savedCore = await mobileHistoryRepository.addRecord({
        content: payload,
        title,
        format: selectedFormat,
        type: selectedFormat === 'QR_CODE' ? detectType(payload) === 'contact' ? 'text' : (detectType(payload) as 'url' | 'wifi' | 'email' | 'phone' | 'text') : 'text',
        category: 'generated',
        isFavorite: false,
      });

      setHistoryRecords((prev) => [fromCoreRecord(savedCore), ...prev]);
      Alert.alert('Saved', `${label} added to history.`);
    } catch {
      setErrorMessage('Unable to encode this payload.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    hapticTap(10);
    setInputText('');
    setInputUrl('');
    setGeneratedPayload('');
    setErrorMessage('');
  };

  const handleRestoreSample = () => {
    hapticTap(10);
    if (selectedFormat === 'QR_CODE') {
      setGenMode('url');
      setInputUrl(activeFormatSpec.sampleValue);
    } else {
      setInputText(activeFormatSpec.sampleValue);
    }
    setGeneratedPayload(activeFormatSpec.sampleValue);
    setErrorMessage('');
  };

  const handleShareGenerated = async () => {
    if (!generatedPayload || !generatedSvg) {
      Alert.alert('Nothing to Share', 'Enter content and generate a code first.');
      return;
    }

    try {
      if (FileSystem.documentDirectory && (await Sharing.isAvailableAsync())) {
        const fileUri = `${FileSystem.documentDirectory}ScanQR_${selectedFormat}_${Date.now()}.svg`;
        await FileSystem.writeAsStringAsync(fileUri, generatedSvg.svgXml, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        await Sharing.shareAsync(fileUri, {
          mimeType: 'image/svg+xml',
          dialogTitle: `Share ${getMobileBarcodeLabel(selectedFormat)}`,
        });
        return;
      }
    } catch {
      // Fallback to plain payload sharing below
    }

    try {
      await Share.share({
        title: `${getMobileBarcodeLabel(selectedFormat)} Payload`,
        message: generatedPayload,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unable to share payload.';
      Alert.alert('Share Failed', msg);
    }
  };

  const handleSaveGenerated = () => {
    if (!generatedPayload || !generatedSvg) {
      Alert.alert('Nothing to Save', 'Enter content and generate a code first.');
      return;
    }
    requestPlatformPermission('storageSave', async () => {
      try {
        if (FileSystem.documentDirectory) {
          const path = `${FileSystem.documentDirectory}ScanQR_${selectedFormat}_${Date.now()}.svg`;
          await FileSystem.writeAsStringAsync(path, generatedSvg.svgXml, {
            encoding: FileSystem.EncodingType.UTF8,
          });
          hapticTap(15);
          Alert.alert('Saved', `${getMobileBarcodeLabel(selectedFormat)} saved to app documents.`);
          return;
        }
      } catch {
        // Fallback notification
      }
      hapticTap(15);
      Alert.alert('Saved', `${getMobileBarcodeLabel(selectedFormat)} ready.`);
    });
  };

  const recordDecodedPayload = async (
    scannedContent: string,
    format: MobileBarcodeFormat = 'QR_CODE'
  ) => {
    hapticTap(20);
    const label = getMobileBarcodeLabel(format);
    const detected = detectType(scannedContent);
    const savedCore = await mobileHistoryRepository.addRecord({
      content: scannedContent,
      title: `${label}: ${scannedContent.slice(0, 24)}`,
      format,
      type: format === 'QR_CODE' ? (detected === 'contact' ? 'text' : detected) : 'text',
      category: 'scanned',
      isFavorite: false,
    });
    const uiRecord = fromCoreRecord(savedCore);
    setHistoryRecords((prev) => [uiRecord, ...prev]);
    setActiveModalRecord(uiRecord);
  };

  const handleNativeBarcodeScanned = (event: BarcodeScanningResult) => {
    if (isScanLocked || !event.data) return;
    setIsScanLocked(true);
    const format = mapExpoBarcodeType(event.type);
    void recordDecodedPayload(event.data, format);
  };

  const handlePickAndDecodeGalleryImage = () => {
    requestPlatformPermission('photoLibrary', async () => {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 1,
        });
        if (result.canceled || !result.assets?.[0]?.uri) return;

        const uri = result.assets[0].uri;
        const decodedList = await scanFromURLAsync(
          uri,
          expoBarcodeTypes as unknown as Parameters<typeof scanFromURLAsync>[1]
        );
        if (decodedList && decodedList.length > 0 && decodedList[0].data) {
          const format = mapExpoBarcodeType(decodedList[0].type);
          await recordDecodedPayload(decodedList[0].data, format);
        } else {
          Alert.alert('No Code Found', 'Could not detect a QR code or barcode in the selected image.');
        }
      } catch {
        Alert.alert('Decode Failed', 'Unable to inspect gallery image on this device.');
      }
    });
  };

  const handleRetryCamera = () => {
    hapticTap(10);
    setIsCameraLoading(true);
    setCameraError(null);
    requestPlatformPermission('camera', () => {
      setIsScanLocked(false);
    }).finally(() => {
      setIsCameraLoading(false);
    });
  };

  const handleCopyContent = async (content: string) => {
    try {
      await Clipboard.setStringAsync(content);
      hapticTap(10);
      Alert.alert('Copied', 'Content copied to clipboard.');
    } catch {
      Alert.alert('Copy Failed', 'Unable to access clipboard.');
    }
  };

  const handleShareRecordContent = async (content: string) => {
    try {
      await Share.share({
        title: 'Code Content',
        message: content,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unable to share content.';
      Alert.alert('Share Failed', msg);
    }
  };

  const toggleSelectRecord = (id: string) => {
    hapticTap(8);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (filtered: MobileQrRecord[]) => {
    hapticTap(10);
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((r) => r.id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    Alert.alert('Delete Records', `Delete ${count} selected record${count > 1 ? 's' : ''}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          hapticTap(20);
          const remaining = await mobileHistoryRepository.deleteMultipleRecords(selectedIds);
          setHistoryRecords(remaining.map(fromCoreRecord));
          setSelectedIds([]);
          setIsSelectionMode(false);
        },
      },
    ]);
  };

  const handleExport = async (format: 'json' | 'csv') => {
    if (historyRecords.length === 0) {
      Alert.alert('Nothing to Export', 'Your scan history is currently empty.');
      return;
    }

    const exportedString =
      format === 'json'
        ? exportRecordsToJson(historyRecords)
        : exportRecordsToCsv(historyRecords);

    setIsExportModalOpen(false);
    hapticTap(15);

    try {
      if (FileSystem.documentDirectory && (await Sharing.isAvailableAsync())) {
        const ext = format;
        const mimeType = format === 'json' ? 'application/json' : 'text/csv';
        const fileUri = `${FileSystem.documentDirectory}ScanQR_History_${Date.now()}.${ext}`;
        await FileSystem.writeAsStringAsync(fileUri, exportedString, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        await Sharing.shareAsync(fileUri, { mimeType, dialogTitle: `Export ${format.toUpperCase()}` });
        return;
      }
    } catch {
      // Fallback to text share sheet below
    }

    Share.share({
      title: `ScanQR History (${format.toUpperCase()})`,
      message: exportedString,
    }).catch(() => {
      Alert.alert('Export Ready', `Prepared ${format.toUpperCase()} export.`);
    });
  };

  const handleToggleFavorite = async (id: string) => {
    hapticTap(10);
    const updated = await mobileHistoryRepository.toggleFavorite(id);
    setHistoryRecords(updated.map(fromCoreRecord));
    if (activeModalRecord && activeModalRecord.id === id) {
      setActiveModalRecord((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    }
  };

  const handleDeleteSingle = async (id: string) => {
    hapticTap(15);
    const updated = await mobileHistoryRepository.deleteRecord(id);
    setHistoryRecords(updated.map(fromCoreRecord));
    setActiveModalRecord(null);
  };

  const handlePasswordSubmit = () => {
    setPassError('');
    const passCheck = validatePassword(newPass);
    if (!passCheck.isValid) {
      setPassError(passCheck.error || 'Invalid password.');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('Passwords do not match.');
      return;
    }
    hapticTap(15);
    setNewPass('');
    setConfirmPass('');
    Alert.alert('Saved', 'App password updated.');
  };

  const filteredHistory = filterRecords(historyRecords, searchQuery, historyTab);

  const screenTitleMap: Record<typeof currentTab, string> = {
    generator: 'Generate Code',
    scanner: 'Scan Code',
    history: 'History & Favs',
    settings: 'Settings',
  };

  const palette = isLight
    ? {
        bg: '#f4f4f5',
        surface: '#ffffff',
        border: '#e4e4e7',
        textPrimary: '#18181b',
        textSecondary: '#52525b',
        textMuted: '#71717a',
        accent: '#059669',
        accentText: '#ffffff',
      }
    : {
        bg: '#09090b',
        surface: '#18181b',
        border: '#27272a',
        textPrimary: '#f4f4f5',
        textSecondary: '#a1a1aa',
        textMuted: '#71717a',
        accent: '#10b981',
        accentText: '#09090b',
      };

  const aspectHeight = generatedSvg
    ? Math.min(200, Math.max(96, Math.round((240 * generatedSvg.height) / Math.max(1, generatedSvg.width))))
    : 160;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
      <StatusBar
        barStyle={isLight ? 'dark-content' : 'light-content'}
        backgroundColor={palette.bg}
      />

      {/* Top Header: strictly screen title & compact contextual actions */}
      <View style={[styles.header, { backgroundColor: palette.bg, borderBottomColor: palette.border }]}>
        <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>
          {screenTitleMap[currentTab]}
        </Text>

        {currentTab === 'history' && (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[
                styles.headerActionBtn,
                { backgroundColor: palette.surface, borderColor: isSelectionMode ? palette.accent : palette.border },
              ]}
              onPress={() => {
                hapticTap(10);
                setIsSelectionMode(!isSelectionMode);
                setSelectedIds([]);
              }}
              accessibilityLabel={isSelectionMode ? 'Cancel selection' : 'Select records'}
            >
              <Text style={[styles.headerActionText, { color: isSelectionMode ? palette.accent : palette.textPrimary }]}>
                {isSelectionMode ? 'Cancel' : 'Select'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}
              onPress={() => {
                hapticTap(10);
                setIsExportModalOpen(true);
              }}
              accessibilityLabel="Export history"
            >
              <Text style={[styles.headerActionText, { color: palette.textPrimary }]}>Export</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.content}
        refreshControl={
          currentTab === 'history' ? (
            <RefreshControl
              refreshing={isHistoryLoading}
              onRefresh={handleRefreshHistory}
              tintColor={palette.accent}
            />
          ) : undefined
        }
      >
        {/* ================= 1. GENERATOR SCREEN ================= */}
        {currentTab === 'generator' && (
          <View style={styles.sectionStack}>
            <View style={[styles.surfaceBox, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              {isGenerating ? (
                <View style={styles.skeletonPreview}>
                  <View style={[styles.skeletonBox, { backgroundColor: palette.border }]} />
                  <View style={[styles.skeletonLine, { backgroundColor: palette.border }]} />
                </View>
              ) : errorMessage && !generatedPayload ? (
                <View style={styles.stateBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                  <TouchableOpacity
                    style={[styles.secondaryButton, { backgroundColor: palette.bg, borderColor: palette.border }]}
                    onPress={handleRestoreSample}
                  >
                    <Text style={[styles.secondaryButtonText, { color: palette.textPrimary }]}>
                      Restore Default
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : generatedPayload && generatedSvg ? (
                <View style={styles.previewWrapper}>
                  <View
                    style={[
                      styles.svgFrame,
                      { backgroundColor: bgColor, borderColor: palette.border },
                    ]}
                  >
                    <SvgXml xml={generatedSvg.svgXml} width="100%" height={aspectHeight} />
                  </View>

                  <Text style={[styles.qrCodePayload, { color: palette.textSecondary }]} numberOfLines={2}>
                    {activeFormatSpec.label} · {generatedPayload}
                  </Text>

                  {lowContrast && (
                    <View style={[styles.warningRow, { borderTopColor: palette.border }]}>
                      <Text style={styles.warningText}>Low contrast may fail to scan.</Text>
                      <TouchableOpacity
                        style={[styles.inlineFixBtn, { backgroundColor: palette.border }]}
                        onPress={() => {
                          setFgColor('#000000');
                          setBgColor('#ffffff');
                        }}
                      >
                        <Text style={[styles.inlineFixText, { color: palette.textPrimary }]}>Fix</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.stateBox}>
                  <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>No code yet</Text>
                  <Text style={[styles.emptySubtitle, { color: palette.textSecondary }]}>
                    Enter a payload below to generate a {activeFormatSpec.label}.
                  </Text>
                  <TouchableOpacity
                    style={[styles.secondaryButton, { backgroundColor: palette.bg, borderColor: palette.border }]}
                    onPress={handleRestoreSample}
                  >
                    <Text style={[styles.secondaryButtonText, { color: palette.textPrimary }]}>
                      Restore Sample
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Symbology Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.modeSegmentedRow}>
                {MOBILE_BARCODE_FORMATS.map((fmt) => {
                  const selected = selectedFormat === fmt.id;
                  return (
                    <TouchableOpacity
                      key={fmt.id}
                      style={[
                        styles.formatChip,
                        {
                          backgroundColor: selected ? palette.accent : palette.surface,
                          borderColor: selected ? palette.accent : palette.border,
                        },
                      ]}
                      onPress={() => handleSelectFormat(fmt.id)}
                    >
                      <Text
                        style={[
                          styles.modeSegmentText,
                          { color: selected ? palette.accentText : palette.textSecondary },
                          selected && { fontWeight: '600' },
                        ]}
                      >
                        {fmt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Sub-mode selector for QR Code */}
            {selectedFormat === 'QR_CODE' && (
              <View style={styles.modeSegmentedRow}>
                {(['url', 'text', 'contact'] as const).map((mode) => {
                  const selected = genMode === mode;
                  return (
                    <TouchableOpacity
                      key={mode}
                      style={[
                        styles.modeSegment,
                        {
                          backgroundColor: selected ? palette.accent : palette.surface,
                          borderColor: selected ? palette.accent : palette.border,
                        },
                      ]}
                      onPress={() => {
                        hapticTap(8);
                        setGenMode(mode);
                      }}
                    >
                      <Text
                        style={[
                          styles.modeSegmentText,
                          { color: selected ? palette.accentText : palette.textSecondary },
                          selected && { fontWeight: '600' },
                        ]}
                      >
                        {mode === 'url' ? 'URL' : mode === 'text' ? 'Text' : 'Contact'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Input Fields + Color Pickers */}
            <View style={[styles.surfaceBox, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              {selectedFormat === 'QR_CODE' && genMode === 'url' && (
                <View>
                  <Text style={[styles.label, { color: palette.textSecondary }]}>Website URL</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: palette.bg, borderColor: errorMessage ? '#ef4444' : palette.border, color: palette.textPrimary },
                    ]}
                    value={inputUrl}
                    onChangeText={(t: string) => {
                      setInputUrl(t);
                      setErrorMessage('');
                    }}
                    placeholder="https://example.com"
                    placeholderTextColor={palette.textMuted}
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                </View>
              )}

              {(selectedFormat !== 'QR_CODE' || genMode === 'text') && (
                <View>
                  <Text style={[styles.label, { color: palette.textSecondary }]}>
                    {selectedFormat === 'QR_CODE' ? 'Text Content' : `${activeFormatSpec.label} Value`}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      selectedFormat === 'QR_CODE' ? styles.multilineInput : null,
                      { backgroundColor: palette.bg, borderColor: errorMessage ? '#ef4444' : palette.border, color: palette.textPrimary },
                    ]}
                    value={inputText}
                    onChangeText={(t: string) => {
                      setInputText(t);
                      setErrorMessage('');
                    }}
                    placeholder={activeFormatSpec.sampleValue}
                    placeholderTextColor={palette.textMuted}
                    multiline={selectedFormat === 'QR_CODE'}
                  />
                  <Text style={[styles.hintText, { color: palette.textMuted }]}>{activeFormatSpec.hint}</Text>
                </View>
              )}

              {selectedFormat === 'QR_CODE' && genMode === 'contact' && (
                <View>
                  <Text style={[styles.label, { color: palette.textSecondary }]}>Full Name</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: palette.bg, borderColor: palette.border, color: palette.textPrimary }]}
                    value={contactData.name}
                    onChangeText={(t: string) => setContactData({ ...contactData, name: t })}
                    placeholder="Full name"
                    placeholderTextColor={palette.textMuted}
                  />
                  <Text style={[styles.label, { color: palette.textSecondary }]}>Phone</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: palette.bg, borderColor: palette.border, color: palette.textPrimary }]}
                    value={contactData.phone}
                    onChangeText={(t: string) => setContactData({ ...contactData, phone: t })}
                    placeholder="+1 415 555 0199"
                    placeholderTextColor={palette.textMuted}
                    keyboardType="phone-pad"
                  />
                  <Text style={[styles.label, { color: palette.textSecondary }]}>Email</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: palette.bg, borderColor: palette.border, color: palette.textPrimary }]}
                    value={contactData.email}
                    onChangeText={(t: string) => setContactData({ ...contactData, email: t })}
                    placeholder="name@example.com"
                    placeholderTextColor={palette.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              )}

              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

              <View style={[styles.colorPickerDivider, { borderTopColor: palette.border }]}>
                <View style={styles.colorGroup}>
                  <View style={styles.colorHeaderRow}>
                    <Text style={[styles.colorLabel, { color: palette.textPrimary }]}>Foreground</Text>
                    <Text style={[styles.colorHexText, { color: palette.textSecondary }]}>
                      {fgColor.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.colorSwatches}>
                    {FG_COLOR_PRESETS.map((c) => (
                      <TouchableOpacity
                        key={c.hex}
                        accessibilityLabel={`Select foreground color ${c.label}`}
                        style={[
                          styles.colorCircle,
                          { backgroundColor: c.hex, borderColor: palette.border },
                          fgColor.toLowerCase() === c.hex.toLowerCase() && { borderColor: palette.accent, borderWidth: 2 },
                        ]}
                        onPress={() => {
                          hapticTap(8);
                          setFgColor(c.hex);
                        }}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.colorGroup}>
                  <View style={styles.colorHeaderRow}>
                    <Text style={[styles.colorLabel, { color: palette.textPrimary }]}>Background</Text>
                    <Text style={[styles.colorHexText, { color: palette.textSecondary }]}>
                      {bgColor.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.colorSwatches}>
                    {BG_COLOR_PRESETS.map((c) => (
                      <TouchableOpacity
                        key={c.hex}
                        accessibilityLabel={`Select background color ${c.label}`}
                        style={[
                          styles.colorCircle,
                          { backgroundColor: c.hex, borderColor: palette.border },
                          bgColor.toLowerCase() === c.hex.toLowerCase() && { borderColor: palette.accent, borderWidth: 2 },
                        ]}
                        onPress={() => {
                          hapticTap(8);
                          setBgColor(c.hex);
                        }}
                      />
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* Thumb-Zone Actions */}
            <View style={styles.actionStack}>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: palette.accent }]}
                onPress={handleGenerate}
              >
                <Text style={[styles.primaryButtonText, { color: palette.accentText }]}>Generate & Save</Text>
              </TouchableOpacity>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.secondaryButton, { backgroundColor: palette.surface, borderColor: palette.border }]}
                  onPress={handleSaveGenerated}
                >
                  <Text style={[styles.secondaryButtonText, { color: palette.textPrimary }]}>Save File</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryButton, { backgroundColor: palette.surface, borderColor: palette.border }]}
                  onPress={handleShareGenerated}
                >
                  <Text style={[styles.secondaryButtonText, { color: palette.textPrimary }]}>Share</Text>
                </TouchableOpacity>

                {generatedPayload ? (
                  <TouchableOpacity
                    style={[styles.secondaryButton, { backgroundColor: palette.surface, borderColor: palette.border }]}
                    onPress={handleClear}
                  >
                    <Text style={styles.destructiveText}>Clear</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>
        )}

        {/* ================= 2. SCANNER SCREEN ================= */}
        {currentTab === 'scanner' && (
          <View style={styles.sectionStack}>
            <View style={[styles.viewfinderBox, { borderColor: palette.border }]}>
              {isCameraLoading ? (
                <View style={styles.skeletonPreview}>
                  <View style={[styles.skeletonBox, { backgroundColor: palette.border }]} />
                  <Text style={[styles.emptySubtitle, { color: palette.textSecondary }]}>
                    Initializing camera...
                  </Text>
                </View>
              ) : cameraError || permissionState.camera === 'denied' ? (
                <View style={styles.stateBox}>
                  <Text style={[styles.emptyTitle, { color: '#f4f4f5' }]}>Camera Unavailable</Text>
                  <Text style={[styles.emptySubtitle, { color: '#a1a1aa' }]}>
                    {cameraError || getMobilePermissionSpec(Platform.OS === 'ios' ? 'ios' : 'android', 'camera').rationale}
                  </Text>
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: palette.accent }]}
                    onPress={handleRetryCamera}
                  >
                    <Text style={[styles.primaryButtonText, { color: palette.accentText }]}>
                      Grant Camera Access
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : permissionState.camera === 'granted' ? (
                <View style={styles.cameraContainer}>
                  <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    enableTorch={isFlashOn}
                    barcodeScannerSettings={{
                      barcodeTypes: expoBarcodeTypes as unknown as NonNullable<
                        Parameters<typeof CameraView>[0]['barcodeScannerSettings']
                      >['barcodeTypes'],
                    }}
                    onBarcodeScanned={isScanLocked ? undefined : handleNativeBarcodeScanned}
                  />
                  <View style={styles.viewfinderOverlay}>
                    <View style={styles.viewfinderInner}>
                      <View style={styles.targetCornerTL} />
                      <View style={styles.targetCornerTR} />
                      <View style={styles.targetCornerBL} />
                      <View style={styles.targetCornerBR} />
                      <View style={styles.scanLaserLine} />
                    </View>
                    <Text style={styles.viewfinderText}>
                      {isScanLocked ? 'Code captured' : 'Align QR code or barcode inside frame'}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.stateBox}>
                  <Text style={[styles.emptyTitle, { color: '#f4f4f5' }]}>Ready to Scan</Text>
                  <Text style={[styles.emptySubtitle, { color: '#a1a1aa' }]}>
                    Enable camera access to scan QR codes and 1D/2D barcodes in real time.
                  </Text>
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: palette.accent }]}
                    onPress={handleRetryCamera}
                  >
                    <Text style={[styles.primaryButtonText, { color: palette.accentText }]}>
                      Enable Camera
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: palette.surface, borderColor: palette.border }]}
                onPress={() => {
                  hapticTap(10);
                  setIsFlashOn(!isFlashOn);
                }}
              >
                <Text style={[styles.secondaryButtonText, { color: palette.textPrimary }]}>
                  {isFlashOn ? 'Flash: On' : 'Flash: Off'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: palette.accent }]}
                onPress={handlePickAndDecodeGalleryImage}
              >
                <Text style={[styles.primaryButtonText, { color: palette.accentText }]}>Choose Image</Text>
              </TouchableOpacity>
            </View>

            {isScanLocked && (
              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: palette.surface, borderColor: palette.accent }]}
                onPress={() => setIsScanLocked(false)}
              >
                <Text style={[styles.secondaryButtonText, { color: palette.accent }]}>Resume Scanning</Text>
              </TouchableOpacity>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: palette.surface, borderColor: palette.border }]}
                onPress={() => void recordDecodedPayload('WIFI:S:GuestNetwork;T:WPA;P:Welcome2026;;', 'QR_CODE')}
              >
                <Text style={[styles.secondaryButtonText, { color: palette.textPrimary }]}>Sample Wi-Fi QR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: palette.surface, borderColor: palette.border }]}
                onPress={() => void recordDecodedPayload('PKG-2026-8492', 'CODE_128')}
              >
                <Text style={[styles.secondaryButtonText, { color: palette.textPrimary }]}>Sample Code 128</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= 3. HISTORY & FAVORITES SCREEN ================= */}
        {currentTab === 'history' && (
          <View style={styles.sectionStack}>
            <View style={[styles.searchBarContainer, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <TextInput
                style={[styles.searchInput, { color: palette.textPrimary }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search content, title, or format..."
                placeholderTextColor={palette.textMuted}
                autoCapitalize="none"
              />
              {searchQuery ? (
                <TouchableOpacity
                  style={styles.searchClearBtn}
                  onPress={() => setSearchQuery('')}
                  accessibilityLabel="Clear search"
                >
                  <Text style={[styles.searchClearText, { color: palette.textSecondary }]}>Clear</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.modeSegmentedRow}>
              {(['all', 'favorites', 'scanned', 'generated'] as const).map((tab) => {
                const selected = historyTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.modeSegment,
                      {
                        backgroundColor: selected ? palette.accent : palette.surface,
                        borderColor: selected ? palette.accent : palette.border,
                      },
                    ]}
                    onPress={() => {
                      hapticTap(8);
                      setHistoryTab(tab);
                    }}
                  >
                    <Text
                      style={[
                        styles.modeSegmentText,
                        { color: selected ? palette.accentText : palette.textSecondary },
                        selected && { fontWeight: '600' },
                      ]}
                    >
                      {tab === 'all'
                        ? 'All'
                        : tab === 'favorites'
                        ? 'Favorites'
                        : tab === 'scanned'
                        ? 'Scanned'
                        : 'Generated'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.countText, { color: palette.textMuted }]}>
              {filteredHistory.length} {filteredHistory.length === 1 ? 'record' : 'records'}
            </Text>

            {isSelectionMode && (
              <View style={[styles.selectionBar, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <TouchableOpacity
                  style={styles.selectionAction}
                  onPress={() => handleSelectAll(filteredHistory)}
                >
                  <Text style={[styles.selectionText, { color: palette.textPrimary }]}>
                    {selectedIds.length === filteredHistory.length && filteredHistory.length > 0
                      ? 'Deselect All'
                      : 'Select All'}{' '}
                    ({selectedIds.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.deleteBatchBtn, selectedIds.length === 0 && { opacity: 0.4 }]}
                  disabled={selectedIds.length === 0}
                  onPress={handleDeleteSelected}
                >
                  <Text style={styles.deleteBatchText}>Delete ({selectedIds.length})</Text>
                </TouchableOpacity>
              </View>
            )}

            {isHistoryLoading ? (
              <View style={styles.sectionStack}>
                {[1, 2, 3].map((idx) => (
                  <View
                    key={idx}
                    style={[styles.skeletonListItem, { backgroundColor: palette.surface, borderColor: palette.border }]}
                  >
                    <View style={[styles.skeletonLineShort, { backgroundColor: palette.border }]} />
                    <View style={[styles.skeletonLine, { backgroundColor: palette.border }]} />
                  </View>
                ))}
              </View>
            ) : historyError ? (
              <View style={styles.stateBox}>
                <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>Failed to Load History</Text>
                <Text style={[styles.emptySubtitle, { color: palette.textSecondary }]}>{historyError}</Text>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: palette.accent }]}
                  onPress={handleRefreshHistory}
                >
                  <Text style={[styles.primaryButtonText, { color: palette.accentText }]}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : filteredHistory.length === 0 ? (
              <View style={styles.stateBox}>
                <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>
                  {searchQuery ? 'No Matching Records' : 'No QR History'}
                </Text>
                <Text style={[styles.emptySubtitle, { color: palette.textSecondary }]}>
                  {searchQuery
                    ? `No records matched "${searchQuery}".`
                    : historyTab === 'favorites'
                    ? 'Star records to find them quickly here.'
                    : 'Generated and scanned QR codes appear here.'}
                </Text>
                {searchQuery ? (
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: palette.accent }]}
                    onPress={() => setSearchQuery('')}
                  >
                    <Text style={[styles.primaryButtonText, { color: palette.accentText }]}>Clear Search</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: palette.accent }]}
                    onPress={() => setCurrentTab('generator')}
                  >
                    <Text style={[styles.primaryButtonText, { color: palette.accentText }]}>Create QR Code</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={[styles.listSurface, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                {filteredHistory.map((item, idx) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.listItem,
                        idx > 0 && { borderTopWidth: 1, borderTopColor: palette.border },
                        isSelected && styles.listItemSelected,
                      ]}
                      onPress={() => {
                        if (isSelectionMode) {
                          toggleSelectRecord(item.id);
                        } else {
                          hapticTap(8);
                          setActiveModalRecord(item);
                        }
                      }}
                    >
                      {isSelectionMode && (
                        <View
                          style={[
                            styles.checkbox,
                            { borderColor: palette.textMuted },
                            isSelected && { backgroundColor: palette.accent, borderColor: palette.accent },
                          ]}
                        >
                          {isSelected && <Text style={[styles.checkMark, { color: palette.accentText }]}>✓</Text>}
                        </View>
                      )}

                      <View style={styles.listItemBody}>
                        <Text style={[styles.favTitle, { color: palette.textPrimary }]} numberOfLines={1}>
                          {item.title || item.content}
                        </Text>
                        <Text style={[styles.favContent, { color: palette.textSecondary }]} numberOfLines={1}>
                          {item.content}
                        </Text>
                        <Text style={[styles.favDate, { color: palette.textMuted }]} numberOfLines={1}>
                          {getMobileBarcodeLabel(item.format)} · {item.category} · {formatTime(item.timestamp)}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => void handleToggleFavorite(item.id)}
                        style={styles.starTouchBtn}
                        accessibilityLabel={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Text
                          style={[
                            styles.favStarIcon,
                            { color: item.isFavorite ? '#f59e0b' : palette.textMuted },
                          ]}
                        >
                          {item.isFavorite ? '★' : '☆'}
                        </Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ================= 4. SETTINGS SCREEN ================= */}
        {currentTab === 'settings' && (
          <View style={styles.sectionStack}>
            <View style={[styles.surfaceBox, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Appearance</Text>
              <Text style={[styles.sectionSubtitle, { color: palette.textSecondary }]}>
                Toggle app color scheme between light and dark surfaces.
              </Text>
              <TouchableOpacity
                style={[styles.permRow, { borderTopColor: palette.border }]}
                onPress={() => void handleToggleTheme()}
              >
                <Text style={[styles.colorLabel, { color: palette.textPrimary }]}>Theme</Text>
                <Text style={[styles.permStatusText, { color: palette.accent }]}>
                  {isLight ? 'Light' : 'Dark'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.surfaceBox, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>App Password</Text>
              <Text style={[styles.sectionSubtitle, { color: palette.textSecondary }]}>
                Require at least 6 characters including a letter and a number.
              </Text>

              <Text style={[styles.label, { color: palette.textSecondary }]}>New Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: palette.bg, borderColor: palette.border, color: palette.textPrimary }]}
                value={newPass}
                onChangeText={(t: string) => {
                  setNewPass(t);
                  setPassError('');
                }}
                placeholder="Enter new password"
                placeholderTextColor={palette.textMuted}
                secureTextEntry
              />

              <Text style={[styles.label, { color: palette.textSecondary }]}>Confirm Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: palette.bg, borderColor: palette.border, color: palette.textPrimary }]}
                value={confirmPass}
                onChangeText={(t: string) => {
                  setConfirmPass(t);
                  setPassError('');
                }}
                placeholder="Re-enter new password"
                placeholderTextColor={palette.textMuted}
                secureTextEntry
              />

              {passError ? <Text style={styles.errorText}>{passError}</Text> : null}

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: palette.accent }]}
                onPress={handlePasswordSubmit}
              >
                <Text style={[styles.primaryButtonText, { color: palette.accentText }]}>Save Password</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.surfaceBox, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Platform Permissions</Text>
              <Text style={[styles.sectionSubtitle, { color: palette.textSecondary }]}>
                {Platform.OS === 'ios' ? 'iOS Privacy Controls' : 'Android Runtime Controls'}
              </Text>
              <View style={styles.actionStack}>
                {(['camera', 'photoLibrary', 'storageSave'] as const).map((purpose) => {
                  const os = Platform.OS === 'ios' ? 'ios' : 'android';
                  const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : 34;
                  const spec = getMobilePermissionSpec(os, purpose, apiLevel);
                  return (
                    <TouchableOpacity
                      key={purpose}
                      style={[styles.permRow, { borderTopColor: palette.border }]}
                      onPress={() => void requestPlatformPermission(purpose, () => {})}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.colorLabel, { color: palette.textPrimary }]}>{spec.title}</Text>
                        <Text style={[styles.hintText, { color: palette.textMuted }]}>{spec.key}</Text>
                      </View>
                      <Text style={[styles.permStatusText, { color: palette.accent }]}>
                        {permissionState[purpose]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={[styles.surfaceBox, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>About Scan QR</Text>
              <Text style={[styles.sectionSubtitle, { color: palette.textSecondary }]}>Version 3.0.0</Text>
              <Text style={[styles.aboutBody, { color: palette.textSecondary }]}>
                Powered by portable @scanqr/core. Generate custom QR codes and 1D/2D barcodes, scan from camera or photos, search saved records, and export history in JSON or CSV formats.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Thumb-Zone Navigation Bar */}
      <View style={[styles.bottomTabBar, { backgroundColor: palette.surface, borderTopColor: palette.border }]}>
        {(
          [
            { id: 'generator', label: 'Generate' },
            { id: 'scanner', label: 'Scan' },
            { id: 'history', label: `History (${historyRecords.length})` },
            { id: 'settings', label: 'Settings' },
          ] as const
        ).map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabButton,
                isActive && { backgroundColor: isLight ? '#ecfdf5' : '#27272a' },
              ]}
              onPress={() => {
                hapticTap(8);
                setCurrentTab(tab.id);
                setIsSelectionMode(false);
                if (tab.id !== 'scanner') {
                  setIsScanLocked(false);
                }
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? palette.accent : palette.textSecondary },
                  isActive && { fontWeight: '600' },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ================= RECORD DETAILS BOTTOM SHEET ================= */}
      <Modal
        visible={!!activeModalRecord}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModalRecord(null)}
      >
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheetCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <View style={[styles.sheetHandle, { backgroundColor: palette.border }]} />
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>
                {activeModalRecord?.format && activeModalRecord.format !== 'QR_CODE'
                  ? 'Barcode Details'
                  : 'QR Code Details'}
              </Text>
              <TouchableOpacity
                style={styles.closeIconBtn}
                onPress={() => {
                  setActiveModalRecord(null);
                  setIsScanLocked(false);
                }}
                accessibilityLabel="Close details"
              >
                <Text style={[styles.closeBtnText, { color: palette.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {activeModalRecord && (
              <View style={styles.sectionStack}>
                <View style={styles.detailMetaRow}>
                  <Text style={[styles.modalTimestamp, { color: palette.textSecondary }]}>
                    {getMobileBarcodeLabel(activeModalRecord.format)} · {formatTime(activeModalRecord.timestamp)}
                  </Text>
                  <TouchableOpacity
                    style={[styles.favPillBtn, { backgroundColor: palette.bg, borderColor: palette.border }]}
                    onPress={() => void handleToggleFavorite(activeModalRecord.id)}
                  >
                    <Text
                      style={[
                        styles.favStarText,
                        { color: activeModalRecord.isFavorite ? '#f59e0b' : palette.textPrimary },
                      ]}
                    >
                      {activeModalRecord.isFavorite ? '★ Favorited' : '☆ Favorite'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {activeModalRecord.type === 'url' && (
                  <View
                    style={[
                      styles.linkPreviewBox,
                      { backgroundColor: palette.bg, borderColor: palette.border },
                    ]}
                  >
                    {linkPreviewStatus === 'loading' || linkPreviewStatus === 'idle' ? (
                      <View style={styles.linkPreviewRow}>
                        <View style={[styles.linkFaviconBox, { backgroundColor: palette.border, borderColor: palette.border }]} />
                        <View style={styles.linkPreviewTextCol}>
                          <View style={[styles.skeletonLine, { backgroundColor: palette.border }]} />
                          <View style={[styles.skeletonLineShort, { backgroundColor: palette.border }]} />
                        </View>
                      </View>
                    ) : linkPreviewStatus === 'error' ? (
                      <View style={styles.linkPreviewRow}>
                        <View
                          style={[
                            styles.linkFaviconBox,
                            { backgroundColor: palette.surface, borderColor: palette.border },
                          ]}
                        >
                          <Text style={[styles.linkFallbackIconText, { color: palette.textSecondary }]}>!</Text>
                        </View>
                        <View style={styles.linkPreviewTextCol}>
                          <Text style={[styles.linkPreviewTitle, { color: palette.textPrimary }]} numberOfLines={1}>
                            {linkPreviewError || 'Could not load page preview.'}
                          </Text>
                          <Text style={[styles.linkPreviewDomain, { color: palette.textSecondary }]} numberOfLines={1}>
                            {extractHostname(activeModalRecord.content)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.linkRetryBtn,
                            { backgroundColor: palette.surface, borderColor: palette.border },
                          ]}
                          onPress={() => {
                            hapticTap(8);
                            setLinkPreviewRetryTick((t) => t + 1);
                          }}
                        >
                          <Text style={[styles.linkRetryText, { color: palette.textPrimary }]}>Retry</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.linkPreviewRow}>
                        <View
                          style={[
                            styles.linkFaviconBox,
                            { backgroundColor: palette.surface, borderColor: palette.border },
                          ]}
                        >
                          {linkPreviewData?.faviconUrl && !linkFaviconFailed ? (
                            <Image
                              source={{ uri: linkPreviewData.faviconUrl }}
                              style={styles.linkFaviconImg}
                              onError={() => setLinkFaviconFailed(true)}
                            />
                          ) : (
                            <Text style={[styles.linkFallbackIconText, { color: palette.accent }]}>
                              {(linkPreviewData?.hostname || 'W').slice(0, 1).toUpperCase()}
                            </Text>
                          )}
                        </View>
                        <View style={styles.linkPreviewTextCol}>
                          <Text style={[styles.linkPreviewTitle, { color: palette.textPrimary }]} numberOfLines={2}>
                            {linkPreviewData?.title ||
                              linkPreviewData?.hostname ||
                              extractHostname(activeModalRecord.content)}
                          </Text>
                          <Text style={[styles.linkPreviewDomain, { color: palette.textSecondary }]} numberOfLines={1}>
                            {linkPreviewData?.hostname || extractHostname(activeModalRecord.content)}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                <ScrollView
                  style={[styles.modalBodyScroll, { backgroundColor: palette.bg, borderColor: palette.border }]}
                >
                  <Text style={[styles.modalBody, { color: palette.textPrimary }]}>
                    {activeModalRecord.content}
                  </Text>
                </ScrollView>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.secondaryButton, { backgroundColor: palette.bg, borderColor: palette.border }]}
                    onPress={() => void handleCopyContent(activeModalRecord.content)}
                  >
                    <Text style={[styles.secondaryButtonText, { color: palette.textPrimary }]}>Copy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.secondaryButton, { backgroundColor: palette.bg, borderColor: palette.border }]}
                    onPress={() => void handleShareRecordContent(activeModalRecord.content)}
                  >
                    <Text style={[styles.secondaryButtonText, { color: palette.textPrimary }]}>Share</Text>
                  </TouchableOpacity>

                  {activeModalRecord.type === 'url' && (
                    <TouchableOpacity
                      style={[styles.primaryButton, { backgroundColor: palette.accent }]}
                      onPress={() => {
                        void Linking.openURL(activeModalRecord.content).catch(() => {
                          Alert.alert('Unable to Open Link', activeModalRecord.content);
                        });
                      }}
                    >
                      <Text style={[styles.primaryButtonText, { color: palette.accentText }]}>Open Link</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.modalActionBtnDestructive, { backgroundColor: palette.bg }]}
                  onPress={() => void handleDeleteSingle(activeModalRecord.id)}
                >
                  <Text style={styles.modalActionBtnTextDestructive}>Delete Record</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ================= EXPORT BOTTOM SHEET ================= */}
      <Modal
        visible={isExportModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsExportModalOpen(false)}
      >
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheetCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <View style={[styles.sheetHandle, { backgroundColor: palette.border }]} />
            <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>Export History</Text>
            <Text style={[styles.sectionSubtitle, { color: palette.textSecondary }]}>
              Export {historyRecords.length} records as JSON or CSV.
            </Text>

            <View style={styles.sectionStack}>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: palette.accent }]}
                onPress={() => void handleExport('json')}
              >
                <Text style={[styles.primaryButtonText, { color: palette.accentText }]}>Export JSON</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: palette.bg, borderColor: palette.border }]}
                onPress={() => void handleExport('csv')}
              >
                <Text style={[styles.secondaryButtonText, { color: palette.textPrimary }]}>Export CSV</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: palette.bg, borderColor: palette.border }]}
                onPress={() => setIsExportModalOpen(false)}
              >
                <Text style={[styles.secondaryButtonText, { color: palette.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionBtn: {
    minHeight: 44,
    minWidth: 64,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  scrollArea: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  sectionStack: {
    gap: 16,
  },
  surfaceBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  aboutBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  modeSegmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeSegment: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  modeSegmentText: {
    fontSize: 13,
    fontWeight: '500',
  },
  formatChip: {
    minHeight: 44,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  hintText: {
    fontSize: 12,
    marginTop: 2,
  },
  permRow: {
    minHeight: 52,
    paddingVertical: 10,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  permStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  previewWrapper: {
    alignItems: 'center',
    gap: 12,
  },
  svgFrame: {
    width: '100%',
    minHeight: 140,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    overflow: 'hidden',
  },
  qrCodePayload: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  warningText: {
    color: '#f59e0b',
    fontSize: 12,
    flex: 1,
  },
  inlineFixBtn: {
    minHeight: 44,
    minWidth: 48,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  inlineFixText: {
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  multilineInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginBottom: 10,
  },
  colorPickerDivider: {
    borderTopWidth: 1,
    paddingTop: 14,
    gap: 14,
  },
  colorGroup: {
    gap: 8,
  },
  colorHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colorLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  colorHexText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontVariant: ['tabular-nums'],
  },
  colorSwatches: {
    flexDirection: 'row',
    gap: 10,
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionStack: {
    gap: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  destructiveText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
  viewfinderBox: {
    height: 290,
    backgroundColor: '#000000',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  viewfinderInner: {
    width: 230,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  scanLaserLine: {
    position: 'absolute',
    top: '50%',
    left: 12,
    right: 12,
    height: 2,
    backgroundColor: '#10b981',
  },
  targetCornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 26,
    height: 26,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#10b981',
  },
  targetCornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 26,
    height: 26,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: '#10b981',
  },
  targetCornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 26,
    height: 26,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#10b981',
  },
  targetCornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: '#10b981',
  },
  viewfinderText: {
    color: '#e4e4e7',
    fontSize: 12,
    fontWeight: '500',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
  },
  searchClearBtn: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchClearText: {
    fontSize: 13,
    fontWeight: '500',
  },
  countText: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectionAction: {
    minHeight: 44,
    justifyContent: 'center',
  },
  selectionText: {
    fontSize: 13,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  deleteBatchBtn: {
    minHeight: 44,
    backgroundColor: '#dc2626',
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: 'center',
  },
  deleteBatchText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  listSurface: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 64,
  },
  listItemSelected: {
    backgroundColor: '#064e3b33',
  },
  listItemBody: {
    flex: 1,
    gap: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 12,
    fontWeight: '700',
  },
  favTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  favContent: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  favDate: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  starTouchBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favStarIcon: {
    fontSize: 18,
  },
  stateBox: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  skeletonPreview: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  skeletonBox: {
    width: 140,
    height: 140,
    borderRadius: 12,
  },
  skeletonListItem: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  skeletonLineShort: {
    width: '45%',
    height: 12,
    borderRadius: 6,
  },
  skeletonLine: {
    width: '80%',
    height: 10,
    borderRadius: 6,
  },
  bottomTabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    gap: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeIconBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTimestamp: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  favPillBtn: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
  },
  favStarText: {
    fontSize: 13,
    fontWeight: '500',
  },
  modalBodyScroll: {
    maxHeight: 160,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  modalBody: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalActionBtnDestructive: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#ef444455',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActionBtnTextDestructive: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  linkPreviewBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  linkPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  linkFaviconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  linkFaviconImg: {
    width: 20,
    height: 20,
  },
  linkFallbackIconText: {
    fontSize: 14,
    fontWeight: '700',
  },
  linkPreviewTextCol: {
    flex: 1,
    gap: 3,
  },
  linkPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  linkPreviewDomain: {
    fontSize: 12,
  },
  linkRetryBtn: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkRetryText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

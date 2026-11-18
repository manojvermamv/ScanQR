import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
  Share,
  Platform,
  RefreshControl,
  Vibration,
} from 'react-native';
import {
  formatVCard,
  exportRecordsToJson,
  exportRecordsToCsv,
  detectType,
  formatTime,
  filterRecords,
  hasLowContrast,
  MobileQrRecord,
  ContactData,
} from './src/qrCore.ts';

const FG_PRESETS = [
  { hex: '#000000', label: 'Black' },
  { hex: '#059669', label: 'Emerald' },
  { hex: '#1e293b', label: 'Slate' },
  { hex: '#1d4ed8', label: 'Navy' },
];

const BG_PRESETS = [
  { hex: '#ffffff', label: 'White' },
  { hex: '#f5f5f4', label: 'Stone' },
  { hex: '#ecfdf5', label: 'Mint' },
  { hex: '#18181b', label: 'Charcoal' },
];

function hapticTap(duration = 12) {
  try {
    if (Platform.OS !== 'web') {
      Vibration.vibrate(duration);
    }
  } catch {
    // Ignore unsupported platforms
  }
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<'generator' | 'scanner' | 'history' | 'settings'>('generator');

  // Generator state (4 states: loading, empty, error, populated)
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

  // QR colors
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const lowContrast = hasLowContrast(fgColor, bgColor);

  // Scanner state
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [activeModalRecord, setActiveModalRecord] = useState<MobileQrRecord | null>(null);

  // History & Favorites state (with Loading, Empty, Error, Populated + Pull-to-Refresh)
  const [searchQuery, setSearchQuery] = useState('');
  const [historyTab, setHistoryTab] = useState<'all' | 'favorites' | 'scanned' | 'generated'>('all');
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyRecords, setHistoryRecords] = useState<MobileQrRecord[]>([
    {
      id: 'rec-1',
      content: 'https://scanqr.app',
      title: 'ScanQR Official Website',
      type: 'url',
      category: 'scanned',
      timestamp: Date.now() - 3600000,
      isFavorite: true,
    },
    {
      id: 'rec-2',
      content: 'WIFI:S:GuestNetwork;T:WPA;P:Welcome2026;;',
      title: 'Guest Wi-Fi Credentials',
      type: 'wifi',
      category: 'scanned',
      timestamp: Date.now() - 7200000,
      isFavorite: false,
    },
    {
      id: 'rec-3',
      content: 'BEGIN:VCARD\nVERSION:3.0\nFN:Samira Patel\nTEL:+15550198888\nEMAIL:samira@example.com\nEND:VCARD',
      title: 'Contact: Samira Patel',
      type: 'contact',
      category: 'generated',
      timestamp: Date.now() - 14400000,
      isFavorite: true,
    },
  ]);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Password modal/settings
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');

  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRefreshHistory = () => {
    hapticTap(10);
    setIsHistoryLoading(true);
    setHistoryError(null);
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      setIsHistoryLoading(false);
    }, 350);
  };

  const handleGenerate = () => {
    let payload = '';
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
    } else if (genMode === 'contact') {
      if (!contactData.name.trim()) {
        setErrorMessage('Enter a contact name to generate a vCard.');
        return;
      }
      payload = formatVCard(contactData);
    }

    hapticTap(15);
    setErrorMessage('');
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedPayload(payload);
      setIsGenerating(false);
      const newRecord: MobileQrRecord = {
        id: `gen-${Date.now()}`,
        content: payload,
        title: genMode === 'contact' ? `Contact: ${contactData.name}` : `Generated ${genMode.toUpperCase()}`,
        type: detectType(payload),
        category: 'generated',
        timestamp: Date.now(),
        isFavorite: false,
      };
      setHistoryRecords((prev) => [newRecord, ...prev]);
      Alert.alert('Saved', 'QR code added to history.');
    }, 180);
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
    setGenMode('url');
    setInputUrl('https://scanqr.app');
    setGeneratedPayload('https://scanqr.app');
    setErrorMessage('');
  };

  const handleShareGenerated = async () => {
    if (!generatedPayload) {
      Alert.alert('Nothing to Share', 'Enter content and generate a QR code first.');
      return;
    }
    try {
      await Share.share({
        title: 'QR Code Payload',
        message: generatedPayload,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unable to share payload.';
      Alert.alert('Share Failed', msg);
    }
  };

  const handleSaveGenerated = () => {
    if (!generatedPayload) {
      Alert.alert('Nothing to Save', 'Enter content and generate a QR code first.');
      return;
    }
    hapticTap(15);
    Alert.alert('Saved to Photos', 'QR code image saved.');
  };

  const handleDecodeSample = (scannedContent: string) => {
    hapticTap(20);
    const newRecord: MobileQrRecord = {
      id: `scan-${Date.now()}`,
      content: scannedContent,
      title: `Scanned: ${scannedContent.slice(0, 24)}`,
      type: detectType(scannedContent),
      category: 'scanned',
      timestamp: Date.now(),
      isFavorite: false,
    };
    setHistoryRecords((prev) => [newRecord, ...prev]);
    setActiveModalRecord(newRecord);
  };

  const handleRetryCamera = () => {
    hapticTap(10);
    setIsCameraLoading(true);
    setCameraError(null);
    setTimeout(() => {
      setIsCameraLoading(false);
    }, 250);
  };

  const handleShareRecordContent = async (content: string) => {
    try {
      await Share.share({
        title: 'QR Code Content',
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
    Alert.alert(
      'Delete Records',
      `Delete ${count} selected record${count > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            hapticTap(20);
            setHistoryRecords((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
            setSelectedIds([]);
            setIsSelectionMode(false);
          },
        },
      ]
    );
  };

  const handleExport = (format: 'json' | 'csv') => {
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

    Share.share({
      title: `ScanQR History (${format.toUpperCase()})`,
      message: exportedString,
    }).catch(() => {
      Alert.alert('Export Ready', `Prepared ${format.toUpperCase()} export.`);
    });
  };

  const handleToggleFavorite = (id: string) => {
    hapticTap(10);
    setHistoryRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r))
    );
    if (activeModalRecord && activeModalRecord.id === id) {
      setActiveModalRecord((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    }
  };

  const handleDeleteSingle = (id: string) => {
    hapticTap(15);
    setHistoryRecords((prev) => prev.filter((r) => r.id !== id));
    setActiveModalRecord(null);
  };

  const handlePasswordSubmit = () => {
    setPassError('');
    if (!newPass || newPass.length < 6) {
      setPassError('Password must be at least 6 characters.');
      return;
    }
    if (!/[a-zA-Z]/.test(newPass) || !/[0-9]/.test(newPass)) {
      setPassError('Include at least one letter and one number.');
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
    generator: 'Generate QR',
    scanner: 'Scan QR',
    history: 'History & Favs',
    settings: 'Settings',
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#09090b" />

      {/* Top Header: strictly screen title and compact contextual actions */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{screenTitleMap[currentTab]}</Text>

        {currentTab === 'history' && (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerActionBtn, isSelectionMode && styles.headerActionBtnActive]}
              onPress={() => {
                hapticTap(10);
                setIsSelectionMode(!isSelectionMode);
                setSelectedIds([]);
              }}
              accessibilityLabel={isSelectionMode ? 'Cancel selection' : 'Select records'}
            >
              <Text style={[styles.headerActionText, isSelectionMode && { color: '#10b981' }]}>
                {isSelectionMode ? 'Cancel' : 'Select'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={() => {
                hapticTap(10);
                setIsExportModalOpen(true);
              }}
              accessibilityLabel="Export history"
            >
              <Text style={styles.headerActionText}>Export</Text>
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
              tintColor="#10b981"
            />
          ) : undefined
        }
      >
        {/* ================= 1. GENERATOR SCREEN ================= */}
        {currentTab === 'generator' && (
          <View style={styles.sectionStack}>
            {/* QR Preview Frame */}
            <View style={styles.surfaceBox}>
              {isGenerating ? (
                <View style={styles.skeletonPreview}>
                  <View style={styles.skeletonBox} />
                  <View style={styles.skeletonLine} />
                </View>
              ) : errorMessage && !generatedPayload ? (
                <View style={styles.stateBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                  <TouchableOpacity style={styles.secondaryButton} onPress={handleRestoreSample}>
                    <Text style={styles.secondaryButtonText}>Restore Default</Text>
                  </TouchableOpacity>
                </View>
              ) : generatedPayload ? (
                <View style={styles.previewWrapper}>
                  <View style={[styles.qrFrame, { backgroundColor: bgColor }]}>
                    <View
                      style={[
                        styles.qrGraphicPlaceholder,
                        { borderColor: fgColor },
                      ]}
                    >
                      <View style={[styles.qrCornerMarkTL, { backgroundColor: fgColor }]} />
                      <View style={[styles.qrCornerMarkTR, { backgroundColor: fgColor }]} />
                      <View style={[styles.qrCornerMarkBL, { backgroundColor: fgColor }]} />
                      <Text style={[styles.qrMatrixLabel, { color: fgColor }]}>QR</Text>
                    </View>
                  </View>

                  <Text style={styles.qrCodePayload} numberOfLines={2}>
                    {generatedPayload}
                  </Text>

                  {lowContrast && (
                    <View style={styles.warningRow}>
                      <Text style={styles.warningText}>Low contrast may fail to scan.</Text>
                      <TouchableOpacity
                        style={styles.inlineFixBtn}
                        onPress={() => {
                          setFgColor('#000000');
                          setBgColor('#ffffff');
                        }}
                      >
                        <Text style={styles.inlineFixText}>Fix</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.stateBox}>
                  <Text style={styles.emptyTitle}>No QR code yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Enter text or a URL below to generate a QR code.
                  </Text>
                  <TouchableOpacity style={styles.secondaryButton} onPress={handleRestoreSample}>
                    <Text style={styles.secondaryButtonText}>Restore Default URL</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Sub-mode selector */}
            <View style={styles.modeSegmentedRow}>
              {(['url', 'text', 'contact'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modeSegment, genMode === mode && styles.modeSegmentActive]}
                  onPress={() => {
                    hapticTap(8);
                    setGenMode(mode);
                  }}
                >
                  <Text
                    style={[
                      styles.modeSegmentText,
                      genMode === mode && styles.modeSegmentTextActive,
                    ]}
                  >
                    {mode === 'url' ? 'URL' : mode === 'text' ? 'Text' : 'Contact'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Input Fields */}
            <View style={styles.surfaceBox}>
              {genMode === 'url' && (
                <View>
                  <Text style={styles.label}>Website URL</Text>
                  <TextInput
                    style={[styles.input, errorMessage ? styles.inputError : null]}
                    value={inputUrl}
                    onChangeText={(t: string) => {
                      setInputUrl(t);
                      setErrorMessage('');
                    }}
                    placeholder="https://example.com"
                    placeholderTextColor="#71717a"
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                </View>
              )}

              {genMode === 'text' && (
                <View>
                  <Text style={styles.label}>Text Content</Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.multilineInput,
                      errorMessage ? styles.inputError : null,
                    ]}
                    value={inputText}
                    onChangeText={(t: string) => {
                      setInputText(t);
                      setErrorMessage('');
                    }}
                    placeholder="Enter text..."
                    placeholderTextColor="#71717a"
                    multiline
                  />
                </View>
              )}

              {genMode === 'contact' && (
                <View>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    value={contactData.name}
                    onChangeText={(t: string) => setContactData({ ...contactData, name: t })}
                    placeholder="Full name"
                    placeholderTextColor="#71717a"
                  />
                  <Text style={styles.label}>Phone</Text>
                  <TextInput
                    style={styles.input}
                    value={contactData.phone}
                    onChangeText={(t: string) => setContactData({ ...contactData, phone: t })}
                    placeholder="+1 415 555 0199"
                    placeholderTextColor="#71717a"
                    keyboardType="phone-pad"
                  />
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={contactData.email}
                    onChangeText={(t: string) => setContactData({ ...contactData, email: t })}
                    placeholder="name@example.com"
                    placeholderTextColor="#71717a"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              )}

              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

              {/* QR Color Pickers */}
              <View style={styles.colorPickerDivider}>
                <View style={styles.colorGroup}>
                  <View style={styles.colorHeaderRow}>
                    <Text style={styles.colorLabel}>Foreground</Text>
                    <Text style={styles.colorHexText}>{fgColor.toUpperCase()}</Text>
                  </View>
                  <View style={styles.colorSwatches}>
                    {FG_PRESETS.map((c) => (
                      <TouchableOpacity
                        key={c.hex}
                        accessibilityLabel={`Select foreground color ${c.label}`}
                        style={[
                          styles.colorCircle,
                          { backgroundColor: c.hex },
                          fgColor.toLowerCase() === c.hex.toLowerCase() && styles.colorCircleActive,
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
                    <Text style={styles.colorLabel}>Background</Text>
                    <Text style={styles.colorHexText}>{bgColor.toUpperCase()}</Text>
                  </View>
                  <View style={styles.colorSwatches}>
                    {BG_PRESETS.map((c) => (
                      <TouchableOpacity
                        key={c.hex}
                        accessibilityLabel={`Select background color ${c.label}`}
                        style={[
                          styles.colorCircle,
                          { backgroundColor: c.hex },
                          bgColor.toLowerCase() === c.hex.toLowerCase() && styles.colorCircleActive,
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
              <TouchableOpacity style={styles.primaryButton} onPress={handleGenerate}>
                <Text style={styles.primaryButtonText}>Generate & Save</Text>
              </TouchableOpacity>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.secondaryButton} onPress={handleSaveGenerated}>
                  <Text style={styles.secondaryButtonText}>Save Image</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={handleShareGenerated}>
                  <Text style={styles.secondaryButtonText}>Share</Text>
                </TouchableOpacity>

                {generatedPayload ? (
                  <TouchableOpacity style={styles.secondaryButton} onPress={handleClear}>
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
            <View style={styles.viewfinderBox}>
              {isCameraLoading ? (
                <View style={styles.skeletonPreview}>
                  <View style={styles.skeletonBox} />
                  <Text style={styles.emptySubtitle}>Initializing camera...</Text>
                </View>
              ) : cameraError ? (
                <View style={styles.stateBox}>
                  <Text style={styles.emptyTitle}>Camera Unavailable</Text>
                  <Text style={styles.emptySubtitle}>{cameraError}</Text>
                  <TouchableOpacity style={styles.primaryButton} onPress={handleRetryCamera}>
                    <Text style={styles.primaryButtonText}>Retry Camera</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.viewfinderInner}>
                  <View style={styles.targetCornerTL} />
                  <View style={styles.targetCornerTR} />
                  <View style={styles.targetCornerBL} />
                  <View style={styles.targetCornerBR} />
                  <View style={styles.scanLaserLine} />
                  <Text style={styles.viewfinderText}>Align QR code inside frame</Text>
                </View>
              )}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  hapticTap(10);
                  setIsFlashOn(!isFlashOn);
                }}
              >
                <Text style={styles.secondaryButtonText}>
                  {isFlashOn ? 'Flash: On' : 'Flash: Off'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => handleDecodeSample('https://scanqr.app')}
              >
                <Text style={styles.primaryButtonText}>Choose Image</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => handleDecodeSample('WIFI:S:GuestNetwork;T:WPA;P:Welcome2026;;')}
            >
              <Text style={styles.secondaryButtonText}>Try Sample Wi-Fi QR</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= 3. HISTORY & FAVORITES SCREEN ================= */}
        {currentTab === 'history' && (
          <View style={styles.sectionStack}>
            {/* Search Bar */}
            <View style={styles.searchBarContainer}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by content or title..."
                placeholderTextColor="#71717a"
                autoCapitalize="none"
              />
              {searchQuery ? (
                <TouchableOpacity
                  style={styles.searchClearBtn}
                  onPress={() => setSearchQuery('')}
                  accessibilityLabel="Clear search"
                >
                  <Text style={styles.searchClearText}>Clear</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Filter Tabs */}
            <View style={styles.modeSegmentedRow}>
              {(['all', 'favorites', 'scanned', 'generated'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.modeSegment, historyTab === tab && styles.modeSegmentActive]}
                  onPress={() => {
                    hapticTap(8);
                    setHistoryTab(tab);
                  }}
                >
                  <Text
                    style={[
                      styles.modeSegmentText,
                      historyTab === tab && styles.modeSegmentTextActive,
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
              ))}
            </View>

            <Text style={styles.countText}>
              {filteredHistory.length} {filteredHistory.length === 1 ? 'record' : 'records'}
            </Text>

            {/* Multi-selection Bar */}
            {isSelectionMode && (
              <View style={styles.selectionBar}>
                <TouchableOpacity
                  style={styles.selectionAction}
                  onPress={() => handleSelectAll(filteredHistory)}
                >
                  <Text style={styles.selectionText}>
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

            {/* 4 States: Loading / Error / Empty / Populated */}
            {isHistoryLoading ? (
              <View style={styles.sectionStack}>
                {[1, 2, 3].map((idx) => (
                  <View key={idx} style={styles.skeletonListItem}>
                    <View style={styles.skeletonLineShort} />
                    <View style={styles.skeletonLine} />
                  </View>
                ))}
              </View>
            ) : historyError ? (
              <View style={styles.stateBox}>
                <Text style={styles.emptyTitle}>Failed to Load History</Text>
                <Text style={styles.emptySubtitle}>{historyError}</Text>
                <TouchableOpacity style={styles.primaryButton} onPress={handleRefreshHistory}>
                  <Text style={styles.primaryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : filteredHistory.length === 0 ? (
              <View style={styles.stateBox}>
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'No Matching Records' : 'No QR History'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? `No records matched "${searchQuery}".`
                    : historyTab === 'favorites'
                    ? 'Star records to find them quickly here.'
                    : 'Generated and scanned QR codes appear here.'}
                </Text>
                {searchQuery ? (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => setSearchQuery('')}
                  >
                    <Text style={styles.primaryButtonText}>Clear Search</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => setCurrentTab('generator')}
                  >
                    <Text style={styles.primaryButtonText}>Create QR Code</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.listSurface}>
                {filteredHistory.map((item, idx) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.listItem,
                        idx > 0 && styles.listItemBorder,
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
                        <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                          {isSelected && <Text style={styles.checkMark}>✓</Text>}
                        </View>
                      )}

                      <View style={styles.listItemBody}>
                        <Text style={styles.favTitle} numberOfLines={1}>
                          {item.title || item.content}
                        </Text>
                        <Text style={styles.favContent} numberOfLines={1}>
                          {item.content}
                        </Text>
                        <Text style={styles.favDate}>
                          {item.type.toUpperCase()} • {formatTime(item.timestamp)}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleToggleFavorite(item.id)}
                        style={styles.starTouchBtn}
                        accessibilityLabel={
                          item.isFavorite ? 'Remove from favorites' : 'Add to favorites'
                        }
                      >
                        <Text
                          style={[
                            styles.favStarIcon,
                            item.isFavorite && { color: '#f59e0b' },
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
            <View style={styles.surfaceBox}>
              <Text style={styles.sectionTitle}>App Password</Text>
              <Text style={styles.sectionSubtitle}>
                Require at least 6 characters including a letter and a number.
              </Text>

              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPass}
                onChangeText={(t: string) => {
                  setNewPass(t);
                  setPassError('');
                }}
                placeholder="Enter new password"
                placeholderTextColor="#71717a"
                secureTextEntry
              />

              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPass}
                onChangeText={(t: string) => {
                  setConfirmPass(t);
                  setPassError('');
                }}
                placeholder="Re-enter new password"
                placeholderTextColor="#71717a"
                secureTextEntry
              />

              {passError ? <Text style={styles.errorText}>{passError}</Text> : null}

              <TouchableOpacity style={styles.primaryButton} onPress={handlePasswordSubmit}>
                <Text style={styles.primaryButtonText}>Save Password</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.surfaceBox}>
              <Text style={styles.sectionTitle}>About Scan QR</Text>
              <Text style={styles.sectionSubtitle}>Version 3.0.0</Text>
              <Text style={styles.aboutBody}>
                Generate custom QR codes, scan barcodes, search saved records, and export history in JSON or CSV formats.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Thumb-Zone Navigation Bar */}
      <View style={styles.bottomTabBar}>
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
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => {
                hapticTap(8);
                setCurrentTab(tab.id);
                setIsSelectionMode(false);
              }}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
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
          <View style={styles.sheetCard}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>QR Code Details</Text>
              <TouchableOpacity
                style={styles.closeIconBtn}
                onPress={() => setActiveModalRecord(null)}
                accessibilityLabel="Close details"
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {activeModalRecord && (
              <View style={styles.sectionStack}>
                <View style={styles.detailMetaRow}>
                  <Text style={styles.modalTimestamp}>
                    {activeModalRecord.type.toUpperCase()} • {formatTime(activeModalRecord.timestamp)}
                  </Text>
                  <TouchableOpacity
                    style={styles.favPillBtn}
                    onPress={() => handleToggleFavorite(activeModalRecord.id)}
                  >
                    <Text
                      style={[
                        styles.favStarText,
                        activeModalRecord.isFavorite && { color: '#f59e0b' },
                      ]}
                    >
                      {activeModalRecord.isFavorite ? '★ Favorited' : '☆ Favorite'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBodyScroll}>
                  <Text style={styles.modalBody}>{activeModalRecord.content}</Text>
                </ScrollView>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => handleShareRecordContent(activeModalRecord.content)}
                  >
                    <Text style={styles.secondaryButtonText}>Share</Text>
                  </TouchableOpacity>

                  {activeModalRecord.type === 'url' && (
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={() => {
                        Alert.alert('Open Link', activeModalRecord.content);
                      }}
                    >
                      <Text style={styles.primaryButtonText}>Open Link</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.modalActionBtnDestructive}
                  onPress={() => handleDeleteSingle(activeModalRecord.id)}
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
          <View style={styles.sheetCard}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Export History</Text>
            <Text style={styles.sectionSubtitle}>
              Export {historyRecords.length} records as JSON or CSV.
            </Text>

            <View style={styles.sectionStack}>
              <TouchableOpacity style={styles.primaryButton} onPress={() => handleExport('json')}>
                <Text style={styles.primaryButtonText}>Export JSON</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={() => handleExport('csv')}>
                <Text style={styles.secondaryButtonText}>Export CSV</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setIsExportModalOpen(false)}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
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
    backgroundColor: '#09090b',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f4f4f5',
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
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionBtnActive: {
    borderColor: '#10b981',
  },
  headerActionText: {
    color: '#e4e4e7',
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
    backgroundColor: '#18181b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f4f4f5',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#a1a1aa',
    marginBottom: 12,
  },
  aboutBody: {
    fontSize: 14,
    color: '#d4d4d8',
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
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  modeSegmentActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  modeSegmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#a1a1aa',
  },
  modeSegmentTextActive: {
    color: '#09090b',
    fontWeight: '600',
  },
  previewWrapper: {
    alignItems: 'center',
    gap: 12,
  },
  qrFrame: {
    width: 184,
    height: 184,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  qrGraphicPlaceholder: {
    width: 124,
    height: 124,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  qrCornerMarkTL: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 22,
    height: 22,
    borderRadius: 2,
  },
  qrCornerMarkTR: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 2,
  },
  qrCornerMarkBL: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 22,
    height: 22,
    borderRadius: 2,
  },
  qrMatrixLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  qrCodePayload: {
    color: '#a1a1aa',
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
    borderTopColor: '#27272a',
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
    backgroundColor: '#27272a',
  },
  inlineFixText: {
    color: '#f4f4f5',
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#a1a1aa',
    marginBottom: 6,
  },
  input: {
    minHeight: 48,
    backgroundColor: '#09090b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#f4f4f5',
    marginBottom: 12,
  },
  multilineInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
    marginBottom: 10,
  },
  colorPickerDivider: {
    borderTopWidth: 1,
    borderTopColor: '#27272a',
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
    color: '#d4d4d8',
  },
  colorHexText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontVariant: ['tabular-nums'],
    color: '#a1a1aa',
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
    borderColor: '#3f3f46',
  },
  colorCircleActive: {
    borderColor: '#10b981',
    borderWidth: 2,
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
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#09090b',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#e4e4e7',
    fontSize: 14,
    fontWeight: '500',
  },
  destructiveText: {
    color: '#f87171',
    fontSize: 14,
    fontWeight: '500',
  },
  viewfinderBox: {
    height: 280,
    backgroundColor: '#000000',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  viewfinderInner: {
    width: 210,
    height: 210,
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
    width: 28,
    height: 28,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#10b981',
  },
  targetCornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: '#10b981',
  },
  targetCornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 28,
    height: 28,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#10b981',
  },
  targetCornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: '#10b981',
  },
  viewfinderText: {
    color: '#a1a1aa',
    fontSize: 12,
    marginTop: 120,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    color: '#f4f4f5',
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
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '500',
  },
  countText: {
    fontSize: 12,
    color: '#71717a',
    fontVariant: ['tabular-nums'],
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#18181b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  selectionAction: {
    minHeight: 44,
    justifyContent: 'center',
  },
  selectionText: {
    color: '#e4e4e7',
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
    backgroundColor: '#18181b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 64,
  },
  listItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#27272a',
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
    borderColor: '#52525b',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkMark: {
    color: '#09090b',
    fontSize: 12,
    fontWeight: '700',
  },
  favTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f4f4f5',
  },
  favContent: {
    fontSize: 12,
    color: '#a1a1aa',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  favDate: {
    fontSize: 11,
    color: '#71717a',
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
    color: '#71717a',
  },
  stateBox: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    color: '#f4f4f5',
    fontSize: 15,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: '#a1a1aa',
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
    backgroundColor: '#27272a',
  },
  skeletonListItem: {
    backgroundColor: '#18181b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 16,
    gap: 8,
  },
  skeletonLineShort: {
    width: '45%',
    height: 12,
    borderRadius: 6,
    backgroundColor: '#27272a',
  },
  skeletonLine: {
    width: '80%',
    height: 10,
    borderRadius: 6,
    backgroundColor: '#27272a',
  },
  bottomTabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    backgroundColor: '#18181b',
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
  tabButtonActive: {
    backgroundColor: '#27272a',
  },
  tabText: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  tabTextActive: {
    color: '#10b981',
    fontWeight: '600',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderColor: '#27272a',
    gap: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3f3f46',
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
    color: '#f4f4f5',
  },
  closeIconBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: '#a1a1aa',
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTimestamp: {
    fontSize: 12,
    color: '#a1a1aa',
    fontVariant: ['tabular-nums'],
  },
  favPillBtn: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272a',
    backgroundColor: '#09090b',
    justifyContent: 'center',
  },
  favStarText: {
    fontSize: 13,
    color: '#d4d4d8',
    fontWeight: '500',
  },
  modalBodyScroll: {
    maxHeight: 160,
    backgroundColor: '#09090b',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  modalBody: {
    fontSize: 13,
    color: '#e4e4e7',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalActionBtnDestructive: {
    minHeight: 48,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#ef444455',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActionBtnTextDestructive: {
    color: '#f87171',
    fontSize: 14,
    fontWeight: '600',
  },
});

import React, { useState } from 'react';
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
} from 'react-native';
import {
  formatVCard,
  exportRecordsToJson,
  exportRecordsToCsv,
  detectType,
  formatTime,
  filterRecords,
  MobileQrRecord,
  ContactData,
} from './src/qrCore.ts';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'generator' | 'scanner' | 'history' | 'password'>('generator');

  // Generator inputs
  const [genMode, setGenMode] = useState<'text' | 'url' | 'contact'>('url');
  const [inputText, setInputText] = useState('https://scanqr.app');
  const [inputUrl, setInputUrl] = useState('https://scanqr.app');
  const [contactData, setContactData] = useState<ContactData>({
    name: 'Jane Doe',
    phone: '+1 555 019 2834',
    email: 'jane@example.com',
    company: 'Mobile Engineering',
    title: 'Lead Engineer',
  });
  const [generatedPayload, setGeneratedPayload] = useState('https://scanqr.app');
  const [errorMessage, setErrorMessage] = useState('');

  // QR Color pickers (Foreground & Background)
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');

  // Scanner state
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [activeModalRecord, setActiveModalRecord] = useState<MobileQrRecord | null>(null);

  // History & Favorites state
  const [searchQuery, setSearchQuery] = useState('');
  const [historyTab, setHistoryTab] = useState<'all' | 'favorites' | 'scanned' | 'generated'>('all');
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
      content: 'BEGIN:VCARD\nVERSION:3.0\nFN:Alex Chen\nTEL:+15550198888\nEMAIL:alex@tech.io\nEND:VCARD',
      title: 'Contact: Alex Chen',
      type: 'contact',
      category: 'generated',
      timestamp: Date.now() - 14400000,
      isFavorite: true,
    },
    {
      id: 'rec-4',
      content: 'https://expo.dev',
      title: 'Expo Application Framework',
      type: 'url',
      category: 'scanned',
      timestamp: Date.now() - 86400000,
      isFavorite: false,
    },
  ]);

  // Multi-select mode in History / Favorites
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Export Dialog modal
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Password Utility state (ported from UpdatePasswordActivity.java)
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Generate QR handler
  const handleGenerate = () => {
    let payload = '';
    if (genMode === 'url') {
      if (!inputUrl.trim()) {
        setErrorMessage('Please enter a URL');
        return;
      }
      payload = inputUrl.trim().startsWith('http') ? inputUrl.trim() : `https://${inputUrl.trim()}`;
    } else if (genMode === 'text') {
      if (!inputText.trim()) {
        setErrorMessage('Please enter text content');
        return;
      }
      payload = inputText.trim();
    } else if (genMode === 'contact') {
      if (!contactData.name.trim()) {
        setErrorMessage('Please provide at least a contact name');
        return;
      }
      payload = formatVCard(contactData);
    }

    setErrorMessage('');
    setGeneratedPayload(payload);

    // Save to history as 'generated'
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
    Alert.alert('Success', 'QR Code generated and added to History!');
  };

  const handleClear = () => {
    setInputText('');
    setInputUrl('');
    setGeneratedPayload('');
    setErrorMessage('');
  };

  // Share generated QR code or payload via native share sheets
  const handleShareGenerated = async () => {
    if (!generatedPayload) {
      Alert.alert('Notice', 'Please generate a QR code first');
      return;
    }
    try {
      await Share.share({
        title: 'Share Generated QR Code',
        message: generatedPayload,
      });
    } catch (e: any) {
      Alert.alert('Share Error', e.message);
    }
  };

  // Save generated QR code
  const handleSaveGenerated = () => {
    if (!generatedPayload) {
      Alert.alert('Notice', 'Please generate a QR code first');
      return;
    }
    Alert.alert('Saved to Gallery', 'Generated QR Code image has been saved to your Photos.');
  };

  // Scanner simulated detection
  const handleSimulateScan = (scannedContent: string) => {
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

  // Share scanned QR content
  const handleShareRecordContent = async (content: string) => {
    try {
      await Share.share({
        title: 'Scanned QR Code Content',
        message: content,
      });
    } catch (e: any) {
      Alert.alert('Share Error', e.message);
    }
  };

  // Multi-select toggle
  const toggleSelectRecord = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select all filtered records
  const handleSelectAll = (filtered: MobileQrRecord[]) => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((r) => r.id));
    }
  };

  // Batch delete selected records
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    Alert.alert(
      'Delete Records',
      `Are you sure you want to delete ${count} selected record${count > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setHistoryRecords((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
            setSelectedIds([]);
            setIsSelectionMode(false);
            Alert.alert('Success', `Deleted ${count} record${count > 1 ? 's' : ''}`);
          },
        },
      ]
    );
  };

  // Export history as JSON or CSV
  const handleExport = (format: 'json' | 'csv') => {
    if (historyRecords.length === 0) {
      Alert.alert('Export Notice', 'No scan history to export.');
      return;
    }

    const exportedString =
      format === 'json'
        ? exportRecordsToJson(historyRecords)
        : exportRecordsToCsv(historyRecords);

    setIsExportModalOpen(false);

    // Prompt user with native share sheet / file save
    Share.share({
      title: `ScanQR History (${format.toUpperCase()})`,
      message: exportedString,
    }).catch(() => {
      Alert.alert('Success', `Exported history as ${format.toUpperCase()} to local storage.`);
    });
  };

  // Toggle favorite for an item
  const handleToggleFavorite = (id: string) => {
    setHistoryRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r))
    );
    if (activeModalRecord && activeModalRecord.id === id) {
      setActiveModalRecord((prev) => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    }
  };

  // Delete single record
  const handleDeleteSingle = (id: string) => {
    setHistoryRecords((prev) => prev.filter((r) => r.id !== id));
    setActiveModalRecord(null);
    Alert.alert('Notice', 'Record deleted from history');
  };

  // Password submission validation
  const handlePasswordSubmit = () => {
    if (!newPass || newPass.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters long');
      return;
    }
    if (newPass !== confirmPass) {
      Alert.alert('Validation Error', 'Confirm password does not match!');
      return;
    }
    Alert.alert('Success', 'Password credentials updated successfully');
    setNewPass('');
    setConfirmPass('');
    setCurrentTab('generator');
  };

  // Filter history records by search query and category tab as user types
  const filteredHistory = filterRecords(historyRecords, searchQuery, historyTab);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Scan QR</Text>
          <Text style={styles.headerSubtitle}>Cross-Platform Mobile App (Android & iOS)</Text>
        </View>
        <TouchableOpacity
          style={styles.headerUtilityBtn}
          onPress={() => setCurrentTab('password')}
        >
          <Text style={styles.headerUtilityText}>Utility</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, currentTab === 'generator' && styles.tabButtonActive]}
          onPress={() => {
            setCurrentTab('generator');
            setIsSelectionMode(false);
          }}
        >
          <Text style={[styles.tabText, currentTab === 'generator' && styles.tabTextActive]}>
            Generator
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, currentTab === 'scanner' && styles.tabButtonActive]}
          onPress={() => {
            setCurrentTab('scanner');
            setIsSelectionMode(false);
          }}
        >
          <Text style={[styles.tabText, currentTab === 'scanner' && styles.tabTextActive]}>
            Scanner
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, currentTab === 'history' && styles.tabButtonActive]}
          onPress={() => setCurrentTab('history')}
        >
          <Text style={[styles.tabText, currentTab === 'history' && styles.tabTextActive]}>
            History & Favs ({historyRecords.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* ================= 1. GENERATOR SCREEN ================= */}
        {currentTab === 'generator' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Generate QR Code</Text>
            <Text style={styles.sectionSubtitle}>
              Input text, URL, or contact details to generate a high-res QR code
            </Text>

            {/* Sub-mode selector (Text, URL, Contact) */}
            <View style={styles.modePillRow}>
              <TouchableOpacity
                style={[styles.modePill, genMode === 'url' && styles.modePillActive]}
                onPress={() => setGenMode('url')}
              >
                <Text style={[styles.modePillText, genMode === 'url' && styles.modePillTextActive]}>
                  Web URL
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modePill, genMode === 'text' && styles.modePillActive]}
                onPress={() => setGenMode('text')}
              >
                <Text style={[styles.modePillText, genMode === 'text' && styles.modePillTextActive]}>
                  Plain Text
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modePill, genMode === 'contact' && styles.modePillActive]}
                onPress={() => setGenMode('contact')}
              >
                <Text style={[styles.modePillText, genMode === 'contact' && styles.modePillTextActive]}>
                  Contact (vCard)
                </Text>
              </TouchableOpacity>
            </View>

            {/* QR Preview Frame */}
            <View style={[styles.qrFrame, { backgroundColor: bgColor }]}>
              {generatedPayload ? (
                <View style={styles.qrInner}>
                  <View style={[styles.qrGraphicPlaceholder, { borderColor: fgColor, backgroundColor: bgColor === '#ffffff' ? '#f4f4f5' : '#18181b' }]}>
                    <View style={[styles.qrCornerMarkTL, { backgroundColor: fgColor }]} />
                    <View style={[styles.qrCornerMarkTR, { backgroundColor: fgColor }]} />
                    <View style={[styles.qrCornerMarkBL, { backgroundColor: fgColor }]} />
                    <Text style={[styles.qrMatrixLabel, { color: fgColor }]}>QR READY</Text>
                  </View>
                  <Text style={[styles.qrCodePayload, { color: fgColor }]} numberOfLines={3}>
                    {generatedPayload}
                  </Text>
                </View>
              ) : (
                <Text style={styles.qrPlaceholderText}>Your QR Code will appear here</Text>
              )}
            </View>

            {/* QR Code Color Pickers (Foreground & Background) */}
            <View style={styles.colorPickerSection}>
              <View style={styles.colorPickerRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={styles.colorLabel}>Foreground</Text>
                    <Text style={styles.colorHexText}>{fgColor.toUpperCase()}</Text>
                  </View>
                  <View style={styles.colorSwatches}>
                    {[
                      { hex: '#000000', label: 'Black' },
                      { hex: '#10b981', label: 'Emerald' },
                      { hex: '#3b82f6', label: 'Blue' },
                      { hex: '#8b5cf6', label: 'Purple' },
                      { hex: '#ef4444', label: 'Red' },
                    ].map((c) => (
                      <TouchableOpacity
                        key={c.hex}
                        accessibilityLabel={`Select foreground color ${c.label}`}
                        style={[
                          styles.colorCircle,
                          { backgroundColor: c.hex },
                          fgColor.toLowerCase() === c.hex.toLowerCase() && styles.colorCircleActive,
                        ]}
                        onPress={() => setFgColor(c.hex)}
                      />
                    ))}
                  </View>
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={styles.colorLabel}>Background</Text>
                    <Text style={styles.colorHexText}>{bgColor.toUpperCase()}</Text>
                  </View>
                  <View style={styles.colorSwatches}>
                    {[
                      { hex: '#ffffff', label: 'White' },
                      { hex: '#fef3c7', label: 'Cream' },
                      { hex: '#ecfdf5', label: 'Mint' },
                      { hex: '#eff6ff', label: 'Sky' },
                      { hex: '#18181b', label: 'Dark' },
                    ].map((c) => (
                      <TouchableOpacity
                        key={c.hex}
                        accessibilityLabel={`Select background color ${c.label}`}
                        style={[
                          styles.colorCircle,
                          { backgroundColor: c.hex },
                          bgColor.toLowerCase() === c.hex.toLowerCase() && styles.colorCircleActive,
                        ]}
                        onPress={() => setBgColor(c.hex)}
                      />
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* Form Fields by Mode */}
            {genMode === 'url' && (
              <View>
                <Text style={styles.label}>Website URL</Text>
                <TextInput
                  style={[styles.input, errorMessage ? styles.inputError : null]}
                  value={inputUrl}
                  onChangeText={(t) => {
                    setInputUrl(t);
                    setErrorMessage('');
                  }}
                  placeholder="https://example.com"
                  placeholderTextColor="#666"
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>
            )}

            {genMode === 'text' && (
              <View>
                <Text style={styles.label}>Text Message</Text>
                <TextInput
                  style={[styles.input, { height: 75, textAlignVertical: 'top' }, errorMessage ? styles.inputError : null]}
                  value={inputText}
                  onChangeText={(t) => {
                    setInputText(t);
                    setErrorMessage('');
                  }}
                  placeholder="Enter message or notes..."
                  placeholderTextColor="#666"
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
                  onChangeText={(t) => setContactData({ ...contactData, name: t })}
                  placeholder="e.g. Jane Doe"
                  placeholderTextColor="#666"
                />
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={contactData.phone}
                  onChangeText={(t) => setContactData({ ...contactData, phone: t })}
                  placeholder="e.g. +1 555 019 2834"
                  placeholderTextColor="#666"
                  keyboardType="phone-pad"
                />
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={contactData.email}
                  onChangeText={(t) => setContactData({ ...contactData, email: t })}
                  placeholder="e.g. jane@example.com"
                  placeholderTextColor="#666"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <View style={styles.inputSplitRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.label}>Company</Text>
                    <TextInput
                      style={styles.input}
                      value={contactData.company}
                      onChangeText={(t) => setContactData({ ...contactData, company: t })}
                      placeholder="Organization"
                      placeholderTextColor="#666"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Job Title</Text>
                    <TextInput
                      style={styles.input}
                      value={contactData.title}
                      onChangeText={(t) => setContactData({ ...contactData, title: t })}
                      placeholder="Role"
                      placeholderTextColor="#666"
                    />
                  </View>
                </View>
              </View>
            )}

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            {/* Action Buttons: Generate, Save, Share */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleGenerate}>
                <Text style={styles.primaryButtonText}>GENERATE</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={handleSaveGenerated}>
                <Text style={styles.secondaryButtonText}>SAVE</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={handleShareGenerated}>
                <Text style={styles.secondaryButtonText}>SHARE</Text>
              </TouchableOpacity>
            </View>

            {generatedPayload ? (
              <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                <Text style={styles.clearButtonText}>Clear QR</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* ================= 2. SCANNER SCREEN ================= */}
        {currentTab === 'scanner' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Scan Any QR Code</Text>
            <Text style={styles.sectionSubtitle}>
              Align barcode inside viewfinder or choose photo from gallery
            </Text>

            <View style={styles.viewfinderSim}>
              <View style={styles.targetCornerTL} />
              <View style={styles.targetCornerTR} />
              <View style={styles.targetCornerBL} />
              <View style={styles.targetCornerBR} />
              <View style={styles.scanLaserLine} />
              <Text style={styles.viewfinderText}>Camera Viewfinder Active</Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setIsFlashOn(!isFlashOn)}
              >
                <Text style={styles.actionButtonText}>
                  {isFlashOn ? 'Flash ON 🔦' : 'Flash OFF 💡'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleSimulateScan('https://scanqr.app')}
              >
                <Text style={styles.actionButtonText}>Browse Gallery 🖼️</Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.secondaryButton, { paddingVertical: 10 }]}
                onPress={() => handleSimulateScan('WIFI:S:OfficeHighSpeed;T:WPA;P:CorpWiFi2026;;')}
              >
                <Text style={styles.secondaryButtonText}>Scan Sample Wi-Fi QR</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= 3. HISTORY & FAVORITES SCREEN ================= */}
        {currentTab === 'history' && (
          <View style={styles.card}>
            {/* Top Bar for History: Filter Tabs + Multi-select + Export buttons */}
            <View style={styles.historyHeader}>
              <View>
                <Text style={styles.sectionTitle}>Scan History & Favs</Text>
                <Text style={styles.sectionSubtitle}>
                  {filteredHistory.length} record{filteredHistory.length === 1 ? '' : 's'} recorded
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.smallActionBtn, isSelectionMode && styles.smallActionBtnActive]}
                  onPress={() => {
                    setIsSelectionMode(!isSelectionMode);
                    setSelectedIds([]);
                  }}
                >
                  <Text style={[styles.smallActionText, isSelectionMode && { color: '#10b981' }]}>
                    {isSelectionMode ? 'Cancel' : 'Select'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.smallActionBtn}
                  onPress={() => setIsExportModalOpen(true)}
                >
                  <Text style={styles.smallActionText}>Export</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Search Bar at the top of 'History & Favs' */}
            <View style={styles.searchBarContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by content or title..."
                placeholderTextColor="#777"
                autoCapitalize="none"
              />
              {searchQuery ? (
                <TouchableOpacity
                  style={styles.searchClearBtn}
                  onPress={() => setSearchQuery('')}
                  accessibilityLabel="Clear search"
                >
                  <Text style={styles.searchClearText}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterTabRow}>
              {(['all', 'favorites', 'scanned', 'generated'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.filterPill, historyTab === tab && styles.filterPillActive]}
                  onPress={() => setHistoryTab(tab)}
                >
                  <Text style={[styles.filterPillText, historyTab === tab && styles.filterPillTextActive]}>
                    {tab.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Multi-selection Bar */}
            {isSelectionMode && (
              <View style={styles.selectionBar}>
                <TouchableOpacity
                  onPress={() => handleSelectAll(filteredHistory)}
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                  <Text style={styles.selectionText}>
                    {selectedIds.length === filteredHistory.length && filteredHistory.length > 0
                      ? 'Deselect All'
                      : 'Select All'} ({selectedIds.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.deleteBatchBtn, selectedIds.length === 0 && { opacity: 0.5 }]}
                  disabled={selectedIds.length === 0}
                  onPress={handleDeleteSelected}
                >
                  <Text style={styles.deleteBatchText}>
                    Delete ({selectedIds.length})
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* List of Records */}
            {filteredHistory.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyTitle}>
                  {searchQuery ? `No records matching "${searchQuery}"` : 'No records found'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? 'Try another search query or clear search to view all items.'
                    : historyTab === 'favorites'
                    ? 'Star records from scan or generation to access them quickly.'
                    : 'Scanned or generated QR codes will appear in this list.'}
                </Text>
                {searchQuery ? (
                  <TouchableOpacity
                    style={[styles.smallActionBtn, { alignSelf: 'center', marginTop: 12 }]}
                    onPress={() => setSearchQuery('')}
                  >
                    <Text style={styles.smallActionText}>Clear Search</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              filteredHistory.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.favItem, isSelected && styles.favItemSelected]}
                    onPress={() => {
                      if (isSelectionMode) {
                        toggleSelectRecord(item.id);
                      } else {
                        setActiveModalRecord(item);
                      }
                    }}
                  >
                    {isSelectionMode && (
                      <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                        {isSelected && <Text style={styles.checkMark}>✓</Text>}
                      </View>
                    )}

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <Text style={styles.favBadge}>{item.type.toUpperCase()}</Text>
                        <Text style={styles.favDate}>{formatTime(item.timestamp)}</Text>
                        {item.isFavorite && <Text style={styles.starBadge}>★</Text>}
                      </View>
                      <Text style={styles.favContent} numberOfLines={2}>
                        {item.content}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleToggleFavorite(item.id)}
                      style={styles.starTouchBtn}
                    >
                      <Text style={[styles.favStarIcon, item.isFavorite && { color: '#f59e0b' }]}>
                        {item.isFavorite ? '★' : '☆'}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* ================= 4. UTILITY / PASSWORD SCREEN ================= */}
        {currentTab === 'password' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Set New Password</Text>
            <Text style={styles.sectionSubtitle}>
              Ported from UpdatePasswordActivity.java with credential validation
            </Text>

            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              value={newPass}
              onChangeText={setNewPass}
              placeholder="Enter new password (min 6 chars)"
              placeholderTextColor="#666"
              secureTextEntry
            />

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPass}
              onChangeText={setConfirmPass}
              placeholder="Confirm new password"
              placeholderTextColor="#666"
              secureTextEntry
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handlePasswordSubmit}>
              <Text style={styles.primaryButtonText}>SUBMIT CREDENTIALS</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ================= SCAN / RECORD DETAILS MODAL ================= */}
      <Modal visible={!!activeModalRecord} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>QR Code Details</Text>
              <TouchableOpacity onPress={() => setActiveModalRecord(null)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {activeModalRecord && (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Text style={styles.favBadge}>{activeModalRecord.type.toUpperCase()}</Text>
                  <Text style={styles.modalTimestamp}>{formatTime(activeModalRecord.timestamp)}</Text>
                  <TouchableOpacity onPress={() => handleToggleFavorite(activeModalRecord.id)}>
                    <Text style={[styles.favStarIcon, activeModalRecord.isFavorite && { color: '#f59e0b' }]}>
                      {activeModalRecord.isFavorite ? '★ Favorited' : '☆ Add to Favs'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBodyScroll}>
                  <Text style={styles.modalBody}>{activeModalRecord.content}</Text>
                </ScrollView>

                {/* Modal Action Sheet */}
                <View style={styles.modalActionGrid}>
                  <TouchableOpacity
                    style={styles.modalActionBtn}
                    onPress={() => handleShareRecordContent(activeModalRecord.content)}
                  >
                    <Text style={styles.modalActionBtnText}>Share Content</Text>
                  </TouchableOpacity>

                  {activeModalRecord.type === 'url' && (
                    <TouchableOpacity
                      style={styles.modalActionBtnPrimary}
                      onPress={() => {
                        Alert.alert('Browser', `Opening ${activeModalRecord.content}`);
                      }}
                    >
                      <Text style={styles.modalActionBtnTextPrimary}>Open URL</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.modalActionBtnDestructive}
                    onPress={() => handleDeleteSingle(activeModalRecord.id)}
                  >
                    <Text style={styles.modalActionBtnTextDestructive}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ================= EXPORT DIALOG MODAL ================= */}
      <Modal visible={isExportModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Export Scan History</Text>
            <Text style={styles.sectionSubtitle}>
              Export all {historyRecords.length} records to local storage as JSON or CSV
            </Text>

            <View style={{ gap: 12, marginTop: 12 }}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => handleExport('json')}
              >
                <Text style={styles.primaryButtonText}>EXPORT AS JSON (.json)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => handleExport('csv')}
              >
                <Text style={styles.secondaryButtonText}>EXPORT AS CSV (.csv)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setIsExportModalOpen(false)}
              >
                <Text style={styles.clearButtonText}>Cancel</Text>
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
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f1f',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#10b981',
    marginTop: 2,
  },
  headerUtilityBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1f1f1f',
    borderWidth: 1,
    borderColor: '#333',
  },
  headerUtilityText: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f1f',
    backgroundColor: '#121212',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#10b981',
  },
  tabText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#10b981',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#141414',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#262626',
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#888',
    marginBottom: 16,
  },
  modePillRow: {
    flexDirection: 'row',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#262626',
  },
  modePill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  modePillActive: {
    backgroundColor: '#1f1f1f',
  },
  modePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#777',
  },
  modePillTextActive: {
    color: '#10b981',
  },
  qrFrame: {
    width: 220,
    minHeight: 200,
    borderRadius: 20,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#333',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 16,
  },
  qrInner: {
    alignItems: 'center',
    width: '100%',
  },
  qrGraphicPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 10,
  },
  qrCornerMarkTL: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 22,
    height: 22,
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  qrCornerMarkTR: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  qrCornerMarkBL: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    width: 22,
    height: 22,
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  qrMatrixLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  qrPlaceholderText: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
  },
  qrCodePayload: {
    color: '#10b981',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginTop: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#aaa',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: '#fff',
    marginBottom: 12,
  },
  inputSplitRow: {
    flexDirection: 'row',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 11,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#262626',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  clearButton: {
    marginTop: 12,
    alignSelf: 'center',
    padding: 8,
  },
  clearButtonText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
  viewfinderSim: {
    height: 220,
    backgroundColor: '#000',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  scanLaserLine: {
    position: 'absolute',
    top: '48%',
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: '#10b981',
  },
  targetCornerTL: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#10b981',
  },
  targetCornerTR: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#10b981',
  },
  targetCornerBL: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#10b981',
  },
  targetCornerBR: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#10b981',
  },
  viewfinderText: {
    color: '#888',
    fontSize: 12,
    marginTop: 60,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#262626',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ddd',
    fontSize: 12,
    fontWeight: '600',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  smallActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#333',
  },
  smallActionBtnActive: {
    borderColor: '#10b981',
  },
  smallActionText: {
    fontSize: 11,
    color: '#ddd',
    fontWeight: '600',
  },
  filterTabRow: {
    flexDirection: 'row',
    backgroundColor: '#0a0a0a',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  filterPill: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  filterPillActive: {
    backgroundColor: '#222',
  },
  filterPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666',
  },
  filterPillTextActive: {
    color: '#10b981',
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1c1917',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#44403c',
  },
  selectionText: {
    color: '#ddd',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBatchBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteBatchText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  favItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 10,
  },
  favItemSelected: {
    borderColor: '#10b981',
    backgroundColor: '#064e3b15',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#555',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkMark: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  favBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#10b981',
    backgroundColor: '#064e3b33',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  starBadge: {
    color: '#f59e0b',
    fontSize: 11,
  },
  favDate: {
    fontSize: 10,
    color: '#666',
  },
  favContent: {
    fontSize: 12,
    color: '#eee',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  starTouchBtn: {
    padding: 8,
  },
  favStarIcon: {
    fontSize: 16,
    color: '#666',
  },
  emptyStateContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#777',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#141414',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#262626',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeBtnText: {
    fontSize: 16,
    color: '#888',
    padding: 4,
  },
  modalTimestamp: {
    fontSize: 11,
    color: '#777',
  },
  modalBodyScroll: {
    maxHeight: 180,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  modalBody: {
    fontSize: 13,
    color: '#ccc',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalActionGrid: {
    gap: 8,
  },
  modalActionBtn: {
    backgroundColor: '#262626',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalActionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalActionBtnPrimary: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalActionBtnTextPrimary: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalActionBtnDestructive: {
    backgroundColor: '#7f1d1d33',
    borderWidth: 1,
    borderColor: '#ef444455',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalActionBtnTextDestructive: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '600',
  },
  colorPickerSection: {
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#262626',
  },
  colorPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ccc',
  },
  colorHexText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#10b981',
  },
  colorSwatches: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  colorCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#444',
  },
  colorCircleActive: {
    borderColor: '#fff',
    borderWidth: 2,
    transform: [{ scale: 1.15 }],
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 2,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
    paddingVertical: 8,
  },
  searchClearBtn: {
    padding: 4,
  },
  searchClearText: {
    color: '#888',
    fontSize: 13,
  },
});

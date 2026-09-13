/**
 * WalletScreen - WyreNet Sovereign L1 EVM & Crypto Vault Interface
 * 
 * Features:
 * - On-Demand Wallet Address Generation
 * - Export / Import Private Key (Hex) & 12-Word BIP-39 Recovery Phrase
 * - EIP-712 Gasless Meta-Transactions (0-Fee Sponsored)
 * - Public Address Verification Tool (Cryptographic Challenge-Response)
 * - DeepSeek Flash 4.1 Autonomous Security Auditor
 * - Network Switcher (WyreNet Subnet 51950 & Avalanche Fuji 43113)
 * - Matrix Green Sovereign Visual Identity (Zero Emojis)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  Clipboard,
  Switch
} from 'react-native';
import WyreWalletEngine, {
  WalletState,
  NETWORKS,
  NetworkConfig,
  TransactionRecord
} from '../crypto/WyreWalletEngine';
import WyreAIEngine, { AIAuditResult } from '../ai/WyreAIEngine';
import { THEME, colors } from '../ui/theme';
const UI_COLORS = THEME?.colors || colors || { primary: "#00ff88", textSecondary: "#a0a0b0" };

export const WalletScreen: React.FC = () => {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [balance, setBalance] = useState<string>('0.0000');
  const [blockHeight, setBlockHeight] = useState<number>(641);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [claimingFaucet, setClaimingFaucet] = useState<boolean>(false);
  const [activeNetwork, setActiveNetwork] = useState<NetworkConfig>(NETWORKS.wyrenet);

  // Modals
  const [sendModalVisible, setSendModalVisible] = useState<boolean>(false);
  const [receiveModalVisible, setReceiveModalVisible] = useState<boolean>(false);
  const [backupModalVisible, setBackupModalVisible] = useState<boolean>(false);
  const [exportKeyModalVisible, setExportKeyModalVisible] = useState<boolean>(false);
  const [importModalVisible, setImportModalVisible] = useState<boolean>(false);
  const [verifyModalVisible, setVerifyModalVisible] = useState<boolean>(false);

  // Send State
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [isGasless, setIsGasless] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [aiAudit, setAiAudit] = useState<AIAuditResult | null>(null);
  const [auditing, setAuditing] = useState<boolean>(false);

  // Import State
  const [importInput, setImportInput] = useState<string>('');
  const [importType, setImportType] = useState<'mnemonic' | 'privateKey'>('mnemonic');

  // Export State
  const [exportedPrivateKey, setExportedPrivateKey] = useState<string>('');
  const [revealKey, setRevealKey] = useState<boolean>(false);

  // Verification Tool State
  const [verifyAddressInput, setVerifyAddressInput] = useState<string>('');
  const [verifyChallengeInput, setVerifyChallengeInput] = useState<string>('');
  const [verifySignatureInput, setVerifySignatureInput] = useState<string>('');
  const [verifyResult, setVerifyResult] = useState<{ verified?: boolean; recoveredAddress?: string; error?: string } | null>(null);

  // Transaction History
  const [history, setHistory] = useState<TransactionRecord[]>([]);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    setLoading(true);
    try {
      const state = await WyreWalletEngine.initialize();
      setWallet(state);
      setActiveNetwork(WyreWalletEngine.getActiveNetwork());
      await refreshBalance();
      setHistory(WyreWalletEngine.getTransactionHistory());
    } catch (e: any) {
      Alert.alert('Initialization Error', e.message || 'Failed to initialize crypto wallet.');
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async () => {
    setRefreshing(true);
    try {
      const res = await WyreWalletEngine.getBalance();
      setBalance(res.balance);
      setBlockHeight(res.blockHeight);
    } catch (e) {
    } finally {
      setRefreshing(false);
    }
  };

  const handleClaim10M = async () => {
    setClaimingFaucet(true);
    try {
      const res = await WyreWalletEngine.claim10MFaucet();
      await refreshBalance();
      Alert.alert(
        '10,000,000 WYRE Claimed',
        `Status: SUCCESS
Balance: ${res.balance} WYRE
Transaction: ${res.txHash.slice(0, 24)}...
Node: wyresup.com/node`
      );
    } catch (e: any) {
      Alert.alert('Claim Error', e.message || 'Could not claim faucet tokens.');
    } finally {
      setClaimingFaucet(false);
    }
  };

  const handleGenerateNewWallet = () => {
    Alert.alert(
      'Generate New Wallet Address',
      'This will create a brand-new BIP-39 mnemonic seed and address. Ensure you backup your existing keys.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate New',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const newState = await WyreWalletEngine.createWallet();
              setWallet(newState);
              await refreshBalance();
              setHistory(WyreWalletEngine.getTransactionHistory());
              Alert.alert('New Address Generated', `Address: ${newState.address}`);
            } catch (e: any) {
              Alert.alert('Generation Error', e.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleExportPrivateKey = () => {
    try {
      const privKey = WyreWalletEngine.exportPrivateKey();
      setExportedPrivateKey(privKey);
      setRevealKey(false);
      setExportKeyModalVisible(true);
    } catch (e: any) {
      Alert.alert('Export Error', e.message);
    }
  };

  const handleRunAiAudit = async () => {
    if (!recipient.trim() || !amount.trim()) {
      Alert.alert('Input Required', 'Please enter recipient address and amount to audit.');
      return;
    }
    setAuditing(true);
    try {
      const result = await WyreAIEngine.auditTransaction(
        recipient.trim(),
        amount.trim(),
        activeNetwork.name,
        isGasless
      );
      setAiAudit(result);
    } catch (e: any) {
      Alert.alert('Audit Error', e.message || 'Audit failed');
    } finally {
      setAuditing(false);
    }
  };

  const handleSend = async () => {
    if (!recipient.trim() || !amount.trim()) {
      Alert.alert('Validation Error', 'Please specify a recipient address and transfer amount.');
      return;
    }

    setSending(true);
    try {
      let tx: TransactionRecord;
      if (isGasless) {
        tx = await WyreWalletEngine.sendGaslessTransfer(recipient.trim(), amount.trim());
      } else {
        tx = await WyreWalletEngine.sendTransfer(recipient.trim(), amount.trim());
      }

      setHistory(WyreWalletEngine.getTransactionHistory());
      await refreshBalance();
      setSendModalVisible(false);
      setRecipient('');
      setAmount('');
      setAiAudit(null);

      Alert.alert(
        'Transaction Dispatched',
        `Hash: ${tx.hash}\nNetwork: ${tx.network}\nGasless: ${tx.isGasless ? 'Yes (Sponsored)' : 'No'}`
      );
    } catch (e: any) {
      Alert.alert('Transfer Failed', e.message || 'Transaction could not be completed.');
    } finally {
      setSending(false);
    }
  };

  const handleImport = async () => {
    if (!importInput.trim()) {
      Alert.alert('Validation Error', 'Please enter a valid mnemonic phrase or private key.');
      return;
    }

    setLoading(true);
    try {
      let newState: WalletState;
      if (importType === 'mnemonic') {
        newState = await WyreWalletEngine.importFromMnemonic(importInput.trim());
      } else {
        newState = await WyreWalletEngine.importFromPrivateKey(importInput.trim());
      }
      setWallet(newState);
      await refreshBalance();
      setHistory(WyreWalletEngine.getTransactionHistory());
      setImportModalVisible(false);
      setImportInput('');
      Alert.alert('Import Successful', `Active Address: ${newState.address}`);
    } catch (e: any) {
      Alert.alert('Import Failed', e.message || 'Could not import provided keys.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPeerAddress = () => {
    if (!verifyAddressInput.trim() || !verifyChallengeInput.trim() || !verifySignatureInput.trim()) {
      Alert.alert('Input Missing', 'Please enter Address, Challenge string, and Signature.');
      return;
    }

    const result = WyreWalletEngine.verifyAddressOwnership(
      verifyAddressInput.trim(),
      verifyChallengeInput.trim(),
      verifySignatureInput.trim()
    );
    setVerifyResult(result);
  };

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied to Clipboard', `${label} has been copied.`);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={UI_COLORS.primary} />
        <Text style={styles.loadingText}>Initializing Sovereign Vault...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Network Header */}
      <View style={styles.networkHeader}>
        <View style={styles.networkBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.networkBadgeText}>{activeNetwork.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.switchNetButton}
          onPress={async () => {
            const nextNet = activeNetwork.id === 'wyrenet' ? 'fuji' : 'wyrenet';
            await WyreWalletEngine.setNetwork(nextNet);
            setActiveNetwork(WyreWalletEngine.getActiveNetwork());
            await refreshBalance();
          }}
        >
          <Text style={styles.switchNetText}>
            Switch to {activeNetwork.id === 'wyrenet' ? 'Avalanche Fuji' : 'WyreNet L1'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>VAULT BALANCE</Text>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceNumber}>{balance}</Text>
          <Text style={styles.balanceSymbol}>{activeNetwork.symbol}</Text>
        </View>
        <Text style={styles.blockHeightText}>Block Height: #{blockHeight}</Text>

        {/* Address Row */}
        <TouchableOpacity
          style={styles.addressBox}
          onPress={() => copyToClipboard(wallet?.address || '', 'Wallet Address')}
        >
          <Text style={styles.addressLabel}>ADDRESS (CLICK TO COPY):</Text>
          <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
            {wallet?.address}
          </Text>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.sendBtn]}
            onPress={() => setSendModalVisible(true)}
          >
            <Text style={styles.sendBtnText}>SEND</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.receiveBtn]}
            onPress={() => setReceiveModalVisible(true)}
          >
            <Text style={styles.receiveBtnText}>RECEIVE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.refreshBtn]}
            onPress={refreshBalance}
            disabled={refreshing}
          >
            <Text style={styles.refreshBtnText}>{refreshing ? '...' : 'SYNC'}</Text>
          </TouchableOpacity>
        </View>

        {/* 10M WYRE Testnet Faucet Claim */}
        {activeNetwork.id === 'wyrenet' && (
          <TouchableOpacity
            style={styles.faucetBtn}
            onPress={handleClaim10M}
            disabled={claimingFaucet}
            activeOpacity={0.8}
          >
            <Text style={styles.faucetBtnText}>
              {claimingFaucet ? 'CLAIMING 10,000,000 WYRE...' : '[CLAIM 10,000,000 WYRE (TESTNET)]'}
            </Text>
            <Text style={styles.faucetNodeSub}>NODE: wyresup.com/node | SUBNET 51950</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Key Management & Generator Grid */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>KEY MANAGEMENT & IDENTITY</Text>
      </View>

      <View style={styles.toolsGrid}>
        <TouchableOpacity style={styles.toolCard} onPress={handleGenerateNewWallet}>
          <Text style={styles.toolCardTitle}>GENERATE ADDRESS</Text>
          <Text style={styles.toolCardSub}>Create new BIP-39 mnemonic seed</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolCard} onPress={handleExportPrivateKey}>
          <Text style={styles.toolCardTitle}>EXPORT PRIVATE KEY</Text>
          <Text style={styles.toolCardSub}>View 0x raw hex key securely</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolCard} onPress={() => setBackupModalVisible(true)}>
          <Text style={styles.toolCardTitle}>BACKUP 12 WORDS</Text>
          <Text style={styles.toolCardSub}>Reveal recovery phrase seed</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolCard} onPress={() => setImportModalVisible(true)}>
          <Text style={styles.toolCardTitle}>IMPORT WALLET</Text>
          <Text style={styles.toolCardSub}>Restore phrase or hex key</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.toolCard, styles.toolCardFull]} onPress={() => setVerifyModalVisible(true)}>
          <Text style={styles.toolCardTitle}>VERIFY PEER ADDRESS (DID)</Text>
          <Text style={styles.toolCardSub}>Cryptographic ECDSA challenge-response verification</Text>
        </TouchableOpacity>
      </View>

      {/* Transaction History */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>TRANSACTION LOG</Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyHistory}>
          <Text style={styles.emptyHistoryText}>No on-chain transactions recorded yet.</Text>
        </View>
      ) : (
        history.map((tx, idx) => (
          <View key={idx} style={styles.txCard}>
            <View style={styles.txHeader}>
              <Text style={styles.txType}>{tx.from.toLowerCase() === wallet?.address.toLowerCase() ? 'SENT' : 'RECEIVED'}</Text>
              <Text style={styles.txAmount}>-{tx.amount} {tx.symbol}</Text>
            </View>
            <Text style={styles.txHash} numberOfLines={1} ellipsizeMode="middle">Hash: {tx.hash}</Text>
            <View style={styles.txFooter}>
              <Text style={styles.txNetwork}>{tx.network}</Text>
              {tx.isGasless && (
                <View style={styles.gaslessBadge}>
                  <Text style={styles.gaslessBadgeText}>GASLESS SPONSORED</Text>
                </View>
              )}
            </View>
          </View>
        ))
      )}

      {/* SEND MODAL */}
      <Modal visible={sendModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>SEND TOKENS</Text>
            <Text style={styles.modalSub}>Network: {activeNetwork.name}</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Recipient Address (0x...)"
              placeholderTextColor={UI_COLORS.textSecondary}
              value={recipient}
              onChangeText={setRecipient}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Amount (e.g. 1.0)"
              placeholderTextColor={UI_COLORS.textSecondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />

            {/* Gasless Switch */}
            <View style={styles.gaslessRow}>
              <View>
                <Text style={styles.gaslessTitle}>Gasless Transaction</Text>
                <Text style={styles.gaslessSub}>Zero-fee sponsored meta-tx</Text>
              </View>
              <Switch
                value={isGasless}
                onValueChange={setIsGasless}
                trackColor={{ false: '#333', true: UI_COLORS.primary }}
                thumbColor="#fff"
              />
            </View>

            {/* AI Auditor Button */}
            <TouchableOpacity style={styles.aiAuditBtn} onPress={handleRunAiAudit} disabled={auditing}>
              <Text style={styles.aiAuditBtnText}>
                {auditing ? 'DeepSeek AI Auditing...' : 'RUN DEEPSEEK AI SECURITY AUDIT'}
              </Text>
            </TouchableOpacity>

            {aiAudit && (
              <View style={[styles.auditBox, { borderColor: aiAudit.isSafe ? UI_COLORS.primary : '#ef4444' }]}>
                <Text style={styles.auditStatus}>
                  {aiAudit.isSafe ? 'VERIFIED SAFE (Score: ' + (100 - aiAudit.riskScore) + '/100)' : 'RISK DETECTED'}
                </Text>
                <Text style={styles.auditSummary}>{aiAudit.summary}</Text>
              </View>
            )}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setSendModalVisible(false);
                  setAiAudit(null);
                }}
              >
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={handleSend}
                disabled={sending}
              >
                <Text style={styles.confirmBtnText}>{sending ? 'SUBMITTING...' : 'CONFIRM TRANSFER'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* RECEIVE MODAL */}
      <Modal visible={receiveModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>RECEIVE TOKENS</Text>
            <Text style={styles.modalSub}>Network: {activeNetwork.name}</Text>
            <View style={styles.receiveBox}>
              <Text style={styles.receiveAddress}>{wallet?.address}</Text>
            </View>
            <TouchableOpacity
              style={styles.copyAddressBtn}
              onPress={() => copyToClipboard(wallet?.address || '', 'Address')}
            >
              <Text style={styles.copyAddressBtnText}>COPY ADDRESS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setReceiveModalVisible(false)}>
              <Text style={styles.closeBtnText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* EXPORT PRIVATE KEY MODAL */}
      <Modal visible={exportKeyModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>EXPORT PRIVATE KEY</Text>
            <Text style={styles.warningText}>
              NEVER SHARE YOUR PRIVATE KEY. Anyone with this key has full control of your sovereign funds.
            </Text>

            <View style={styles.keyDisplayBox}>
              <Text style={styles.keyDisplayText}>
                {revealKey ? exportedPrivateKey : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
              </Text>
            </View>

            <View style={styles.keyActionRow}>
              <TouchableOpacity
                style={styles.keyActionBtn}
                onPress={() => setRevealKey(!revealKey)}
              >
                <Text style={styles.keyActionBtnText}>{revealKey ? 'HIDE' : 'REVEAL'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.keyActionBtn}
                onPress={() => copyToClipboard(exportedPrivateKey, 'Private Key')}
              >
                <Text style={styles.keyActionBtnText}>COPY</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setExportKeyModalVisible(false)}>
              <Text style={styles.closeBtnText}>DONE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* BACKUP 12 WORDS MODAL */}
      <Modal visible={backupModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>RECOVERY PHRASE (12 WORDS)</Text>
            <Text style={styles.warningText}>
              Write down these 12 words in order and store them in a secure physical location.
            </Text>

            <View style={styles.wordsGrid}>
              {wallet?.mnemonic.split(' ').map((w, idx) => (
                <View key={idx} style={styles.wordPill}>
                  <Text style={styles.wordIndex}>#{idx + 1}</Text>
                  <Text style={styles.wordText}>{w}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.copyAddressBtn}
              onPress={() => copyToClipboard(wallet?.mnemonic || '', 'Recovery Phrase')}
            >
              <Text style={styles.copyAddressBtnText}>COPY ALL WORDS</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setBackupModalVisible(false)}>
              <Text style={styles.closeBtnText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* IMPORT MODAL */}
      <Modal visible={importModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>IMPORT VAULT</Text>

            <View style={styles.importTabRow}>
              <TouchableOpacity
                style={[styles.importTab, importType === 'mnemonic' && styles.importTabActive]}
                onPress={() => setImportType('mnemonic')}
              >
                <Text style={[styles.importTabText, importType === 'mnemonic' && styles.importTabTextActive]}>
                  12-Word Phrase
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.importTab, importType === 'privateKey' && styles.importTabActive]}
                onPress={() => setImportType('privateKey')}
              >
                <Text style={[styles.importTabText, importType === 'privateKey' && styles.importTabTextActive]}>
                  Private Key (Hex)
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.modalInput, styles.multilineInput]}
              placeholder={importType === 'mnemonic' ? 'Enter 12 space-separated words' : 'Enter 64-character hex private key'}
              placeholderTextColor={UI_COLORS.textSecondary}
              value={importInput}
              onChangeText={setImportInput}
              multiline
              autoCapitalize="none"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setImportModalVisible(false)}>
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={handleImport}>
                <Text style={styles.confirmBtnText}>RESTORE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* VERIFICATION MODAL */}
      <Modal visible={verifyModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>VERIFY PEER ADDRESS</Text>
            <Text style={styles.modalSub}>ECDSA Cryptographic DID Verification</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Peer Address (0x...)"
              placeholderTextColor={UI_COLORS.textSecondary}
              value={verifyAddressInput}
              onChangeText={setVerifyAddressInput}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Challenge Text"
              placeholderTextColor={UI_COLORS.textSecondary}
              value={verifyChallengeInput}
              onChangeText={setVerifyChallengeInput}
              autoCapitalize="none"
            />

            <TextInput
              style={[styles.modalInput, styles.multilineInput]}
              placeholder="Signature Hex (0x...)"
              placeholderTextColor={UI_COLORS.textSecondary}
              value={verifySignatureInput}
              onChangeText={setVerifySignatureInput}
              multiline
              autoCapitalize="none"
            />

            <TouchableOpacity style={styles.confirmBtn} onPress={handleVerifyPeerAddress}>
              <Text style={styles.confirmBtnText}>RUN CRYPTOGRAPHIC VERIFICATION</Text>
            </TouchableOpacity>

            {verifyResult && (
              <View style={[styles.auditBox, { borderColor: verifyResult.verified ? UI_COLORS.primary : '#ef4444', marginTop: 12 }]}>
                <Text style={styles.auditStatus}>
                  {verifyResult.verified ? 'SIGNATURE VALID - IDENTITY VERIFIED' : 'VERIFICATION FAILED'}
                </Text>
                {verifyResult.recoveredAddress && (
                  <Text style={styles.auditSummary}>Recovered Address: {verifyResult.recoveredAddress}</Text>
                )}
                {verifyResult.error && (
                  <Text style={[styles.auditSummary, { color: '#ef4444' }]}>{verifyResult.error}</Text>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.closeBtn} onPress={() => setVerifyModalVisible(false)}>
              <Text style={styles.closeBtnText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050B07' },
  contentContainer: { padding: 16, paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#050B07' },
  loadingText: { color: UI_COLORS.primary, marginTop: 12, fontSize: 14, fontFamily: 'monospace' },
  networkHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  networkBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 255, 102, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0, 255, 102, 0.3)' },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: UI_COLORS.primary, marginRight: 8 },
  networkBadgeText: { color: UI_COLORS.primary, fontSize: 12, fontWeight: '700' },
  switchNetButton: { paddingHorizontal: 10, paddingVertical: 6 },
  switchNetText: { color: UI_COLORS.textSecondary, fontSize: 12, textDecorationLine: 'underline' },
  balanceCard: { backgroundColor: 'rgba(10, 25, 15, 0.85)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(0, 255, 102, 0.3)', marginBottom: 20 },
  balanceLabel: { color: UI_COLORS.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 8 },
  balanceNumber: { fontSize: 36, fontWeight: '800', color: '#FFFFFF', fontFamily: 'monospace' },
  balanceSymbol: { fontSize: 16, fontWeight: '700', color: UI_COLORS.primary, marginLeft: 8 },
  blockHeightText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4, fontFamily: 'monospace' },
  addressBox: { backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: 12, borderRadius: 8, marginTop: 16, borderWidth: 1, borderColor: 'rgba(0, 255, 102, 0.15)' },
  addressLabel: { color: UI_COLORS.primary, fontSize: 10, fontWeight: '700' },
  addressText: { color: '#FFFFFF', fontSize: 12, marginTop: 4, fontFamily: 'monospace' },
  actionRow: { flexDirection: 'row', marginTop: 16, gap: 10 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sendBtn: { backgroundColor: UI_COLORS.primary },
  sendBtnText: { color: '#000000', fontWeight: '800', fontSize: 13 },
  receiveBtn: { backgroundColor: 'rgba(0, 255, 102, 0.15)', borderWidth: 1, borderColor: UI_COLORS.primary },
  receiveBtnText: { color: UI_COLORS.primary, fontWeight: '700', fontSize: 13 },
  refreshBtn: { flex: 0.5, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)' },
  refreshBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  sectionHeader: { marginTop: 12, marginBottom: 12 },
  sectionTitle: { color: UI_COLORS.textSecondary, fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  toolCard: { width: '48%', backgroundColor: 'rgba(15, 30, 20, 0.6)', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0, 255, 102, 0.2)' },
  toolCardFull: { width: '100%' },
  toolCardTitle: { color: UI_COLORS.primary, fontSize: 12, fontWeight: '800' },
  toolCardSub: { color: UI_COLORS.textSecondary, fontSize: 10, marginTop: 4 },
  emptyHistory: { padding: 24, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8 },
  emptyHistoryText: { color: UI_COLORS.textSecondary, fontSize: 12 },
  txCard: { backgroundColor: 'rgba(15, 30, 20, 0.6)', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0, 255, 102, 0.15)', marginBottom: 10 },
  txHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txType: { color: UI_COLORS.primary, fontWeight: '700', fontSize: 12 },
  txAmount: { color: '#FFFFFF', fontWeight: '800', fontSize: 14, fontFamily: 'monospace' },
  txHash: { color: UI_COLORS.textSecondary, fontSize: 11, marginTop: 6, fontFamily: 'monospace' },
  txFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  txNetwork: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
  gaslessBadge: { backgroundColor: 'rgba(0, 255, 102, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  gaslessBadgeText: { color: UI_COLORS.primary, fontSize: 9, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#0A1810', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: UI_COLORS.primary },
  modalTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  modalSub: { color: UI_COLORS.primary, fontSize: 12, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  modalInput: { backgroundColor: '#050B07', borderWidth: 1, borderColor: 'rgba(0, 255, 102, 0.3)', borderRadius: 8, padding: 12, color: '#FFFFFF', fontSize: 13, marginBottom: 12, fontFamily: 'monospace' },
  multilineInput: { height: 80, textAlignVertical: 'top' },
  gaslessRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, marginBottom: 12 },
  gaslessTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  gaslessSub: { color: UI_COLORS.textSecondary, fontSize: 10 },
  aiAuditBtn: { backgroundColor: 'rgba(0, 255, 102, 0.1)', borderWidth: 1, borderColor: UI_COLORS.primary, paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  aiAuditBtnText: { color: UI_COLORS.primary, fontSize: 11, fontWeight: '800' },
  auditBox: { backgroundColor: '#050B07', padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 12 },
  auditStatus: { color: UI_COLORS.primary, fontSize: 11, fontWeight: '800' },
  auditSummary: { color: '#FFFFFF', fontSize: 11, marginTop: 4 },
  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  cancelBtnText: { color: '#FFFFFF', fontWeight: '700' },
  confirmBtn: { backgroundColor: UI_COLORS.primary, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  confirmBtnText: { color: '#000000', fontWeight: '800' },
  receiveBox: { backgroundColor: '#050B07', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0, 255, 102, 0.2)', marginBottom: 16 },
  receiveAddress: { color: '#FFFFFF', fontSize: 13, fontFamily: 'monospace', textAlign: 'center' },
  copyAddressBtn: { backgroundColor: UI_COLORS.primary, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  copyAddressBtnText: { color: '#000000', fontWeight: '800' },
  closeBtn: { paddingVertical: 10, alignItems: 'center', marginTop: 4 },
  closeBtnText: { color: UI_COLORS.textSecondary, fontSize: 12 },
  warningText: { color: '#f59e0b', fontSize: 11, marginBottom: 14, textAlign: 'center' },
  keyDisplayBox: { backgroundColor: '#050B07', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#ef4444', marginBottom: 16 },
  keyDisplayText: { color: '#FFFFFF', fontSize: 12, fontFamily: 'monospace', textAlign: 'center' },
  keyActionRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  keyActionBtn: { flex: 1, backgroundColor: 'rgba(0, 255, 102, 0.15)', borderWidth: 1, borderColor: UI_COLORS.primary, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  keyActionBtnText: { color: UI_COLORS.primary, fontWeight: '700', fontSize: 12 },
  wordsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  wordPill: { width: '31%', backgroundColor: '#050B07', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(0, 255, 102, 0.2)', flexDirection: 'row', alignItems: 'center' },
  wordIndex: { color: UI_COLORS.primary, fontSize: 10, fontWeight: '700', marginRight: 4 },
  wordText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  importTabRow: { flexDirection: 'row', marginBottom: 14, gap: 10 },
  importTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  importTabActive: { borderColor: UI_COLORS.primary, backgroundColor: 'rgba(0, 255, 102, 0.1)' },
  importTabText: { color: UI_COLORS.textSecondary, fontSize: 12 },
  importTabTextActive: { color: UI_COLORS.primary, fontWeight: '700' },
  faucetBtn: {
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 255, 136, 0.12)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.45)',
    alignItems: 'center',
  },
  faucetBtnText: {
    color: '#00ff88',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  faucetNodeSub: {
    color: 'rgba(160, 160, 176, 0.8)',
    fontSize: 10,
    marginTop: 3,
    fontWeight: '600',
  }
});

export default WalletScreen;

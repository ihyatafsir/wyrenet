/**
 * WyreWalletScreen - Native Embedded Crypto Wallet Screen
 * 
 * Matrix Green & Sovereign Dark Theme matching WyreSup.
 * Supports WyreNet L1 Subnet (51950, ZBAT) and Avalanche Fuji (43113, AVAX).
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
  StatusBar,
  ActivityIndicator
} from 'react-native';
import wyreWallet, { NETWORKS, TransactionRecord, WalletState } from '../crypto/WyreWalletEngine';
import { theme } from '../ui/theme';

export default function WalletScreen() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [balance, setBalance] = useState('0.0000');
  const [blockHeight, setBlockHeight] = useState(641);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<TransactionRecord[]>([]);

  // Modals
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Form Inputs
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [importInput, setImportInput] = useState('');
  const [sending, setSending] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    setLoading(true);
    try {
      const state = await wyreWallet.init();
      setWallet(state);
      await refreshBalance();
      setHistory(wyreWallet.getTransactionHistory());
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async () => {
    try {
      const res = await wyreWallet.getBalance();
      setBalance(res.balance);
      setBlockHeight(res.blockHeight);
    } catch (e) {}
  };

  const handleSend = async () => {
    if (!recipient.trim() || !amount.trim()) {
      Alert.alert('Validation Error', 'Please enter recipient address and amount');
      return;
    }
    setSending(true);
    try {
      const tx = await wyreWallet.sendTransfer(recipient.trim(), amount.trim());
      Alert.alert('Transfer Confirmed', `Transaction Broadcast:\n${tx.hash.substring(0, 20)}...`);
      setShowSendModal(false);
      setRecipient('');
      setAmount('');
      setHistory(wyreWallet.getTransactionHistory());
      await refreshBalance();
    } catch (e: any) {
      Alert.alert('Transfer Error', e.message);
    } finally {
      setSending(false);
    }
  };

  const handleImport = async () => {
    if (!importInput.trim()) return;
    try {
      const isMnemonic = importInput.trim().includes(' ');
      if (isMnemonic) {
        await wyreWallet.importFromMnemonic(importInput.trim());
      } else {
        await wyreWallet.importFromPrivateKey(importInput.trim());
      }
      setShowImportModal(false);
      setImportInput('');
      await loadWallet();
      Alert.alert('Wallet Restored', 'Your wallet has been successfully imported.');
    } catch (e: any) {
      Alert.alert('Import Failed', e.message);
    }
  };

  const switchNetwork = async (netId: string) => {
    await wyreWallet.setNetwork(netId);
    setWallet(wyreWallet.getWalletState());
    await refreshBalance();
  };

  const activeNetwork = wyreWallet.getActiveNetwork();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050B07" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>WyreWallet</Text>
          <Text style={styles.headerSubtitle}>خَزِينَة • Sovereign L1 Vault</Text>
        </View>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>Chain: {activeNetwork.chainId}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Network Switcher Pills */}
        <View style={styles.networkRow}>
          <TouchableOpacity
            style={[styles.networkPill, activeNetwork.id === 'wyrenet' && styles.networkPillActive]}
            onPress={() => switchNetwork('wyrenet')}
          >
            <Text style={[styles.networkPillText, activeNetwork.id === 'wyrenet' && styles.networkPillTextActive]}>
              WyreNet L1 (51950)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.networkPill, activeNetwork.id === 'fuji' && styles.networkPillActive]}
            onPress={() => switchNetwork('fuji')}
          >
            <Text style={[styles.networkPillText, activeNetwork.id === 'fuji' && styles.networkPillTextActive]}>
              Avalanche Fuji (43113)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>{balance}</Text>
            <Text style={styles.balanceSymbol}>{activeNetwork.symbol}</Text>
          </View>

          <View style={styles.addressBox}>
            <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
              {wallet?.address || '0x...'}
            </Text>
            <TouchableOpacity
              style={styles.copyBtn}
              onPress={() => {
                setCopiedToast(true);
                setTimeout(() => setCopiedToast(false), 2000);
              }}
            >
              <Text style={styles.copyBtnText}>{copiedToast ? 'COPIED' : 'COPY'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.footerInfo}>Block #{blockHeight}</Text>
            <Text style={styles.footerInfo}>DID: did:wyre:{wallet?.address?.substring(2, 10)}...</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowSendModal(true)}>
            <Text style={styles.actionBtnIcon}>↑</Text>
            <Text style={styles.actionBtnText}>Send</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowReceiveModal(true)}>
            <Text style={styles.actionBtnIcon}>↓</Text>
            <Text style={styles.actionBtnText}>Receive</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowBackupModal(true)}>
            <Text style={styles.actionBtnIcon}>⚿</Text>
            <Text style={styles.actionBtnText}>Backup</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowImportModal(true)}>
            <Text style={styles.actionBtnIcon}>↻</Text>
            <Text style={styles.actionBtnText}>Import</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction History Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Activity & Ledger Notarizations</Text>
          <TouchableOpacity onPress={refreshBalance}>
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No recent transactions</Text>
            <Text style={styles.emptySubtext}>Transactions and proof anchors on WyreNet Subnet will appear here</Text>
          </View>
        ) : (
          history.map((tx, idx) => (
            <View key={idx} style={styles.txCard}>
              <View style={styles.txHeader}>
                <Text style={styles.txType}>Transfer Out</Text>
                <Text style={styles.txAmount}>-{tx.amount} {tx.symbol}</Text>
              </View>
              <Text style={styles.txHash} numberOfLines={1} ellipsizeMode="middle">{tx.hash}</Text>
              <View style={styles.txFooter}>
                <Text style={styles.txTime}>{new Date(tx.timestamp).toLocaleTimeString()}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{tx.status}</Text>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Send Modal */}
      <Modal visible={showSendModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send {activeNetwork.symbol}</Text>
            <Text style={styles.modalSubtitle}>WyreNet L1 Instant Mesh Transfer</Text>

            <Text style={styles.inputLabel}>Recipient Address (0x...)</Text>
            <TextInput
              style={styles.input}
              placeholder="0x..."
              placeholderTextColor="#555"
              value={recipient}
              onChangeText={setRecipient}
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Amount ({activeNetwork.symbol})</Text>
            <TextInput
              style={styles.input}
              placeholder="0.0"
              placeholderTextColor="#555"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowSendModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleSend} disabled={sending}>
                {sending ? <ActivityIndicator color="#000" /> : <Text style={styles.modalConfirmText}>Confirm & Sign</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Receive Modal */}
      <Modal visible={showReceiveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Receive {activeNetwork.symbol}</Text>
            <Text style={styles.modalSubtitle}>Your Public WyreNet Address</Text>

            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrText}>[ QR Code: {wallet?.address?.substring(0, 10)}... ]</Text>
            </View>

            <View style={styles.addressBoxModal}>
              <Text style={styles.addressTextModal}>{wallet?.address}</Text>
            </View>

            <TouchableOpacity style={styles.modalConfirmBtn} onPress={() => setShowReceiveModal(false)}>
              <Text style={styles.modalConfirmText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Backup / Seed Modal */}
      <Modal visible={showBackupModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Secret Recovery Phrase</Text>
            <Text style={styles.modalWarning}>
              WARNING: Never share these 12 words with anyone. Anyone with this phrase can access your funds.
            </Text>

            <View style={styles.seedBox}>
              <Text style={styles.seedText}>{wallet?.mnemonic || 'No seed phrase available (private key import)'}</Text>
            </View>

            <TouchableOpacity style={styles.modalConfirmBtn} onPress={() => setShowBackupModal(false)}>
              <Text style={styles.modalConfirmText}>I Have Backed It Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Import Modal */}
      <Modal visible={showImportModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Import Wallet</Text>
            <Text style={styles.modalSubtitle}>Paste 12-word seed phrase or hex private key</Text>

            <TextInput
              style={[styles.input, { height: 90 }]}
              placeholder="Paste phrase or private key..."
              placeholderTextColor="#555"
              multiline
              value={importInput}
              onChangeText={setImportInput}
              autoCapitalize="none"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowImportModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleImport}>
                <Text style={styles.modalConfirmText}>Restore</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050B07'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0F2618'
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00FF66',
    letterSpacing: 1
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#668877',
    marginTop: 2
  },
  badgeContainer: {
    backgroundColor: '#0F2618',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00FF66'
  },
  badgeText: {
    fontSize: 11,
    color: '#00FF66',
    fontWeight: '600'
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12
  },
  networkRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16
  },
  networkPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0A170F',
    borderWidth: 1,
    borderColor: '#153322',
    alignItems: 'center'
  },
  networkPillActive: {
    borderColor: '#00FF66',
    backgroundColor: '#0F2C1B'
  },
  networkPillText: {
    fontSize: 12,
    color: '#779988'
  },
  networkPillTextActive: {
    color: '#00FF66',
    fontWeight: 'bold'
  },
  balanceCard: {
    backgroundColor: '#08140D',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#00FF66',
    shadowColor: '#00FF66',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20
  },
  balanceLabel: {
    fontSize: 11,
    color: '#557766',
    fontWeight: 'bold',
    letterSpacing: 1.5
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
    marginBottom: 14
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  balanceSymbol: {
    fontSize: 18,
    color: '#00FF66',
    fontWeight: '600',
    marginLeft: 8
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#040906',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0E2416'
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: '#88AA99',
    fontFamily: 'monospace'
  },
  copyBtn: {
    backgroundColor: '#00FF66',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8
  },
  copyBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000'
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#0F2618'
  },
  footerInfo: {
    fontSize: 10,
    color: '#446655'
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#0A170F',
    marginHorizontal: 4,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#153322',
    alignItems: 'center'
  },
  actionBtnIcon: {
    fontSize: 18,
    color: '#00FF66',
    marginBottom: 4,
    fontWeight: 'bold'
  },
  actionBtnText: {
    fontSize: 12,
    color: '#CCDDEE',
    fontWeight: '600'
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DDEEFF',
    letterSpacing: 0.5
  },
  refreshText: {
    fontSize: 12,
    color: '#00FF66'
  },
  emptyCard: {
    backgroundColor: '#08120B',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#102216'
  },
  emptyText: {
    fontSize: 14,
    color: '#779988',
    fontWeight: 'bold'
  },
  emptySubtext: {
    fontSize: 11,
    color: '#446655',
    textAlign: 'center',
    marginTop: 4
  },
  txCard: {
    backgroundColor: '#08140D',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#152C1E'
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  txType: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '600'
  },
  txAmount: {
    fontSize: 13,
    color: '#FF6666',
    fontWeight: 'bold'
  },
  txHash: {
    fontSize: 10,
    color: '#557766',
    fontFamily: 'monospace',
    marginBottom: 6
  },
  txFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  txTime: {
    fontSize: 10,
    color: '#446655'
  },
  statusBadge: {
    backgroundColor: '#0F2618',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  statusText: {
    fontSize: 9,
    color: '#00FF66',
    fontWeight: 'bold'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#08140D',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#00FF66'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00FF66',
    marginBottom: 4
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#779988',
    marginBottom: 16
  },
  modalWarning: {
    fontSize: 12,
    color: '#FFAA33',
    marginBottom: 14,
    lineHeight: 16
  },
  inputLabel: {
    fontSize: 12,
    color: '#88AA99',
    marginBottom: 6,
    marginTop: 8
  },
  input: {
    backgroundColor: '#040805',
    borderWidth: 1,
    borderColor: '#153322',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: 13
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#15241B',
    alignItems: 'center'
  },
  modalCancelText: {
    color: '#88AA99',
    fontWeight: '600'
  },
  modalConfirmBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#00FF66',
    alignItems: 'center'
  },
  modalConfirmText: {
    color: '#000',
    fontWeight: 'bold'
  },
  qrPlaceholder: {
    height: 140,
    backgroundColor: '#040805',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#153322',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  qrText: {
    color: '#00FF66',
    fontSize: 12,
    fontFamily: 'monospace'
  },
  addressBoxModal: {
    backgroundColor: '#040805',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#153322',
    marginBottom: 20
  },
  addressTextModal: {
    color: '#CCDDEE',
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'monospace'
  },
  seedBox: {
    backgroundColor: '#040805',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#335544',
    marginBottom: 20
  },
  seedText: {
    color: '#00FF66',
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: 'monospace'
  }
});

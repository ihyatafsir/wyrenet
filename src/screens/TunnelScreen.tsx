/**
 * شَاشَة النَّفَق (Shashat al-Nafaq) - Tunnel Management Screen
 * UI for creating and managing P2P tunnels
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    Switch,
} from 'react-native';
import { colors, spacing, borderRadius } from '../ui/theme';
import { nafaqTunnel, TunnelConfig, TunnelState, TunnelStats } from '../network/NafaqTunnel';

interface TunnelItemProps {
    tunnel: TunnelConfig;
    state: TunnelState;
    stats?: TunnelStats;
    onToggle: () => void;
    onDelete: () => void;
}

function TunnelItem({ tunnel, state, stats, onToggle, onDelete }: TunnelItemProps) {
    const isOpen = state === 'maftuh';
    const isOpening = state === 'yaftah';

    const stateLabels: Record<TunnelState, { text: string; emoji: string }> = {
        mughlag: { text: 'Closed', badge: '[CLOSED]' },
        yaftah: { text: 'Opening...', badge: '[WAIT]' },
        maftuh: { text: 'Open', badge: '[OPEN]' },
        muqta: { text: 'Error', badge: '[ERR]' },
    };

    const formatBytes = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    return (
        <View style={styles.tunnelCard}>
            <View style={styles.tunnelHeader}>
                <Text style={styles.tunnelName}>{tunnel.name}</Text>
                <View style={styles.tunnelState}>
                    <Text style={styles.stateBadge}>{stateLabels[state].emoji}</Text>
                    <Text style={styles.stateText}>{stateLabels[state].text}</Text>
                </View>
            </View>

            <View style={styles.tunnelInfo}>
                <Text style={styles.infoText}>
                    Local: <Text style={styles.infoValue}>:{tunnel.localPort}</Text>
                </Text>
                <Text style={styles.infoText}>→</Text>
                <Text style={styles.infoText}>
                    Remote: <Text style={styles.infoValue}>{tunnel.remotePeerId.split('@')[0]}:{tunnel.remotePort}</Text>
                </Text>
            </View>

            {stats && isOpen && (
                <View style={styles.statsRow}>
                    <Text style={styles.statText}>↑ {formatBytes(stats.bytesOut)}</Text>
                    <Text style={styles.statText}>↓ {formatBytes(stats.bytesIn)}</Text>
                    <Text style={styles.statText}>CONNS: {stats.activeConnections}</Text>
                </View>
            )}

            <View style={styles.tunnelActions}>
                <Switch
                    value={isOpen || isOpening}
                    onValueChange={onToggle}
                    trackColor={{ false: colors.bgHover, true: colors.primaryGlow }}
                    thumbColor={isOpen ? colors.primary : colors.textMuted}
                />
                <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
                    <Text style={styles.deleteText}>[DEL]</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default function TunnelScreen() {
    const [tunnels, setTunnels] = useState<TunnelConfig[]>([]);
    const [tunnelStates, setTunnelStates] = useState<Map<string, TunnelState>>(new Map());
    const [tunnelStats, setTunnelStats] = useState<Map<string, TunnelStats>>(new Map());
    const [showCreate, setShowCreate] = useState(false);

    // Create form state
    const [newName, setNewName] = useState('');
    const [newLocalPort, setNewLocalPort] = useState('');
    const [newRemotePort, setNewRemotePort] = useState('');
    const [newRemotePeer, setNewRemotePeer] = useState('');
    const [newEncrypted, setNewEncrypted] = useState(true);

    useEffect(() => {
        // Load existing tunnels
        refreshTunnels();

        // Listen for state changes
        nafaqTunnel.setOnStateChange((tunnel, state) => {
            setTunnelStates(prev => new Map(prev).set(tunnel.id, state));
        });

        // Refresh stats periodically
        const interval = setInterval(() => {
            for (const tunnel of nafaqTunnel.getAllTunnels()) {
                const stats = nafaqTunnel.getTunnelStats(tunnel.id);
                if (stats) {
                    setTunnelStats(prev => new Map(prev).set(tunnel.id, stats));
                }
            }
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const refreshTunnels = () => {
        const allTunnels = nafaqTunnel.getAllTunnels();
        setTunnels(allTunnels);

        const states = new Map<string, TunnelState>();
        const stats = new Map<string, TunnelStats>();

        for (const tunnel of allTunnels) {
            const state = nafaqTunnel.getTunnelState(tunnel.id);
            if (state) states.set(tunnel.id, state);

            const tunnelStats = nafaqTunnel.getTunnelStats(tunnel.id);
            if (tunnelStats) stats.set(tunnel.id, tunnelStats);
        }

        setTunnelStates(states);
        setTunnelStats(stats);
    };

    const createTunnel = () => {
        if (!newName || !newLocalPort || !newRemotePort || !newRemotePeer) {
            Alert.alert('Missing Fields', 'Please fill in all tunnel configuration fields');
            return;
        }

        const localPort = parseInt(newLocalPort, 10);
        const remotePort = parseInt(newRemotePort, 10);

        if (isNaN(localPort) || isNaN(remotePort)) {
            Alert.alert('Invalid Ports', 'Ports must be numbers');
            return;
        }

        nafaqTunnel.createTunnel({
            name: newName,
            localPort,
            remotePort,
            remotePeerId: newRemotePeer,
            encrypted: newEncrypted,
            bidirectional: true,
        });

        // Reset form
        setNewName('');
        setNewLocalPort('');
        setNewRemotePort('');
        setNewRemotePeer('');
        setShowCreate(false);
        refreshTunnels();
    };

    const toggleTunnel = async (tunnelId: string) => {
        const state = tunnelStates.get(tunnelId);
        if (state === 'maftuh') {
            nafaqTunnel.closeTunnel(tunnelId);
        } else {
            await nafaqTunnel.openTunnel(tunnelId);
        }
    };

    const deleteTunnel = (tunnelId: string) => {
        Alert.alert(
            'Delete Tunnel',
            'Are you sure you want to delete this tunnel?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        nafaqTunnel.deleteTunnel(tunnelId);
                        refreshTunnels();
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>نَفَق Tunnels</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowCreate(!showCreate)}
                >
                    <Text style={styles.addButtonText}>{showCreate ? '✕' : '+'}</Text>
                </TouchableOpacity>
            </View>

            {showCreate && (
                <View style={styles.createForm}>
                    <Text style={styles.formTitle}>Create New Tunnel</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Tunnel Name"
                        placeholderTextColor={colors.textMuted}
                        value={newName}
                        onChangeText={setNewName}
                    />

                    <View style={styles.portRow}>
                        <TextInput
                            style={[styles.input, styles.portInput]}
                            placeholder="Local Port"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="numeric"
                            value={newLocalPort}
                            onChangeText={setNewLocalPort}
                        />
                        <Text style={styles.arrow}>→</Text>
                        <TextInput
                            style={[styles.input, styles.portInput]}
                            placeholder="Remote Port"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="numeric"
                            value={newRemotePort}
                            onChangeText={setNewRemotePort}
                        />
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="Remote Peer ID (e.g. alice@abc123)"
                        placeholderTextColor={colors.textMuted}
                        value={newRemotePeer}
                        onChangeText={setNewRemotePeer}
                    />

                    <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>Encrypted (Miftah)</Text>
                        <Switch
                            value={newEncrypted}
                            onValueChange={setNewEncrypted}
                            trackColor={{ false: colors.bgHover, true: colors.primaryGlow }}
                            thumbColor={newEncrypted ? colors.primary : colors.textMuted}
                        />
                    </View>

                    <TouchableOpacity style={styles.createButton} onPress={createTunnel}>
                        <Text style={styles.createButtonText}>إِنْشَاء Create Tunnel</Text>
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView style={styles.tunnelList}>
                {tunnels.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyBadge}>[TUNNEL]</Text>
                        <Text style={styles.emptyText}>No tunnels yet</Text>
                        <Text style={styles.emptySubtext}>
                            Create a tunnel to forward ports over P2P
                        </Text>
                    </View>
                ) : (
                    tunnels.map(tunnel => (
                        <TunnelItem
                            key={tunnel.id}
                            tunnel={tunnel}
                            state={tunnelStates.get(tunnel.id) || 'mughlag'}
                            stats={tunnelStats.get(tunnel.id)}
                            onToggle={() => toggleTunnel(tunnel.id)}
                            onDelete={() => deleteTunnel(tunnel.id)}
                        />
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgDeep,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonText: {
        fontSize: 24,
        color: colors.bgDeep,
        fontWeight: '700',
    },
    createForm: {
        backgroundColor: colors.bgCard,
        margin: spacing.md,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: spacing.lg,
    },
    input: {
        backgroundColor: colors.bgElevated,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    portRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    portInput: {
        flex: 1,
    },
    arrow: {
        color: colors.textMuted,
        fontSize: 20,
        paddingHorizontal: spacing.sm,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: spacing.md,
    },
    switchLabel: {
        color: colors.textSecondary,
        fontSize: 14,
    },
    createButton: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        alignItems: 'center',
        marginTop: spacing.md,
    },
    createButtonText: {
        color: colors.bgDeep,
        fontSize: 16,
        fontWeight: '700',
    },
    tunnelList: {
        flex: 1,
        padding: spacing.md,
    },
    tunnelCard: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    tunnelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    tunnelName: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    tunnelState: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    stateEmoji: {
        fontSize: 12,
    },
    stateText: {
        fontSize: 12,
        color: colors.textMuted,
    },
    tunnelInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    infoText: {
        color: colors.textMuted,
        fontSize: 13,
    },
    infoValue: {
        color: colors.primary,
        fontFamily: 'monospace',
    },
    statsRow: {
        flexDirection: 'row',
        gap: spacing.lg,
        marginBottom: spacing.sm,
    },
    statText: {
        color: colors.textSecondary,
        fontSize: 12,
    },
    tunnelActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    deleteButton: {
        padding: spacing.sm,
    },
    deleteText: {
        fontSize: 18,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xxl * 2,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: spacing.lg,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    emptySubtext: {
        fontSize: 14,
        color: colors.textMuted,
        textAlign: 'center',
    },
});

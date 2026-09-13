/**
 * شَاشَة المَلَاذ (Shashat al-Maladh) - Stealth Discovery Screen
 * From Lisan al-Arab: "شَاشَة - screen, display surface"
 * 
 * Management UI for the Maladh stealth discovery protocol.
 * Allows toggling individual primitives and monitoring discovery activity.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Switch,
    TextInput,
    FlatList,
    Alert,
    Modal,
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../ui/theme';
import {
    maladhDiscovery,
    MaladhMethodInfo,
    MaladhLogEntry,
    MaladhBeacon,
    MaladhMethod,
} from '../network/MaladhDiscovery';
import { getUnifiedProtocol } from '../network/UnifiedProtocolManager';

// Stealth score indicators
const STEALTH_DOTS = ['[0]', '[1]', '[2]', '[3]', '[OK]'];
const METHOD_ICONS: Record<MaladhMethod, string> = {
    hajar: '🪨',
    ramad: '[RAMAD]',
    qina: '[QINA]',
    dalil: '[DALIL]',
    ghayba: '[GHAYBA]',
};

function StealthScoreBar({ score }: { score: number }) {
    return (
        <View style={styles.scoreBar}>
            {[1, 2, 3, 4, 5].map(i => (
                <View
                    key={i}
                    style={[
                        styles.scoreDot,
                        { backgroundColor: i <= score ? colors.primary : colors.bgHover },
                    ]}
                />
            ))}
            <Text style={styles.scoreLabel}>
                {score >= 5 ? 'مُخْفِي تَمَامًا' : score >= 3 ? 'خَفِيّ' : 'مُتَوَسِّط'}
            </Text>
        </View>
    );
}

function MethodCard({
    method,
    onToggle,
}: {
    method: MaladhMethodInfo;
    onToggle: (id: MaladhMethod, enabled: boolean) => void;
}) {
    return (
        <View style={[styles.methodCard, method.enabled && styles.methodCardActive]}>
            <View style={styles.methodHeader}>
                <Text style={styles.methodIcon}>
                    {METHOD_ICONS[method.id]}
                </Text>
                <View style={styles.methodNames}>
                    <Text style={styles.methodNameAr}>{method.nameAr}</Text>
                    <Text style={styles.methodNameEn}>{method.nameEn}</Text>
                </View>
                <Switch
                    value={method.enabled}
                    onValueChange={(val) => onToggle(method.id, val)}
                    trackColor={{ false: colors.bgHover, true: colors.primaryDark }}
                    thumbColor={method.enabled ? colors.primary : colors.textMuted}
                />
            </View>
            <Text style={styles.methodDesc}>{method.description}</Text>
            <StealthScoreBar score={method.stealthScore} />
        </View>
    );
}

function LogEntry({ entry }: { entry: MaladhLogEntry }) {
    const levelColor = {
        info: colors.textSecondary,
        warn: colors.connecting,
        success: colors.primary,
        error: colors.offline,
    }[entry.level];

    const time = new Date(entry.timestamp).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    return (
        <View style={styles.logEntry}>
            <Text style={[styles.logLevel, { color: levelColor }]}>●</Text>
            <Text style={styles.logTime}>{time}</Text>
            <Text style={styles.logIcon}>{METHOD_ICONS[entry.method]}</Text>
            <View style={styles.logTextWrap}>
                <Text style={styles.logEvent}>{entry.event}</Text>
                <Text style={styles.logDetail} numberOfLines={1}>{entry.detail}</Text>
            </View>
        </View>
    );
}

export default function MaladhScreen() {
    const [isActive, setIsActive] = useState(maladhDiscovery.isActive());
    const [methods, setMethods] = useState<MaladhMethodInfo[]>(maladhDiscovery.getMethods());
    const [log, setLog] = useState<MaladhLogEntry[]>(maladhDiscovery.getLog());
    const [discoveredPeers, setDiscoveredPeers] = useState<MaladhBeacon[]>(maladhDiscovery.getDiscoveredPeers());
    const [showConfig, setShowConfig] = useState(false);
    const [ghaybaSecret, setGhaybaSecret] = useState('');
    const [hajarLocation, setHajarLocation] = useState('');

    useEffect(() => {
        const onStateChange = () => {
            setIsActive(maladhDiscovery.isActive());
            setMethods(maladhDiscovery.getMethods());
        };

        const onLog = (entry: MaladhLogEntry) => {
            setLog(prev => [...prev.slice(-49), entry]);
        };

        const onPeerDiscovered = (beacon: MaladhBeacon) => {
            setDiscoveredPeers(prev => [...prev, beacon]);
        };

        maladhDiscovery.addListener('stateChange', onStateChange);
        maladhDiscovery.addListener('log', onLog);
        maladhDiscovery.addListener('peerDiscovered', onPeerDiscovered);

        return () => {
            maladhDiscovery.removeListener('stateChange', onStateChange);
            maladhDiscovery.removeListener('log', onLog);
            maladhDiscovery.removeListener('peerDiscovered', onPeerDiscovered);
        };
    }, []);

    const toggleStealth = useCallback(() => {
        if (isActive) {
            maladhDiscovery.deactivate();
        } else {
            maladhDiscovery.activate();
        }
        setIsActive(!isActive);
    }, [isActive]);

    const toggleMethod = useCallback((id: MaladhMethod, enabled: boolean) => {
        maladhDiscovery.toggleMethod(id, enabled);
        setMethods(maladhDiscovery.getMethods());
    }, []);

    const handleGhaybaSchedule = useCallback(() => {
        if (!ghaybaSecret.trim()) {
            Alert.alert('غَيْبَة', 'Enter a shared secret first');
            return;
        }

        const rendezvous = maladhDiscovery.ghaybaComputeRendezvous({
            sharedSecret: ghaybaSecret,
            windowDuration: 60,
            hashRounds: 1000,
            listenPort: 0,
        });

        const openTime = new Date(rendezvous.windowStart).toLocaleTimeString();
        Alert.alert(
            'غَيْبَة مَوْعِد',
            `Next rendezvous:\n[TIME] ${openTime}\n[PORT] Port ${rendezvous.port}\n[WIN] 60s window`,
        );
    }, [ghaybaSecret]);

    const handleConnect = useCallback(async (beacon: MaladhBeacon) => {
        const munassiq = getUnifiedProtocol();
        try {
            const success = await munassiq.tawsilKhafiyy(beacon);
            if (success) {
                Alert.alert('وَصْل مُتَّصِل', `Connected to stealth peer ${beacon.peerId.slice(0, 12)}...`);
            } else {
                Alert.alert('مَانِع', 'Connection failed — peer may be unreachable');
            }
        } catch (err) {
            Alert.alert('خَطَأ', `Connection error: ${err}`);
        }
    }, []);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.headerIcon}>[STEALTH]</Text>
                    <View>
                        <Text style={styles.title}>مَلَاذ</Text>
                        <Text style={styles.subtitle}>Stealth Discovery</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={[styles.masterToggle, isActive && styles.masterToggleActive]}
                    onPress={toggleStealth}
                >
                    <Text style={[styles.masterToggleText, isActive && styles.masterToggleTextActive]}>
                        {isActive ? 'خَفِيّ' : 'ظَاهِر'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Status Banner */}
                <View style={[styles.statusBanner, isActive && styles.statusBannerActive]}>
                    <Text style={styles.statusIcon}>{isActive ? '[SHIELD]' : '[PEER]'}</Text>
                    <Text style={[styles.statusText, isActive && styles.statusTextActive]}>
                        {isActive
                            ? 'Stealth mode ACTIVE — discovery is hidden'
                            : 'Stealth mode OFF — using visible discovery'
                        }
                    </Text>
                </View>

                {/* Discovery Methods */}
                <Text style={styles.sectionTitle}>طُرُق الاِكْتِشَاف — Discovery Methods</Text>
                {methods.map(method => (
                    <MethodCard
                        key={method.id}
                        method={method}
                        onToggle={toggleMethod}
                    />
                ))}

                {/* Ghayba Configuration */}
                <Text style={styles.sectionTitle}>غَيْبَة — Ephemeral Rendezvous</Text>
                <View style={styles.configCard}>
                    <Text style={styles.configLabel}>Shared Secret (سِرّ مُشْتَرَك)</Text>
                    <TextInput
                        style={styles.configInput}
                        value={ghaybaSecret}
                        onChangeText={setGhaybaSecret}
                        placeholder="Enter shared secret..."
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry
                    />
                    <TouchableOpacity style={styles.configButton} onPress={handleGhaybaSchedule}>
                        <Text style={styles.configButtonText}>اِحْسِب مَوْعِد — Compute Rendezvous</Text>
                    </TouchableOpacity>
                </View>

                {/* Discovered Peers */}
                {discoveredPeers.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>
                            أَقْرَان مَكْشُوفَة — Discovered ({discoveredPeers.length})
                        </Text>
                        {discoveredPeers.map((peer, idx) => (
                            <View key={idx} style={styles.peerCard}>
                                <Text style={styles.peerIcon}>[LINK]</Text>
                                <View style={styles.peerInfo}>
                                    <Text style={styles.peerId}>{peer.peerId.slice(0, 24)}...</Text>
                                    <Text style={styles.peerEndpoint}>
                                        {peer.endpoints[0]?.type}://{peer.endpoints[0]?.host}:{peer.endpoints[0]?.port}
                                    </Text>
                                </View>
                                <TouchableOpacity style={styles.connectBtn} onPress={() => handleConnect(peer)}>
                                    <Text style={styles.connectBtnText}>وَصْل</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </>
                )}

                {/* Activity Log */}
                <Text style={styles.sectionTitle}>سِجِلّ النَّشَاط — Activity Log</Text>
                <View style={styles.logContainer}>
                    {log.length === 0 ? (
                        <Text style={styles.logEmpty}>No activity yet — activate stealth mode to begin</Text>
                    ) : (
                        log.slice().reverse().slice(0, 20).map((entry, idx) => (
                            <LogEntry key={idx} entry={entry} />
                        ))
                    )}
                </View>

                <View style={{ height: 40 }} />
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: 50,
        paddingBottom: spacing.md,
        backgroundColor: colors.bgDark,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    headerIcon: {
        fontSize: 28,
    },
    title: {
        fontSize: typography.sizes.xl,
        fontWeight: typography.weights.bold,
        color: colors.textPrimary,
    },
    subtitle: {
        fontSize: typography.sizes.xs,
        color: colors.textMuted,
        marginTop: -2,
    },
    masterToggle: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        backgroundColor: colors.bgElevated,
        borderWidth: 1,
        borderColor: colors.border,
    },
    masterToggleActive: {
        backgroundColor: 'rgba(0, 255, 136, 0.15)',
        borderColor: colors.primary,
    },
    masterToggleText: {
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.semibold,
        color: colors.textMuted,
    },
    masterToggleTextActive: {
        color: colors.primary,
    },
    scrollContent: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        marginTop: spacing.md,
        borderRadius: borderRadius.md,
        backgroundColor: 'rgba(255, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 68, 68, 0.2)',
        gap: spacing.sm,
    },
    statusBannerActive: {
        backgroundColor: 'rgba(0, 255, 136, 0.08)',
        borderColor: 'rgba(0, 255, 136, 0.2)',
    },
    statusIcon: {
        fontSize: 20,
    },
    statusText: {
        flex: 1,
        fontSize: typography.sizes.sm,
        color: colors.offline,
    },
    statusTextActive: {
        color: colors.primary,
    },
    sectionTitle: {
        fontSize: typography.sizes.md,
        fontWeight: typography.weights.semibold,
        color: colors.textSecondary,
        marginTop: spacing.xl,
        marginBottom: spacing.sm,
    },

    // Method Cards
    methodCard: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    methodCardActive: {
        borderColor: 'rgba(0, 255, 136, 0.3)',
        backgroundColor: 'rgba(0, 255, 136, 0.03)',
    },
    methodHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    methodIcon: {
        fontSize: 24,
    },
    methodNames: {
        flex: 1,
    },
    methodNameAr: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.bold,
        color: colors.textPrimary,
    },
    methodNameEn: {
        fontSize: typography.sizes.xs,
        color: colors.textMuted,
    },
    methodDesc: {
        fontSize: typography.sizes.xs,
        color: colors.textSecondary,
        marginTop: spacing.xs,
        lineHeight: 16,
    },
    scoreBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
        gap: 4,
    },
    scoreDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    scoreLabel: {
        fontSize: typography.sizes.xs,
        color: colors.textMuted,
        marginLeft: spacing.xs,
    },

    // Config Cards
    configCard: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    configLabel: {
        fontSize: typography.sizes.sm,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    configInput: {
        backgroundColor: colors.bgElevated,
        borderRadius: borderRadius.sm,
        padding: spacing.sm,
        color: colors.textPrimary,
        fontSize: typography.sizes.sm,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.sm,
    },
    configButton: {
        backgroundColor: colors.primaryDark,
        borderRadius: borderRadius.sm,
        paddingVertical: spacing.sm,
        alignItems: 'center',
    },
    configButtonText: {
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.semibold,
        color: colors.bgDeep,
    },

    // Discovered Peers
    peerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.xs,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.sm,
    },
    peerIcon: {
        fontSize: 20,
    },
    peerInfo: {
        flex: 1,
    },
    peerId: {
        fontSize: typography.sizes.sm,
        fontFamily: 'monospace',
        color: colors.textPrimary,
    },
    peerEndpoint: {
        fontSize: typography.sizes.xs,
        color: colors.textMuted,
    },
    connectBtn: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        backgroundColor: colors.primaryDark,
        borderRadius: borderRadius.sm,
    },
    connectBtnText: {
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.bold,
        color: colors.bgDeep,
    },

    // Activity Log
    logContainer: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.md,
        padding: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        minHeight: 100,
    },
    logEmpty: {
        fontSize: typography.sizes.sm,
        color: colors.textMuted,
        textAlign: 'center',
        padding: spacing.lg,
    },
    logEntry: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 3,
        gap: 4,
    },
    logLevel: {
        fontSize: 8,
    },
    logTime: {
        fontSize: 10,
        fontFamily: 'monospace',
        color: colors.textMuted,
        width: 55,
    },
    logIcon: {
        fontSize: 12,
        width: 18,
    },
    logTextWrap: {
        flex: 1,
    },
    logEvent: {
        fontSize: 11,
        fontWeight: typography.weights.semibold,
        color: colors.textPrimary,
    },
    logDetail: {
        fontSize: 10,
        color: colors.textMuted,
    },
});

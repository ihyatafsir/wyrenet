/**
 * مُؤَشِّر الاِتِّصَال (Mu'ashshir al-Ittisal) - Connection Status Component
 * Visual indicator for connection quality with animated states
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, connectionQuality, spacing, borderRadius } from './theme';

interface ConnectionStatusProps {
    type: 'tcp' | 'ws' | 'ble';
    connected: boolean;
    quality?: 'excellent' | 'good' | 'fair' | 'poor' | 'none';
    latency?: number; // ms
    showLabel?: boolean;
}

export function ConnectionStatus({
    type,
    connected,
    quality = 'none',
    latency,
    showLabel = true,
}: ConnectionStatusProps) {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (connected) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [connected, pulseAnim]);

    const typeIcons = {
        tcp: '🔌',
        ws: '🌐',
        ble: '📡',
    };

    const typeLabels = {
        tcp: 'TCP',
        ws: 'WS',
        ble: 'BLE',
    };

    const qualityInfo = connectionQuality[quality];
    const statusColor = connected ? qualityInfo.color : colors.offline;

    return (
        <View style={styles.container}>
            {/* Connection Type Icon */}
            <Text style={styles.icon}>{typeIcons[type]}</Text>

            {/* Animated Status Dot */}
            <Animated.View
                style={[
                    styles.dot,
                    { backgroundColor: statusColor },
                    connected && {
                        transform: [{ scale: pulseAnim }],
                    },
                ]}
            />

            {/* Signal Bars */}
            <View style={styles.signalBars}>
                {[1, 2, 3, 4].map((bar) => (
                    <View
                        key={bar}
                        style={[
                            styles.bar,
                            {
                                height: 4 + bar * 3,
                                backgroundColor:
                                    bar <= qualityInfo.bars ? statusColor : colors.bgHover,
                            },
                        ]}
                    />
                ))}
            </View>

            {/* Label */}
            {showLabel && (
                <View style={styles.labelContainer}>
                    <Text style={[styles.label, { color: statusColor }]}>
                        {typeLabels[type]}
                    </Text>
                    {latency !== undefined && connected && (
                        <Text style={styles.latency}>{latency}ms</Text>
                    )}
                </View>
            )}
        </View>
    );
}

/**
 * شَرِيط الحَالَة (Sharit al-Hala) - Status Bar
 * Combined status display for all connection types
 */
interface StatusBarProps {
    tcpConnected: boolean;
    wsConnected: boolean;
    isHosting: boolean;
    peerCount: number;
}

export function StatusBar({
    tcpConnected,
    wsConnected,
    isHosting,
    peerCount,
}: StatusBarProps) {
    return (
        <View style={styles.statusBar}>
            <ConnectionStatus
                type="tcp"
                connected={tcpConnected}
                quality={tcpConnected ? 'excellent' : 'none'}
            />
            <ConnectionStatus
                type="ws"
                connected={wsConnected}
                quality={wsConnected ? 'good' : 'none'}
            />

            {/* Hosting indicator */}
            {isHosting && (
                <View style={styles.hostingBadge}>
                    <Text style={styles.hostingText}>📡 مُسْتَضِيف</Text>
                </View>
            )}

            {/* Peer count */}
            <View style={styles.peerCount}>
                <Text style={styles.peerCountText}>👥 {peerCount}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.md,
        gap: spacing.xs,
    },
    icon: {
        fontSize: 14,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    signalBars: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 2,
        marginLeft: spacing.xs,
    },
    bar: {
        width: 4,
        borderRadius: 1,
    },
    labelContainer: {
        marginLeft: spacing.xs,
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
    },
    latency: {
        fontSize: 9,
        color: colors.textMuted,
    },
    statusBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        backgroundColor: colors.bgDark,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    hostingBadge: {
        backgroundColor: colors.primaryGlow,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    hostingText: {
        color: colors.primary,
        fontSize: 11,
        fontWeight: '600',
    },
    peerCount: {
        marginLeft: 'auto',
        backgroundColor: colors.bgElevated,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    peerCountText: {
        color: colors.textSecondary,
        fontSize: 12,
    },
});

export default ConnectionStatus;

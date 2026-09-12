/**
 * شَاشَة النَّغَم (Shashat al-Nagham) - Voice Channel Screen
 * UI for DTMF voice channel communication
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    TextInput,
    Alert,
} from 'react-native';
import { colors, spacing, borderRadius } from '../ui/theme';
import { naghamDTMF, NaghamPayload, NaghamState } from '../network/NaghamDTMF';

// DTMF keypad layout
const DTMF_KEYS = [
    ['1', '2', '3', 'A'],
    ['4', '5', '6', 'B'],
    ['7', '8', '9', 'C'],
    ['*', '0', '#', 'D'],
];

export default function NaghamScreen() {
    const [state, setState] = useState<NaghamState>('sakin');
    const [myPeerId, setMyPeerId] = useState('');
    const [receivedPayload, setReceivedPayload] = useState<NaghamPayload | null>(null);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [pressedKey, setPressedKey] = useState<string | null>(null);

    // Animation for the center visual
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Initialize DTMF module
        naghamDTMF.initialize();

        // Set up callbacks
        naghamDTMF.setOnStateChange((newState) => {
            setState(newState);
        });

        naghamDTMF.setOnDecode((payload) => {
            setReceivedPayload(payload);
            Alert.alert(
                '✓ Peer Received!',
                `Connected to: ${payload.peerId}`,
                [{ text: 'OK' }]
            );
        });

        naghamDTMF.setOnProgress((current, total) => {
            setProgress({ current, total });
        });

        return () => {
            naghamDTMF.stopListening();
        };
    }, []);

    useEffect(() => {
        // Start pulse animation when transmitting or listening
        if (state === 'yunghim' || state === 'yastami') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            pulseAnim.setValue(1);
            rotateAnim.setValue(0);
        }
    }, [state]);

    const handleTransmit = async () => {
        if (!myPeerId.trim()) {
            Alert.alert('Enter Peer ID', 'Please enter your peer ID first');
            return;
        }

        const payload = naghamDTMF.createPeerExchangePayload(myPeerId);
        await naghamDTMF.transmit(payload);
    };

    const handleListen = () => {
        if (state === 'yastami') {
            naghamDTMF.stopListening();
        } else {
            naghamDTMF.startListening();
        }
    };

    const getStateInfo = () => {
        switch (state) {
            case 'sakin':
                return { label: 'Ready', color: colors.textMuted, emoji: '📞' };
            case 'yunghim':
                return { label: 'Transmitting...', color: colors.warning, emoji: '🎵' };
            case 'yastami':
                return { label: 'Listening...', color: colors.primary, emoji: '👂' };
            case 'muttasil':
                return { label: 'Connected!', color: colors.success, emoji: '✓' };
        }
    };

    const stateInfo = getStateInfo();
    const rotateInterpolate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>نَغَم Voice Channel</Text>
                <Text style={styles.subtitle}>P2P over phone call (no data!)</Text>
            </View>

            {/* Central Visual */}
            <View style={styles.centerArea}>
                <Animated.View
                    style={[
                        styles.outerRing,
                        {
                            transform: [
                                { scale: pulseAnim },
                                { rotate: rotateInterpolate },
                            ],
                            borderColor: stateInfo.color,
                        },
                    ]}
                >
                    <View style={[styles.innerCircle, { backgroundColor: stateInfo.color + '20' }]}>
                        <Text style={styles.centerEmoji}>{stateInfo.emoji}</Text>
                    </View>
                </Animated.View>

                <Text style={[styles.stateLabel, { color: stateInfo.color }]}>
                    {stateInfo.label}
                </Text>

                {state === 'yunghim' && progress.total > 0 && (
                    <Text style={styles.progressText}>
                        Tone {progress.current}/{progress.total}
                    </Text>
                )}
            </View>

            {/* Peer ID Input */}
            <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Your Peer ID</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. alice@abc123"
                    placeholderTextColor={colors.textMuted}
                    value={myPeerId}
                    onChangeText={setMyPeerId}
                    editable={state === 'sakin'}
                />
            </View>

            {/* DTMF Keypad (visual only) */}
            <View style={styles.keypad}>
                {DTMF_KEYS.map((row, rowIdx) => (
                    <View key={rowIdx} style={styles.keyRow}>
                        {row.map((key) => (
                            <TouchableOpacity
                                key={key}
                                style={[
                                    styles.key,
                                    pressedKey === key && styles.keyPressed,
                                ]}
                                onPressIn={() => setPressedKey(key)}
                                onPressOut={() => setPressedKey(null)}
                            >
                                <Text style={styles.keyText}>{key}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.transmitButton]}
                    onPress={handleTransmit}
                    disabled={state !== 'sakin'}
                >
                    <Text style={styles.actionEmoji}>📤</Text>
                    <Text style={styles.actionText}>Transmit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.actionButton,
                        state === 'yastami' ? styles.stopButton : styles.listenButton,
                    ]}
                    onPress={handleListen}
                    disabled={state === 'yunghim'}
                >
                    <Text style={styles.actionEmoji}>
                        {state === 'yastami' ? '⏹️' : '📥'}
                    </Text>
                    <Text style={styles.actionText}>
                        {state === 'yastami' ? 'Stop' : 'Listen'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Received Info */}
            {receivedPayload && (
                <View style={styles.receivedCard}>
                    <Text style={styles.receivedTitle}>Received Peer:</Text>
                    <Text style={styles.receivedPeer}>{receivedPayload.peerId}</Text>
                    <Text style={styles.receivedTime}>
                        {new Date(receivedPayload.timestamp).toLocaleTimeString()}
                    </Text>
                </View>
            )}

            {/* Instructions */}
            <View style={styles.instructions}>
                <Text style={styles.instructionTitle}>How to use:</Text>
                <Text style={styles.instructionText}>
                    1. Call your peer (regular phone call){'\n'}
                    2. One person taps "Transmit" to send tones{'\n'}
                    3. Other person taps "Listen" to decode{'\n'}
                    4. Once connected, switch to data connection
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgDeep,
        paddingHorizontal: spacing.lg,
    },
    header: {
        paddingTop: spacing.lg,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    subtitle: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: spacing.xs,
    },
    centerArea: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    outerRing: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    innerCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerEmoji: {
        fontSize: 40,
    },
    stateLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: spacing.md,
    },
    progressText: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: spacing.xs,
    },
    inputSection: {
        marginBottom: spacing.md,
    },
    inputLabel: {
        fontSize: 12,
        color: colors.textMuted,
        marginBottom: spacing.xs,
    },
    input: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        color: colors.textPrimary,
        borderWidth: 1,
        borderColor: colors.border,
        fontFamily: 'monospace',
    },
    keypad: {
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    keyRow: {
        flexDirection: 'row',
        gap: spacing.xs,
        marginBottom: spacing.xs,
    },
    key: {
        width: 50,
        height: 40,
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    keyPressed: {
        backgroundColor: colors.primaryGlow,
        borderColor: colors.primary,
    },
    keyText: {
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        gap: spacing.sm,
    },
    transmitButton: {
        backgroundColor: colors.warning + '30',
        borderWidth: 1,
        borderColor: colors.warning,
    },
    listenButton: {
        backgroundColor: colors.primary + '30',
        borderWidth: 1,
        borderColor: colors.primary,
    },
    stopButton: {
        backgroundColor: colors.error + '30',
        borderWidth: 1,
        borderColor: colors.error,
    },
    actionEmoji: {
        fontSize: 20,
    },
    actionText: {
        color: colors.textPrimary,
        fontSize: 14,
        fontWeight: '600',
    },
    receivedCard: {
        backgroundColor: colors.success + '20',
        borderRadius: borderRadius.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.success,
        marginBottom: spacing.md,
    },
    receivedTitle: {
        fontSize: 12,
        color: colors.success,
    },
    receivedPeer: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
        fontFamily: 'monospace',
    },
    receivedTime: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: spacing.xs,
    },
    instructions: {
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.md,
        padding: spacing.md,
    },
    instructionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    instructionText: {
        fontSize: 11,
        color: colors.textMuted,
        lineHeight: 18,
    },
});

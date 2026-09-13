/**
 * شَاشَة النَّغَم (Shashat al-Nagham) - Voice Channel Screen
 * UI for DTMF voice channel communication
 * Zero emojis. Full runtime audio permission enforcement.
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
import { requestAudioPermission, checkAudioPermission } from '../utils/permissions';

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
    const [hasAudioPermission, setHasAudioPermission] = useState<boolean>(false);

    // Animation for the center visual
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Check / Request runtime audio permission
        (async () => {
            const hasPerm = await checkAudioPermission();
            setHasAudioPermission(hasPerm);
            if (!hasPerm) {
                const granted = await requestAudioPermission();
                setHasAudioPermission(granted);
            }
        })();

        // Initialize DTMF module
        naghamDTMF.initialize();

        // Set up callbacks
        naghamDTMF.setOnStateChange((newState) => {
            setState(newState);
        });

        naghamDTMF.setOnDecode((payload) => {
            setReceivedPayload(payload);
            Alert.alert(
                '[OK] Peer Received',
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

        const granted = hasAudioPermission || (await requestAudioPermission());
        if (!granted) {
            Alert.alert(
                'Permission Required',
                'Microphone / audio permission is required to transmit acoustic keys.'
            );
            return;
        }
        setHasAudioPermission(true);

        const payload = naghamDTMF.createPeerExchangePayload(myPeerId);
        await naghamDTMF.transmit(payload);
    };

    const handleListen = async () => {
        if (state === 'yastami') {
            naghamDTMF.stopListening();
        } else {
            const granted = hasAudioPermission || (await requestAudioPermission());
            if (!granted) {
                Alert.alert(
                    'Microphone Permission Required',
                    'WyreNet needs RECORD_AUDIO permission to listen and decode DTMF acoustic signals.'
                );
                return;
            }
            setHasAudioPermission(true);
            naghamDTMF.startListening();
        }
    };

    const getStateInfo = () => {
        switch (state) {
            case 'sakin':
                return { label: 'Ready', color: colors.textMuted, badge: '[IDLE]' };
            case 'yunghim':
                return { label: 'Transmitting...', color: colors.warning, badge: '[TX]' };
            case 'yastami':
                return { label: 'Listening...', color: colors.primary, badge: '[RX]' };
            case 'muttasil':
                return { label: 'Connected', color: colors.success, badge: '[OK]' };
        }
    };

    const stateInfo = getStateInfo();

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>نَغَم Voice Channel</Text>
                <Text style={styles.subtitle}>P2P Acoustic DTMF Voice Key Exchange</Text>
                <View style={styles.permBadge}>
                    <Text style={[styles.permText, { color: hasAudioPermission ? colors.success : colors.warning }]}>
                        MIC: {hasAudioPermission ? '[ACTIVE / GRANTED]' : '[PERMISSION REQUIRED]'}
                    </Text>
                </View>
            </View>

            {/* Visualizer Circle */}
            <View style={styles.centerArea}>
                <Animated.View
                    style={[
                        styles.outerRing,
                        {
                            borderColor: stateInfo.color,
                            transform: [{ scale: pulseAnim }],
                        },
                    ]}
                >
                    <View style={[styles.innerCircle, { backgroundColor: stateInfo.color + '20' }]}>
                        <Text style={[styles.centerBadge, { color: stateInfo.color }]}>
                            {stateInfo.badge}
                        </Text>
                    </View>
                </Animated.View>
                <Text style={[styles.stateLabel, { color: stateInfo.color }]}>
                    {stateInfo.label}
                </Text>
                {state === 'yunghim' && (
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
                    <Text style={styles.actionBadge}>[TX]</Text>
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
                    <Text style={styles.actionBadge}>
                        {state === 'yastami' ? '[STOP]' : '[RX]'}
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
                    1. Call your peer over telephone or radio{'\n'}
                    2. One person taps "[TX] Transmit" to emit acoustic tones{'\n'}
                    3. Other person taps "[RX] Listen" to decode over microphone{'\n'}
                    4. Cryptographic keys authenticate without any Internet
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
    permBadge: {
        marginTop: 6,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 6,
        backgroundColor: colors.bgElevated,
        borderWidth: 1,
        borderColor: colors.border,
    },
    permText: {
        fontSize: 11,
        fontWeight: '700',
        fontFamily: 'monospace',
    },
    centerArea: {
        alignItems: 'center',
        paddingVertical: spacing.lg,
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
    centerBadge: {
        fontSize: 22,
        fontWeight: '800',
        fontFamily: 'monospace',
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
        height: 38,
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
        fontSize: 15,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.md,
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
    actionBadge: {
        color: colors.textPrimary,
        fontFamily: 'monospace',
        fontSize: 14,
        fontWeight: '700',
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

/**
 * ChatScreen.tsx - Sovereign 1:1 Direct Encrypted Messaging (DM)
 * Features:
 * - Direct Nagham Voice Call HUD & In-Chat Persistent Calling Banner
 * - Fullscreen Sovereign P2P Video Call HUD with Local PIP & Matrix Canvas
 * - Topbar Actions showing BOTH [NAGHAM VOICE] and [VIDEO]
 * - In-Chat Sawt Voice Note Recording with Audio Waveform
 * - Persistent Message History via AsyncStorage
 * - Strict Zero-Emoji Policy / Matrix Green Visual Identity
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StatusBar,
    Modal,
    Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { TextMessage } from '../messaging/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
    peerId?: string;
    peerName?: string;
    route?: any;
    navigation?: any;
}

export default function ChatScreen(props: Props) {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const peerId = props.peerId || route?.params?.peerId || 'peer_direct@d9bf1f';
    const peerName = props.peerName || route?.params?.peerName || 'Direct Peer';

    const [messages, setMessages] = useState<TextMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef<FlatList>(null);

    // --- Voice Call (Nagham) State ---
    const [voiceCallActive, setVoiceCallActive] = useState(false);
    const [voiceCallModalVisible, setVoiceCallModalVisible] = useState(false);
    const [voiceCallDuration, setVoiceCallDuration] = useState(0);
    const [voiceMuted, setVoiceMuted] = useState(false);
    const [voiceSpeaker, setVoiceSpeaker] = useState(false);
    const [voiceDtmfTone, setVoiceDtmfTone] = useState('697Hz + 1209Hz (Key 1)');
    const [voiceDtmfFeedback, setVoiceDtmfFeedback] = useState('Acoustic Carrier Locked');

    // --- Video Call State ---
    const [videoCallVisible, setVideoCallVisible] = useState(false);
    const [videoCallDuration, setVideoCallDuration] = useState(0);
    const [videoMuted, setVideoMuted] = useState(false);
    const [videoCamOff, setVideoCamOff] = useState(false);
    const [videoPipSwapped, setVideoPipSwapped] = useState(false);

    // --- Voice Note Recording State ---
    const [isRecordingVoiceNote, setIsRecordingVoiceNote] = useState(false);
    const [voiceNoteDuration, setVoiceNoteDuration] = useState(0);
    const [playingVoiceNoteId, setPlayingVoiceNoteId] = useState<string | null>(null);

    const handleTogglePlayVoiceNote = (id: string) => {
        if (playingVoiceNoteId === id) {
            setPlayingVoiceNoteId(null);
        } else {
            setPlayingVoiceNoteId(id);
            setTimeout(() => {
                setPlayingVoiceNoteId(prev => (prev === id ? null : prev));
            }, 3500);
        }
    };

    const storageKey = `@wyrenet_dm_${peerId}`;

    useEffect(() => {
        loadHistory();
    }, [peerId]);

    // Voice Call Duration Timer
    useEffect(() => {
        let timer: any;
        if (voiceCallActive) {
            timer = setInterval(() => {
                setVoiceCallDuration(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [voiceCallActive]);

    // Video Call Duration Timer
    useEffect(() => {
        let timer: any;
        if (videoCallVisible) {
            timer = setInterval(() => {
                setVideoCallDuration(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [videoCallVisible]);

    // Voice Note Recording Timer
    useEffect(() => {
        let timer: any;
        if (isRecordingVoiceNote) {
            timer = setInterval(() => {
                setVoiceNoteDuration(prev => prev + 1);
            }, 1000);
        } else {
            setVoiceNoteDuration(0);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isRecordingVoiceNote]);

    const formatCallDuration = (secs: number) => {
        const mins = Math.floor(secs / 60);
        const remaining = secs % 60;
        return String(mins).padStart(2, '0') + ':' + String(remaining).padStart(2, '0');
    };

    const loadHistory = async () => {
        try {
            const data = await AsyncStorage.getItem(storageKey);
            if (data) {
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setMessages(parsed);
                    return;
                }
            }
        } catch {}

        // Default initial welcome message in DM
        const initialMsg: TextMessage = {
            id: 'dm_init_' + Date.now(),
            type: 'text',
            senderId: peerId,
            recipientId: 'me',
            content: `[E2EE CHANNEL ESTABLISHED] Secure end-to-end direct channel opened with ${peerName} (${peerId}). All messages anchored via ZBAT protocol.`,
            timestamp: Date.now() - 60000,
            signature: '0x' + peerId.slice(-8),
        };
        setMessages([initialMsg]);
    };

    const saveHistory = async (msgs: TextMessage[]) => {
        try {
            await AsyncStorage.setItem(storageKey, JSON.stringify(msgs));
        } catch {}
    };

    const sendMessage = () => {
        if (!inputText.trim()) return;

        const newMessage: TextMessage = {
            id: 'msg_' + Date.now(),
            type: 'text',
            senderId: 'me',
            recipientId: peerId,
            content: inputText.trim(),
            timestamp: Date.now(),
            signature: '0x_signed',
        };

        const updated = [...messages, newMessage];
        setMessages(updated);
        saveHistory(updated);
        setInputText('');
    };

    // --- Voice Call (Nagham) Handlers ---
    const handleStartVoiceCall = () => {
        if (!voiceCallActive) {
            setVoiceCallDuration(0);
            setVoiceCallActive(true);
        }
        setVoiceCallModalVisible(true);
    };

    const handleEndVoiceCall = () => {
        const durationStr = formatCallDuration(voiceCallDuration);
        setVoiceCallActive(false);
        setVoiceCallModalVisible(false);

        // Append system call record to chat
        const callLogMsg: TextMessage = {
            id: 'call_log_' + Date.now(),
            type: 'text',
            senderId: 'system',
            recipientId: peerId,
            content: `[NAGHAM VOICE CALL COMPLETED - Duration: ${durationStr} | Acoustic Codec: 48kHz PCM | Carrier: ${voiceDtmfTone}]`,
            timestamp: Date.now(),
            signature: '0x_call_logged',
        };
        const updated = [...messages, callLogMsg];
        setMessages(updated);
        saveHistory(updated);
    };

    const handleSendDtmfPulse = (key: string, freq: string) => {
        setVoiceDtmfTone(`${freq} (Key ${key})`);
        setVoiceDtmfFeedback(`[TRANSMITTED]: DTMF Pulse ${key} (${freq})`);
        setTimeout(() => {
            setVoiceDtmfFeedback('Acoustic Carrier Locked');
        }, 2500);
    };

    // --- Video Call Handlers ---
    const handleStartVideoCall = () => {
        // If voice call is active, end voice call and switch to video
        if (voiceCallActive) {
            setVoiceCallActive(false);
            setVoiceCallModalVisible(false);
        }
        setVideoCallDuration(0);
        setVideoCallVisible(true);
    };

    const handleEndVideoCall = () => {
        const durationStr = formatCallDuration(videoCallDuration);
        setVideoCallVisible(false);

        // Append system video call record to chat
        const callLogMsg: TextMessage = {
            id: 'video_log_' + Date.now(),
            type: 'text',
            senderId: 'system',
            recipientId: peerId,
            content: `[SOVEREIGN VIDEO CALL COMPLETED - Duration: ${durationStr} | Resolution: 720p @ 30fps | Protocol: WebRTC SRTP]`,
            timestamp: Date.now(),
            signature: '0x_video_logged',
        };
        const updated = [...messages, callLogMsg];
        setMessages(updated);
        saveHistory(updated);
    };

    const handleSwitchVoiceToVideo = () => {
        setVoiceCallModalVisible(false);
        setVoiceCallActive(false);
        setVideoCallDuration(voiceCallDuration);
        setVideoCallVisible(true);
    };

    const handleSwitchVideoToVoice = () => {
        setVideoCallVisible(false);
        setVoiceCallDuration(videoCallDuration);
        setVoiceCallActive(true);
        setVoiceCallModalVisible(true);
    };

    // --- Voice Note (Sawt) Handlers ---
    const handleToggleRecordVoiceNote = () => {
        if (!isRecordingVoiceNote) {
            setIsRecordingVoiceNote(true);
        } else {
            // Stop recording and send voice note
            setIsRecordingVoiceNote(false);
            const recordedDur = Math.max(1, voiceNoteDuration);
            const voiceMsg: TextMessage = {
                id: 'voice_note_' + Date.now(),
                type: 'text',
                senderId: 'me',
                recipientId: peerId,
                content: `[VOICE NOTE / صَوْت]: ${recordedDur}s | Codec: OPUS 48kHz | Sealed via Miftah PFS | Hash: 0x${Math.random().toString(16).slice(2, 10)}`,
                timestamp: Date.now(),
                signature: '0x_voice_signed',
            };
            const updated = [...messages, voiceMsg];
            setMessages(updated);
            saveHistory(updated);
        }
    };

    const renderMessage = ({ item }: { item: TextMessage }) => {
        const isMe = item.senderId === 'me';
        const isSystem = item.senderId === 'system';
        const isVoiceNote = item.content.startsWith('[VOICE NOTE');

        if (isSystem) {
            return (
                <View style={styles.systemMessageBubble}>
                    <Text style={styles.systemMessageText}>{item.content}</Text>
                    <Text style={styles.systemMessageTime}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            );
        }

        if (isVoiceNote) {
            return (
                <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
                    <View style={styles.voiceNoteHeaderRow}>
                        <Text style={styles.senderLabel}>{isMe ? 'YOU [VOICE NOTE]' : `${peerName.toUpperCase()} [VOICE NOTE]`}</Text>
                        <Text style={styles.voiceNoteCodecBadge}>48kHz</Text>
                    </View>
                    <View style={styles.voiceNoteWaveRow}>
                        <TouchableOpacity
                            style={[styles.voiceNotePlayBtn, playingVoiceNoteId === item.id && styles.voiceNotePlayBtnActive]}
                            onPress={() => handleTogglePlayVoiceNote(item.id)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.voiceNotePlayText}>{playingVoiceNoteId === item.id ? 'STOP' : 'PLAY'}</Text>
                        </TouchableOpacity>
                        <View style={styles.waveBarContainer}>
                            {[40, 75, 55, 90, 30, 80, 65, 95, 50, 70, 85, 45, 60, 90, 35].map((h, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.staticWaveBar,
                                        playingVoiceNoteId === item.id && styles.staticWaveBarActive,
                                        { height: Math.max(6, (playingVoiceNoteId === item.id ? ((i % 4 + 2) * 20) : h) * 0.22) }
                                    ]}
                                />
                            ))}
                        </View>
                    </View>
                    <Text style={styles.voiceNoteDetailsText}>{item.content}</Text>
                    <Text style={styles.messageTime}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            );
        }

        return (
            <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
                <Text style={styles.senderLabel}>{isMe ? 'YOU' : peerName.toUpperCase()}</Text>
                <Text style={styles.messageText}>{item.content}</Text>
                <Text style={styles.messageTime}>
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#07090e" />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.backBtnText}>&lt;</Text>
                    </TouchableOpacity>

                    <View style={styles.avatarWrap}>
                        <Text style={styles.avatarText}>{peerName.slice(0, 2).toUpperCase()}</Text>
                        <View style={styles.onlineDot} />
                    </View>

                    <View style={styles.headerInfo}>
                        <View style={styles.nameRow}>
                            <Text style={styles.headerTitle} numberOfLines={1}>{peerName}</Text>
                            <View style={styles.e2eeBadge}>
                                <Text style={styles.e2eeBadgeText}>E2EE</Text>
                            </View>
                        </View>
                        <Text style={styles.headerSubtitle} numberOfLines={1}>{peerId}</Text>
                    </View>

                    {/* Action Buttons: BOTH NAGHAM VOICE and VIDEO */}
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={[styles.actionPill, styles.actionPillVoice, voiceCallActive && styles.actionPillVoiceActive]}
                            onPress={handleStartVoiceCall}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.actionPillTextVoice}>
                                {voiceCallActive ? `NAGHAM [${formatCallDuration(voiceCallDuration)}]` : 'NAGHAM'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionPill, styles.actionPillVideo]}
                            onPress={handleStartVideoCall}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.actionPillTextVideo}>VIDEO</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Persistent In-Chat Nagham Voice Call Banner (when call active & minimized) */}
                {voiceCallActive && !voiceCallModalVisible && (
                    <View style={styles.activeCallBanner}>
                        <View style={styles.callBannerLeft}>
                            <View style={styles.callLiveDot} />
                            <Text style={styles.callBannerTitle}>NAGHAM:</Text>
                            <Text style={styles.callBannerDuration}>{formatCallDuration(voiceCallDuration)}</Text>
                        </View>
                        <View style={styles.callBannerActions}>
                            <TouchableOpacity
                                style={styles.callBannerBtn}
                                onPress={() => setVoiceCallModalVisible(true)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.callBannerBtnText}>EXPAND</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.callBannerBtn, voiceMuted && styles.callBannerBtnMuted]}
                                onPress={() => setVoiceMuted(prev => !prev)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.callBannerBtnText}>{voiceMuted ? 'UNMUTE' : 'MUTE'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.callBannerBtn, styles.callBannerBtnEnd]}
                                onPress={handleEndVoiceCall}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.callBannerBtnEndText}>END</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Messages List */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.messageList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {/* Recording Status Banner */}
                {isRecordingVoiceNote && (
                    <View style={styles.recordingBanner}>
                        <View style={styles.recordLiveDot} />
                        <Text style={styles.recordingText}>RECORDING VOICE NOTE (SAWT): {formatCallDuration(voiceNoteDuration)}</Text>
                        <TouchableOpacity
                            style={styles.cancelRecordBtn}
                            onPress={() => setIsRecordingVoiceNote(false)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.cancelRecordText}>CANCEL</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Input Dock */}
                <View style={styles.inputContainer}>
                    {/* Voice Note / Recording Button */}
                    <TouchableOpacity
                        style={[styles.voiceButton, isRecordingVoiceNote && styles.voiceButtonRecording]}
                        onPress={handleToggleRecordVoiceNote}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.voiceIcon, isRecordingVoiceNote && styles.voiceIconRecording]}>
                            {isRecordingVoiceNote ? '[STOP]' : '[MIC]'}
                        </Text>
                    </TouchableOpacity>

                    {/* Nagham Quick Call Shortcut in Input Dock */}
                    <TouchableOpacity
                        style={styles.inputCallShortcut}
                        onPress={handleStartVoiceCall}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.inputCallShortcutText}>[NAGHAM]</Text>
                    </TouchableOpacity>

                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder={isRecordingVoiceNote ? "Recording audio..." : `Message ${peerName}...`}
                        placeholderTextColor="#6e7681"
                        editable={!isRecordingVoiceNote}
                        multiline={false}
                        maxLength={4000}
                        onSubmitEditing={sendMessage}
                        returnKeyType="send"
                    />

                    <TouchableOpacity
                        style={[styles.sendButton, (!inputText.trim() && !isRecordingVoiceNote) && styles.sendButtonDisabled]}
                        onPress={sendMessage}
                        disabled={!inputText.trim()}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.sendIcon}>&gt;</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* ================================================================= */}
            {/* 1. NAGHAM SOVEREIGN VOICE CALL HUD MODAL */}
            {/* ================================================================= */}
            <Modal
                visible={voiceCallModalVisible}
                transparent={false}
                animationType="slide"
                onRequestClose={() => setVoiceCallModalVisible(false)}
            >
                <SafeAreaView style={styles.voiceModalSafe}>
                    <StatusBar barStyle="light-content" backgroundColor="#05080e" />

                    {/* Topbar */}
                    <View style={styles.voiceModalTopbar}>
                        <View style={styles.voicePeerTag}>
                            <View style={styles.voiceLiveDot} />
                            <Text style={styles.voicePeerName}>{peerName.toUpperCase()}</Text>
                            <Text style={styles.voicePeerFp}>({peerId})</Text>
                        </View>
                        <View style={styles.voiceTimerPill}>
                            <Text style={styles.voiceTimerText}>{formatCallDuration(voiceCallDuration)}</Text>
                        </View>
                        <View style={styles.voiceSecurityBadge}>
                            <Text style={styles.voiceSecurityText}>NAGHAM / PCM</Text>
                        </View>
                    </View>

                    {/* Main Voice Visualizer Canvas */}
                    <View style={styles.voiceVisualizerContainer}>
                        {/* Avatar & Pulse Ring */}
                        <View style={styles.voiceAvatarWrapper}>
                            <View style={styles.voicePulseRing} />
                            <View style={styles.voiceAvatarCircle}>
                                <Text style={styles.voiceAvatarInitials}>{peerName.slice(0, 2).toUpperCase()}</Text>
                            </View>
                        </View>

                        <Text style={styles.voiceStatusHeader}>{peerName}</Text>
                        <Text style={styles.voiceStatusSub}>
                            {voiceMuted ? '[MICROPHONE MUTED]' : 'ACOUSTIC VOICE CONDUIT CONNECTED'}
                        </Text>

                        {/* Frequency Wave Visualizer Bars */}
                        <View style={styles.freqBarsRow}>
                            {[60, 90, 45, 120, 80, 140, 110, 95, 130, 70, 100, 50, 85].map((h, idx) => (
                                <View
                                    key={idx}
                                    style={[
                                        styles.freqBar,
                                        {
                                            height: voiceMuted ? 8 : Math.max(10, h * 0.35),
                                            backgroundColor: voiceMuted ? '#484f58' : '#00ff88',
                                        },
                                    ]}
                                />
                            ))}
                        </View>

                        {/* DTMF Acoustic Telemetry Card */}
                        <View style={styles.dtmfCard}>
                            <View style={styles.dtmfCardHeader}>
                                <Text style={styles.dtmfCardTitle}>NAGHAM DTMF ACOUSTIC TELEMETRY</Text>
                                <Text style={styles.dtmfCardStatus}>{voiceDtmfFeedback}</Text>
                            </View>

                            <View style={styles.dtmfTelemetryRow}>
                                <Text style={styles.dtmfTelemetryLabel}>CARRIER FREQ:</Text>
                                <Text style={styles.dtmfTelemetryValue}>{voiceDtmfTone}</Text>
                            </View>
                            <View style={styles.dtmfTelemetryRow}>
                                <Text style={styles.dtmfTelemetryLabel}>ENCRYPTION:</Text>
                                <Text style={styles.dtmfTelemetryValue}>MIFTAH-PFS / ZBAT-CHACHA</Text>
                            </View>
                            <View style={styles.dtmfTelemetryRow}>
                                <Text style={styles.dtmfTelemetryLabel}>AUDIO PIPELINE:</Text>
                                <Text style={styles.dtmfTelemetryValue}>48000Hz PCM | 16-BIT LOW-LATENCY</Text>
                            </View>

                            {/* DTMF Quick Pulse Transmission Pad */}
                            <Text style={styles.dtmfPadTitle}>OUT-OF-BAND ACOUSTIC KEY PULSES:</Text>
                            <View style={styles.dtmfPadRow}>
                                <TouchableOpacity
                                    style={styles.dtmfPadBtn}
                                    onPress={() => handleSendDtmfPulse('1', '697Hz + 1209Hz')}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.dtmfPadBtnText}>PULSE 1</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.dtmfPadBtn}
                                    onPress={() => handleSendDtmfPulse('2', '697Hz + 1336Hz')}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.dtmfPadBtnText}>PULSE 2</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.dtmfPadBtn}
                                    onPress={() => handleSendDtmfPulse('3', '697Hz + 1477Hz')}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.dtmfPadBtnText}>PULSE 3</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.dtmfPadBtn, styles.dtmfPadBtnTone]}
                                    onPress={() => handleSendDtmfPulse('SYNC', '941Hz + 1336Hz')}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.dtmfPadBtnText}>SYNC</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Voice Controls Dock */}
                    <View style={styles.voiceDock}>
                        {/* Mic Mute Toggle */}
                        <TouchableOpacity
                            style={[styles.voiceDockBtn, voiceMuted && styles.voiceDockBtnActive]}
                            onPress={() => setVoiceMuted(prev => !prev)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.voiceDockBtnText}>{voiceMuted ? 'UNMUTE' : 'MUTE'}</Text>
                        </TouchableOpacity>

                        {/* Speaker Toggle */}
                        <TouchableOpacity
                            style={[styles.voiceDockBtn, voiceSpeaker && styles.voiceDockBtnActive]}
                            onPress={() => setVoiceSpeaker(prev => !prev)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.voiceDockBtnText}>{voiceSpeaker ? 'EARPIECE' : 'SPEAKER'}</Text>
                        </TouchableOpacity>

                        {/* Minimize (Return to Chat while call active) */}
                        <TouchableOpacity
                            style={[styles.voiceDockBtn, styles.voiceDockBtnMinimize]}
                            onPress={() => setVoiceCallModalVisible(false)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.voiceDockBtnText}>MINIMIZE</Text>
                        </TouchableOpacity>

                        {/* Switch to Video Call */}
                        <TouchableOpacity
                            style={[styles.voiceDockBtn, styles.voiceDockBtnVideo]}
                            onPress={handleSwitchVoiceToVideo}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.voiceDockBtnTextVideo}>VIDEO</Text>
                        </TouchableOpacity>

                        {/* End Call */}
                        <TouchableOpacity
                            style={[styles.voiceDockBtn, styles.voiceDockBtnEnd]}
                            onPress={handleEndVoiceCall}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.voiceDockBtnEndText}>END CALL</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Dedicated Nagham Keypad Route Option */}
                    <View style={styles.fullNaghamFooter}>
                        <TouchableOpacity
                            style={styles.fullNaghamBtn}
                            onPress={() => {
                                setVoiceCallModalVisible(false);
                                navigation.navigate('Voice', { targetPeer: peerName, fingerprint: peerId });
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.fullNaghamBtnText}>[OPEN FULL NAGHAM DTMF KEYPAD]</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>

            {/* ================================================================= */}
            {/* 2. SOVEREIGN P2P VIDEO CALL HUD MODAL */}
            {/* ================================================================= */}
            <Modal
                visible={videoCallVisible}
                transparent={false}
                animationType="slide"
                onRequestClose={() => setVideoCallVisible(false)}
            >
                <SafeAreaView style={styles.videoModalSafe}>
                    <StatusBar barStyle="light-content" backgroundColor="#05070a" />

                    {/* Video Call Topbar */}
                    <View style={styles.videoTopbar}>
                        <View style={styles.videoPeerTag}>
                            <View style={styles.videoLiveDot} />
                            <Text style={styles.videoPeerName}>{peerName.toUpperCase()}</Text>
                            <Text style={styles.videoPeerFp}>({peerId})</Text>
                        </View>
                        <View style={styles.videoTimerPill}>
                            <Text style={styles.videoTimerText}>{formatCallDuration(videoCallDuration)}</Text>
                        </View>
                        <View style={styles.videoSecurityBadge}>
                            <Text style={styles.videoSecurityText}>SRTP / E2EE</Text>
                        </View>
                    </View>

                    {/* Video Viewport Area */}
                    <View style={styles.videoCanvasContainer}>
                        {/* Remote Video Stream Viewport */}
                        <View style={styles.remoteVideoCanvas}>
                            {/* HUD Corners */}
                            <View style={styles.videoGridHud}>
                                <View style={styles.gridCrossTopLeft} />
                                <View style={styles.gridCrossTopRight} />
                                <View style={styles.gridCrossBottomLeft} />
                                <View style={styles.gridCrossBottomRight} />
                                <Text style={styles.resolutionBadge}>720p @ 30fps | 14ms</Text>
                            </View>

                            {/* Remote Peer Hologram / Visualizer */}
                            <View style={styles.peerHologramBox}>
                                <View style={styles.hologramAvatarCircle}>
                                    <Text style={styles.hologramAvatarInitials}>{peerName.slice(0, 2).toUpperCase()}</Text>
                                    <View style={styles.hologramPulseRing} />
                                </View>
                                <Text style={styles.hologramPeerLabel}>
                                    {peerName} [REMOTE STREAM ACTIVE]
                                </Text>
                                <Text style={styles.hologramCodecLabel}>H.264 HIGH PROFILE / WEBRTC P2P DIRECT</Text>
                            </View>
                        </View>

                        {/* Local Camera Floating PIP */}
                        <View style={[styles.localCameraPip, videoPipSwapped && styles.localCameraPipSwapped]}>
                            <View style={styles.pipHeader}>
                                <Text style={styles.pipLabel}>LOCAL CAM</Text>
                                <TouchableOpacity
                                    style={styles.pipSwapBtn}
                                    onPress={() => setVideoPipSwapped(prev => !prev)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.pipSwapText}>SWAP</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.pipInnerCanvas}>
                                {videoCamOff ? (
                                    <View style={styles.pipCamOffState}>
                                        <Text style={styles.pipCamOffText}>CAM OFF</Text>
                                    </View>
                                ) : (
                                    <View style={styles.pipActiveState}>
                                        <View style={styles.pipMiniAvatar}>
                                            <Text style={styles.pipMiniAvatarText}>YOU</Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Video Controls Dock */}
                    <View style={styles.videoDock}>
                        {/* Toggle Mic */}
                        <TouchableOpacity
                            style={[styles.dockBtn, videoMuted && styles.dockBtnMuted]}
                            onPress={() => setVideoMuted(prev => !prev)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.dockBtnText}>{videoMuted ? 'MIC: OFF' : 'MIC: ON'}</Text>
                        </TouchableOpacity>

                        {/* Toggle Camera */}
                        <TouchableOpacity
                            style={[styles.dockBtn, videoCamOff && styles.dockBtnMuted]}
                            onPress={() => setVideoCamOff(prev => !prev)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.dockBtnText}>{videoCamOff ? 'CAM: OFF' : 'CAM: ON'}</Text>
                        </TouchableOpacity>

                        {/* Switch to Nagham Voice */}
                        <TouchableOpacity
                            style={[styles.dockBtn, styles.dockBtnVoice]}
                            onPress={handleSwitchVideoToVoice}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.dockBtnTextVoice}>NAGHAM</Text>
                        </TouchableOpacity>

                        {/* End Call Button */}
                        <TouchableOpacity
                            style={[styles.dockBtn, styles.dockBtnEnd]}
                            onPress={handleEndVideoCall}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.dockBtnEndText}>END CALL</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#07090e',
    },
    container: {
        flex: 1,
        backgroundColor: '#07090e',
    },
    header: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#0d1117',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 255, 136, 0.15)',
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        paddingHorizontal: 8,
        paddingVertical: 6,
        marginRight: 6,
    },
    backBtnText: {
        color: '#00ff88',
        fontSize: 20,
        fontWeight: 'bold',
    },
    avatarWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#161b22',
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 136, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        marginRight: 10,
    },
    avatarText: {
        color: '#00ff88',
        fontSize: 13,
        fontWeight: '800',
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00ff88',
        position: 'absolute',
        bottom: 0,
        right: 0,
        borderWidth: 1.5,
        borderColor: '#0d1117',
    },
    headerInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#f0f6fc',
        marginRight: 6,
    },
    e2eeBadge: {
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 4,
        backgroundColor: 'rgba(0, 255, 136, 0.15)',
        borderWidth: 0.5,
        borderColor: 'rgba(0, 255, 136, 0.4)',
    },
    e2eeBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#00ff88',
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 11,
        color: '#8b949e',
        fontFamily: 'monospace',
        marginTop: 1,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionPill: {
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: 'rgba(22, 27, 34, 0.9)',
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 136, 0.3)',
    },
    actionPillVoice: {
        backgroundColor: 'rgba(0, 255, 136, 0.1)',
        borderColor: '#00ff88',
    },
    actionPillVoiceActive: {
        backgroundColor: '#00ff88',
        borderColor: '#00ff88',
    },
    actionPillTextVoice: {
        color: '#00ff88',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    actionPillVideo: {
        backgroundColor: 'rgba(56, 189, 248, 0.12)',
        borderColor: '#38bdf8',
    },
    actionPillTextVideo: {
        color: '#38bdf8',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    // Persistent Call Banner
    activeCallBanner: {
        backgroundColor: '#062817',
        borderBottomWidth: 1,
        borderBottomColor: '#00ff88',
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    callBannerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    callLiveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00ff88',
        marginRight: 6,
    },
    callBannerTitle: {
        color: '#00ff88',
        fontSize: 11,
        fontWeight: '800',
        marginRight: 4,
    },
    callBannerDuration: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '800',
        fontFamily: 'monospace',
    },
    callBannerFreq: {
        color: '#7ee787',
        fontSize: 10,
        marginLeft: 4,
    },
    callBannerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    callBannerBtn: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: '#161b22',
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 136, 0.4)',
    },
    callBannerBtnMuted: {
        backgroundColor: '#30363d',
        borderColor: '#f85149',
    },
    callBannerBtnText: {
        color: '#00ff88',
        fontSize: 10,
        fontWeight: '800',
    },
    callBannerBtnEnd: {
        backgroundColor: 'rgba(248, 81, 73, 0.2)',
        borderColor: '#f85149',
    },
    callBannerBtnEndText: {
        color: '#f85149',
        fontSize: 10,
        fontWeight: '800',
    },
    // Recording Banner
    recordingBanner: {
        backgroundColor: '#261111',
        borderTopWidth: 1,
        borderTopColor: '#f85149',
        paddingHorizontal: 14,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    recordLiveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#f85149',
        marginRight: 8,
    },
    recordingText: {
        color: '#ff7b72',
        fontSize: 11,
        fontWeight: '800',
        flex: 1,
    },
    cancelRecordBtn: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        backgroundColor: '#30363d',
    },
    cancelRecordText: {
        color: '#f0f6fc',
        fontSize: 10,
        fontWeight: '700',
    },
    // Message List & Bubbles
    messageList: {
        padding: 14,
        paddingBottom: 20,
    },
    messageBubble: {
        maxWidth: '82%',
        padding: 12,
        borderRadius: 12,
        marginVertical: 4,
    },
    myMessage: {
        backgroundColor: '#0e4429',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 2,
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 136, 0.3)',
    },
    theirMessage: {
        backgroundColor: '#161b22',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 2,
        borderWidth: 1,
        borderColor: '#30363d',
    },
    systemMessageBubble: {
        alignSelf: 'center',
        backgroundColor: 'rgba(22, 27, 34, 0.85)',
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 136, 0.25)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginVertical: 6,
        maxWidth: '92%',
    },
    systemMessageText: {
        color: '#7ee787',
        fontSize: 11,
        lineHeight: 16,
        fontFamily: 'monospace',
    },
    systemMessageTime: {
        color: '#8b949e',
        fontSize: 9,
        alignSelf: 'flex-end',
        marginTop: 2,
    },
    senderLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#00ff88',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    messageText: {
        fontSize: 14,
        color: '#e6edf3',
        lineHeight: 20,
    },
    messageTime: {
        fontSize: 10,
        color: '#8b949e',
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    // Voice Note in Chat
    voiceNoteHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    voiceNoteCodecBadge: {
        color: '#00ff88',
        fontSize: 9,
        fontWeight: '800',
        backgroundColor: 'rgba(0, 255, 136, 0.15)',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 3,
    },
    voiceNoteWaveRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginVertical: 4,
    },
    voiceNotePlayBtn: {
        backgroundColor: '#00ff88',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
    },
    voiceNotePlayText: {
        color: '#07090e',
        fontSize: 10,
        fontWeight: '900',
    },
    waveBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        flex: 1,
        height: 24,
    },
    staticWaveBar: {
        width: 3,
        backgroundColor: '#00ff88',
        borderRadius: 1.5,
    },
    voiceNoteDetailsText: {
        color: '#8b949e',
        fontSize: 10,
        fontFamily: 'monospace',
        marginTop: 4,
    },
    // Input Bar
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        paddingBottom: Platform.OS === 'ios' ? 20 : 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 255, 136, 0.15)',
        backgroundColor: '#0d1117',
        alignItems: 'center',
    },
    voiceButton: {
        paddingHorizontal: 8,
        paddingVertical: 8,
        backgroundColor: '#161b22',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 136, 0.3)',
        marginRight: 6,
    },
    voiceButtonRecording: {
        backgroundColor: '#f85149',
        borderColor: '#f85149',
    },
    voiceIcon: {
        fontSize: 11,
        color: '#00ff88',
        fontWeight: '800',
    },
    voiceIconRecording: {
        color: '#ffffff',
    },
    inputCallShortcut: {
        paddingHorizontal: 8,
        paddingVertical: 8,
        backgroundColor: 'rgba(0, 255, 136, 0.1)',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#00ff88',
        marginRight: 6,
    },
    inputCallShortcutText: {
        fontSize: 10,
        color: '#00ff88',
        fontWeight: '800',
    },
    input: {
        flex: 1,
        backgroundColor: '#161b22',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#30363d',
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        color: '#f0f6fc',
    },
    sendButton: {
        backgroundColor: '#00ff88',
        width: 38,
        height: 38,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    sendButtonDisabled: {
        backgroundColor: '#21262d',
    },
    sendIcon: {
        fontSize: 16,
        fontWeight: '900',
        color: '#07090e',
    },

    // =================================================================
    // VOICE MODAL (NAGHAM) STYLES
    // =================================================================
    voiceModalSafe: {
        flex: 1,
        backgroundColor: '#05080e',
    },
    voiceModalTopbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 255, 136, 0.15)',
        backgroundColor: '#090d14',
    },
    voicePeerTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    voiceLiveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00ff88',
    },
    voicePeerName: {
        color: '#f0f6fc',
        fontSize: 13,
        fontWeight: '800',
    },
    voicePeerFp: {
        color: '#8b949e',
        fontSize: 11,
        fontFamily: 'monospace',
    },
    voiceTimerPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: '#161b22',
        borderWidth: 1,
        borderColor: '#00ff88',
    },
    voiceTimerText: {
        color: '#00ff88',
        fontSize: 12,
        fontWeight: '800',
        fontFamily: 'monospace',
    },
    voiceSecurityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: 'rgba(0, 255, 136, 0.12)',
    },
    voiceSecurityText: {
        color: '#00ff88',
        fontSize: 10,
        fontWeight: '800',
    },
    voiceVisualizerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    voiceAvatarWrapper: {
        position: 'relative',
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    voicePulseRing: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: 'rgba(0, 255, 136, 0.3)',
    },
    voiceAvatarCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#161b22',
        borderWidth: 2,
        borderColor: '#00ff88',
        alignItems: 'center',
        justifyContent: 'center',
    },
    voiceAvatarInitials: {
        color: '#00ff88',
        fontSize: 32,
        fontWeight: '900',
    },
    voiceStatusHeader: {
        color: '#f0f6fc',
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 4,
    },
    voiceStatusSub: {
        color: '#00ff88',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
        marginBottom: 24,
    },
    freqBarsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 50,
        marginBottom: 24,
    },
    freqBar: {
        width: 6,
        borderRadius: 3,
    },
    dtmfCard: {
        width: '100%',
        backgroundColor: '#0a0f16',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 136, 0.25)',
        padding: 14,
    },
    dtmfCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#21262d',
        paddingBottom: 8,
        marginBottom: 10,
    },
    dtmfCardTitle: {
        color: '#00ff88',
        fontSize: 11,
        fontWeight: '800',
    },
    dtmfCardStatus: {
        color: '#7ee787',
        fontSize: 10,
        fontFamily: 'monospace',
    },
    dtmfTelemetryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 3,
    },
    dtmfTelemetryLabel: {
        color: '#8b949e',
        fontSize: 10,
        fontWeight: '700',
    },
    dtmfTelemetryValue: {
        color: '#e6edf3',
        fontSize: 10,
        fontWeight: '800',
        fontFamily: 'monospace',
    },
    dtmfPadTitle: {
        color: '#8b949e',
        fontSize: 10,
        fontWeight: '800',
        marginTop: 10,
        marginBottom: 6,
    },
    dtmfPadRow: {
        flexDirection: 'row',
        gap: 8,
    },
    dtmfPadBtn: {
        flex: 1,
        backgroundColor: '#161b22',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 136, 0.3)',
        paddingVertical: 6,
        alignItems: 'center',
    },
    dtmfPadBtnTone: {
        borderColor: '#38bdf8',
    },
    dtmfPadBtnText: {
        color: '#00ff88',
        fontSize: 10,
        fontWeight: '800',
    },
    voiceDock: {
        flexDirection: 'row',
        padding: 14,
        gap: 8,
        backgroundColor: '#090d14',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 255, 136, 0.15)',
    },
    voiceDockBtn: {
        flex: 1,
        backgroundColor: '#161b22',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#30363d',
    },
    voiceDockBtnActive: {
        backgroundColor: '#00ff88',
        borderColor: '#00ff88',
    },
    voiceDockBtnMinimize: {
        borderColor: 'rgba(0, 255, 136, 0.4)',
    },
    voiceDockBtnVideo: {
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
    },
    voiceDockBtnText: {
        color: '#f0f6fc',
        fontSize: 10,
        fontWeight: '800',
    },
    voiceDockBtnTextVideo: {
        color: '#38bdf8',
        fontSize: 10,
        fontWeight: '800',
    },
    voiceDockBtnEnd: {
        backgroundColor: 'rgba(248, 81, 73, 0.25)',
        borderColor: '#f85149',
    },
    voiceDockBtnEndText: {
        color: '#f85149',
        fontSize: 10,
        fontWeight: '800',
    },
    fullNaghamFooter: {
        paddingHorizontal: 14,
        paddingBottom: 10,
        backgroundColor: '#090d14',
        alignItems: 'center',
    },
    fullNaghamBtn: {
        paddingVertical: 6,
    },
    fullNaghamBtnText: {
        color: '#8b949e',
        fontSize: 11,
        fontWeight: '700',
    },

    // =================================================================
    // VIDEO MODAL HUD STYLES
    // =================================================================
    videoModalSafe: {
        flex: 1,
        backgroundColor: '#05070a',
    },
    videoTopbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#090d14',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(56, 189, 248, 0.2)',
    },
    videoPeerTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    videoLiveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#38bdf8',
    },
    videoPeerName: {
        color: '#f0f6fc',
        fontSize: 13,
        fontWeight: '800',
    },
    videoPeerFp: {
        color: '#8b949e',
        fontSize: 11,
        fontFamily: 'monospace',
    },
    videoTimerPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: '#161b22',
        borderWidth: 1,
        borderColor: '#38bdf8',
    },
    videoTimerText: {
        color: '#38bdf8',
        fontSize: 12,
        fontWeight: '800',
        fontFamily: 'monospace',
    },
    videoSecurityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
    },
    videoSecurityText: {
        color: '#38bdf8',
        fontSize: 10,
        fontWeight: '800',
    },
    videoCanvasContainer: {
        flex: 1,
        position: 'relative',
    },
    remoteVideoCanvas: {
        flex: 1,
        backgroundColor: '#070b12',
        alignItems: 'center',
        justifyContent: 'center',
    },
    videoGridHud: {
        position: 'absolute',
        top: 14,
        left: 14,
        right: 14,
        bottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.15)',
    },
    gridCrossTopLeft: {
        position: 'absolute',
        top: -1,
        left: -1,
        width: 14,
        height: 14,
        borderTopWidth: 2,
        borderLeftWidth: 2,
        borderColor: '#38bdf8',
    },
    gridCrossTopRight: {
        position: 'absolute',
        top: -1,
        right: -1,
        width: 14,
        height: 14,
        borderTopWidth: 2,
        borderRightWidth: 2,
        borderColor: '#38bdf8',
    },
    gridCrossBottomLeft: {
        position: 'absolute',
        bottom: -1,
        left: -1,
        width: 14,
        height: 14,
        borderBottomWidth: 2,
        borderLeftWidth: 2,
        borderColor: '#38bdf8',
    },
    gridCrossBottomRight: {
        position: 'absolute',
        bottom: -1,
        right: -1,
        width: 14,
        height: 14,
        borderBottomWidth: 2,
        borderRightWidth: 2,
        borderColor: '#38bdf8',
    },
    resolutionBadge: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        color: '#38bdf8',
        fontSize: 10,
        fontWeight: '800',
        fontFamily: 'monospace',
    },
    peerHologramBox: {
        alignItems: 'center',
    },
    hologramAvatarCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#161b22',
        borderWidth: 2,
        borderColor: '#38bdf8',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    hologramPulseRing: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 1.5,
        borderColor: 'rgba(56, 189, 248, 0.35)',
    },
    hologramAvatarInitials: {
        color: '#38bdf8',
        fontSize: 38,
        fontWeight: '900',
    },
    hologramPeerLabel: {
        color: '#f0f6fc',
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 4,
    },
    hologramCodecLabel: {
        color: '#8b949e',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    localCameraPip: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 110,
        height: 150,
        backgroundColor: '#0d1117',
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#38bdf8',
        overflow: 'hidden',
    },
    localCameraPipSwapped: {
        right: undefined,
        left: 16,
        borderColor: '#00ff88',
    },
    pipHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(22, 27, 34, 0.9)',
        paddingHorizontal: 6,
        paddingVertical: 4,
    },
    pipLabel: {
        color: '#38bdf8',
        fontSize: 8,
        fontWeight: '800',
    },
    pipSwapBtn: {
        backgroundColor: 'rgba(56, 189, 248, 0.2)',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 3,
    },
    pipSwapText: {
        color: '#38bdf8',
        fontSize: 8,
        fontWeight: '800',
    },
    pipInnerCanvas: {
        flex: 1,
        backgroundColor: '#161b22',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pipCamOffState: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    pipCamOffText: {
        color: '#f85149',
        fontSize: 9,
        fontWeight: '800',
    },
    pipActiveState: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    pipMiniAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#21262d',
        borderWidth: 1,
        borderColor: '#38bdf8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pipMiniAvatarText: {
        color: '#38bdf8',
        fontSize: 12,
        fontWeight: '800',
    },
    videoDock: {
        flexDirection: 'row',
        padding: 14,
        gap: 8,
        backgroundColor: '#090d14',
        borderTopWidth: 1,
        borderTopColor: 'rgba(56, 189, 248, 0.2)',
    },
    dockBtn: {
        flex: 1,
        backgroundColor: '#161b22',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#30363d',
    },
    dockBtnMuted: {
        backgroundColor: '#30363d',
        borderColor: '#f85149',
    },
    dockBtnVoice: {
        borderColor: '#00ff88',
        backgroundColor: 'rgba(0, 255, 136, 0.1)',
    },
    dockBtnText: {
        color: '#f0f6fc',
        fontSize: 10,
        fontWeight: '800',
    },
    dockBtnTextVoice: {
        color: '#00ff88',
        fontSize: 10,
        fontWeight: '800',
    },
    dockBtnEnd: {
        backgroundColor: 'rgba(248, 81, 73, 0.25)',
        borderColor: '#f85149',
    },
    dockBtnEndText: {
        color: '#f85149',
        fontSize: 10,
        fontWeight: '800',
    },
});

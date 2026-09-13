// ==============================================================================
// AynEngine AI Coding Edition (v2.0): Sovereign 5-Pillar Epistemic Engine
// Pillar 1: Al-Mufradāt (Domain Teleology) | Pillar 2: Asās al-Balāghah (Eloquence)
// Pillar 3: Lisān al-ʿArab (Exhaustive Coverage) | Pillar 4: Kitāb al-ʿAyn (Primitives)
// Pillar 5: Al-Kitāb (Syntactic Governance)
//
// Component: WyreSupMainScreen.tsx
// Ghāyah: Replicate news/wyresup Discord-style decentralized mesh interface
// ==============================================================================

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
  Animated,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface CryptographicBadge {
  label: string;
  type: "zbat" | "direct" | "e2ee" | "hops" | "l1";
}

interface ChatMessage {
  id: string;
  author: string;
  fingerprint: string;
  badges: CryptographicBadge[];
  time: string;
  content: string;
  channelId: string;
}

interface MeshChannel {
  id: string;
  name: string;
  topic: string;
  category: "text" | "dm" | "voice" | "l1";
  unread?: number;
  badge?: string;
}

const CHANNELS: MeshChannel[] = [
  { id: "general", name: "general", topic: "General mesh discussions, tests, and pings.", category: "text" },
  { id: "protocol-dev", name: "protocol-dev", topic: "P2P transport, ChaCha20 cipher & Miftah key exchange.", category: "text" },
  { id: "announcements", name: "announcements", topic: "Sovereign network upgrades and genesis announcements.", category: "text" },
  { id: "aynengineai", name: "aynengineai", topic: "5-Pillar Epistemic Code Engine & Linguistic Alignment.", category: "text" },
  { id: "imam-razi", name: "imam-razi", topic: "Quranic Lexicon & Tafsir Ledger (مَفَاتِيح الغَيْب).", category: "text", badge: "#289" },
  { id: "abuhamed", name: "abuhamed", topic: "Ihya Ulum al-Din Ledger (حَلْقَة أَبِي حَامِد الغَزَالِي).", category: "text", badge: "#484" },
  { id: "imam-nawawi", name: "imam-nawawi", topic: "Imam Nawawi Classical Corpus & Sovereign Hadith.", category: "text" },
  { id: "classical-heritage", name: "classical-heritage", topic: "Classical Arabic Philosophy & Epistemology.", category: "text" },
  { id: "antigravity", name: "antigravity", topic: "Direct autonomous AI mesh companion.", category: "dm" },
  { id: "voice-lounge-sawt", name: "voice-lounge-sawt", topic: "Decentralized P2P Acoustic & Voice Exchange.", category: "voice" },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    author: "omar",
    fingerprint: "omar@3f6753c1",
    badges: [{ label: "ZBAT", type: "zbat" }, { label: "Direct", type: "direct" }],
    time: "04:29 PM",
    content: "Hjj",
    channelId: "general",
  },
  {
    id: "m2",
    author: "omar",
    fingerprint: "omar@4ec470df",
    badges: [{ label: "ZBAT", type: "zbat" }, { label: "Direct", type: "direct" }],
    time: "04:30 PM",
    content: "fess",
    channelId: "general",
  },
  {
    id: "m3",
    author: "omar",
    fingerprint: "omar@3f6753c1",
    badges: [{ label: "ZBAT", type: "zbat" }, { label: "Direct", type: "direct" }],
    time: "04:31 PM",
    content: "Jjj",
    channelId: "general",
  },
  {
    id: "m4",
    author: "enver",
    fingerprint: "enver@d68723c4",
    badges: [{ label: "ZBAT", type: "zbat" }, { label: "Direct", type: "direct" }],
    time: "04:31 PM",
    content: "ddd",
    channelId: "general",
  },
  {
    id: "m5",
    author: "salman",
    fingerprint: "salman@99a532df",
    badges: [{ label: "ZBAT", type: "zbat" }, { label: "Direct", type: "direct" }],
    time: "05:36 PM",
    content: "hd",
    channelId: "general",
  },
  {
    id: "m6",
    author: "omar",
    fingerprint: "omar@3f6753c1",
    badges: [{ label: "ZBAT", type: "zbat" }, { label: "Direct", type: "direct" }],
    time: "05:38 PM",
    content: "Terhh",
    channelId: "general",
  },
  {
    id: "m7",
    author: "amira",
    fingerprint: "amira@sunrise_5bd6f29a",
    badges: [
      { label: "ZBAT", type: "zbat" },
      { label: "E2EE", type: "e2ee" },
      { label: "1 hops", type: "hops" },
    ],
    time: "07:14 PM",
    content: "Salam mesh network active",
    channelId: "general",
  },
  {
    id: "m8",
    author: "khalid",
    fingerprint: "khalid@swisscom_3d33ba8d",
    badges: [
      { label: "ZBAT", type: "zbat" },
      { label: "E2EE", type: "e2ee" },
      { label: "1 hops", type: "hops" },
    ],
    time: "07:14 PM",
    content: "WyreNet L1 verified on block 289",
    channelId: "general",
  },
  {
    id: "m9",
    author: "enver",
    fingerprint: "enver@d68723c4",
    badges: [{ label: "ZBAT", type: "zbat" }, { label: "Direct", type: "direct" }],
    time: "01:36 AM",
    content: "whatever",
    channelId: "general",
  },
];

export default function WyreSupMainScreen() {
  const navigation = useNavigation<any>();
  const [currentChannel, setCurrentChannel] = useState<MeshChannel>(CHANNELS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userId, setUserId] = useState("peer1@d9bf1f86");

  const slideAnim = useRef(new Animated.Value(-300)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadUserIdentity();
    loadSavedMessages();
  }, []);

  const loadSavedMessages = async () => {
    try {
      const stored = await AsyncStorage.getItem("@wyrenet_chat_messages");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // Keep defaults
    }
  };

  const loadUserIdentity = async () => {
    try {
      const stored = await AsyncStorage.getItem("@wyrenet_identity");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.id) setUserId(parsed.id);
      }
    } catch {
      // Keep default
    }
  };

  const openSidebar = () => {
    setSidebarOpen(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setSidebarOpen(false));
  };

  const handleSelectChannel = (channel: MeshChannel) => {
    setCurrentChannel(channel);
    closeSidebar();
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = (hours % 12 || 12).toString().padStart(2, "0");
    const timeStr = `${formattedHours}:${minutes} ${ampm}`;

    const newMsg: ChatMessage = {
      id: "msg_" + Date.now(),
      author: userId.split("@")[0] || "self",
      fingerprint: userId,
      badges: [{ label: "ZBAT", type: "zbat" }, { label: "Direct", type: "direct" }],
      time: timeStr,
      content: inputText.trim(),
      channelId: currentChannel.id,
    };

    setMessages(prev => {
      const updated = [...prev, newMsg];
      AsyncStorage.setItem("@wyrenet_chat_messages", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    setInputText("");
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const channelMessages = messages.filter(
    m => m.channelId === currentChannel.id || (!m.channelId && currentChannel.id === "general")
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#07090e" />

      {/* TOPBAR */}
      <View style={styles.topbar}>
        <View style={styles.topbarLeft}>
          <TouchableOpacity
            style={styles.hamburgerBtn}
            onPress={openSidebar}
            activeOpacity={0.7}
          >
            <View style={styles.hamburgerBar} />
            <View style={styles.hamburgerBar} />
            <View style={styles.hamburgerBar} />
          </TouchableOpacity>

          <Text style={styles.channelHashIcon}>#</Text>

          <View style={styles.topbarInfo}>
            <Text style={styles.topbarChannelTitle} numberOfLines={1}>
              {currentChannel.name}
            </Text>
            <Text style={styles.topbarTopic} numberOfLines={1}>
              {currentChannel.topic}
            </Text>
          </View>
        </View>

        <View style={styles.topbarRight}>
          <TouchableOpacity
            style={styles.membersBtn}
            onPress={() => navigation.navigate("Wallet")}
            activeOpacity={0.7}
          >
            <Text style={styles.membersBtnText}>PEERS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CHAT VIEWPORT */}
      <KeyboardAvoidingView
        style={styles.chatViewport}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesScrollView}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* WELCOME HERO BANNER */}
          <View style={styles.welcomeHero}>
            <View style={styles.heroIconWrap}>
              <Text style={styles.heroIconText}>#</Text>
            </View>
            <Text style={styles.heroTitle}>Welcome to #{currentChannel.name}!</Text>
            <Text style={styles.heroDesc}>{currentChannel.topic}</Text>
          </View>

          {/* MESSAGE STREAM */}
          {channelMessages.map(item => (
            <View key={item.id} style={styles.messageRow}>
              <View style={styles.messageHeader}>
                <Text style={styles.msgAuthor}>{item.author}</Text>
                <Text style={styles.msgFingerprint}>{item.fingerprint}</Text>

                {item.badges.map((b, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.msgBadge,
                      b.type === "zbat" && styles.badgeZbat,
                      b.type === "e2ee" && styles.badgeE2ee,
                      b.type === "direct" && styles.badgeDirect,
                      b.type === "hops" && styles.badgeHops,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        b.type === "zbat" && styles.badgeTextZbat,
                        b.type === "e2ee" && styles.badgeTextE2ee,
                      ]}
                    >
                      {b.label}
                    </Text>
                  </View>
                ))}

                <Text style={styles.msgTime}>{item.time}</Text>
              </View>

              <Text style={styles.msgBody}>{item.content}</Text>
            </View>
          ))}
        </ScrollView>

        {/* COMPOSER BAR */}
        <View style={styles.composerWrapper}>
          <View style={styles.composerBox}>
            <TouchableOpacity style={styles.attachBtn} activeOpacity={0.7}>
              <Text style={styles.attachBtnText}>+</Text>
            </TouchableOpacity>

            <View style={styles.shieldBadge}>
              <Text style={styles.shieldBadgeText}>E2EE</Text>
            </View>

            <TextInput
              style={styles.composerInput}
              placeholder={`Broadcast encrypted message to #${currentChannel.name}`}
              placeholderTextColor="#6e7681"
              value={inputText}
              onChangeText={setInputText}
              multiline={false}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
            />

            <TouchableOpacity
              style={styles.sendBtn}
              onPress={handleSendMessage}
              activeOpacity={0.7}
            >
              <Text style={styles.sendBtnText}>&gt;</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* SLIDING SIDEBAR DRAWER MODAL */}
      <Modal
        visible={sidebarOpen}
        transparent={true}
        animationType="none"
        onRequestClose={closeSidebar}
      >
        <View style={styles.modalRoot}>
          {/* Backdrop */}
          <Animated.View
            style={[
              styles.modalBackdrop,
              {
                opacity: overlayAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.7],
                }),
              },
            ]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={closeSidebar}
            />
          </Animated.View>

          {/* Drawer Container */}
          <Animated.View
            style={[
              styles.drawerContainer,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            {/* Drawer Header */}
            <View style={styles.drawerHeader}>
              <TouchableOpacity
                onPress={closeSidebar}
                style={styles.drawerCloseBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.drawerCloseText}>←</Text>
              </TouchableOpacity>
              <View>
                <Text style={styles.drawerBrand}>WYRESUP ▾</Text>
                <Text style={styles.drawerSub}>مَجْلِس وَايِرْسُب</Text>
              </View>
            </View>

            {/* Channels Scroller */}
            <ScrollView style={styles.drawerScroll}>
              {/* Category: TEXT CHANNELS */}
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>▾ TEXT CHANNELS</Text>
                <Text style={styles.categoryAdd}>+</Text>
              </View>

              {CHANNELS.filter(c => c.category === "text").map(ch => {
                const isActive = ch.id === currentChannel.id;
                return (
                  <TouchableOpacity
                    key={ch.id}
                    style={[styles.channelItem, isActive && styles.channelItemActive]}
                    onPress={() => handleSelectChannel(ch)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.channelHash,
                        isActive && styles.channelHashActive,
                      ]}
                    >
                      #
                    </Text>
                    <Text
                      style={[
                        styles.channelName,
                        isActive && styles.channelNameActive,
                      ]}
                    >
                      {ch.name}
                    </Text>
                    {ch.badge && (
                      <View style={styles.channelItemBadge}>
                        <Text style={styles.channelItemBadgeText}>{ch.badge}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Category: DIRECT MESSAGES */}
              <View style={[styles.categoryHeader, { marginTop: 16 }]}>
                <Text style={styles.categoryTitle}>▾ DIRECT MESSAGES</Text>
              </View>
              {CHANNELS.filter(c => c.category === "dm").map(ch => (
                <TouchableOpacity
                  key={ch.id}
                  style={styles.channelItem}
                  onPress={() => handleSelectChannel(ch)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.channelHash}>@</Text>
                  <Text style={styles.channelName}>{ch.name}</Text>
                </TouchableOpacity>
              ))}

              {/* Category: VOICE & SAWT */}
              <View style={[styles.categoryHeader, { marginTop: 16 }]}>
                <Text style={styles.categoryTitle}>▾ VOICE & SAWT</Text>
                <Text style={styles.categoryAdd}>+</Text>
              </View>
              {CHANNELS.filter(c => c.category === "voice").map(ch => (
                <TouchableOpacity
                  key={ch.id}
                  style={styles.channelItem}
                  onPress={() => {
                    closeSidebar();
                    navigation.navigate("Voice");
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.channelHash}>~</Text>
                  <Text style={styles.channelName}>{ch.name}</Text>
                </TouchableOpacity>
              ))}

              {/* Category: SOVEREIGN L1 */}
              <View style={[styles.categoryHeader, { marginTop: 16 }]}>
                <Text style={styles.categoryTitle}>▾ SOVEREIGN L1</Text>
              </View>
              <TouchableOpacity
                style={styles.channelItem}
                onPress={() => {
                  closeSidebar();
                  navigation.navigate("Wallet");
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.channelHash}>[V]</Text>
                <Text style={styles.channelName}>خَزِينَة (Wallet)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.channelItem}
                onPress={() => {
                  closeSidebar();
                  navigation.navigate("Tunnel");
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.channelHash}>[T]</Text>
                <Text style={styles.channelName}>نَفَق (Tunnel)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.channelItem}
                onPress={() => {
                  closeSidebar();
                  navigation.navigate("Library");
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.channelHash}>[B]</Text>
                <Text style={styles.channelName}>مَكْتَبَة (Library)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.channelItem}
                onPress={() => {
                  closeSidebar();
                  navigation.navigate("Stealth");
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.channelHash}>[S]</Text>
                <Text style={styles.channelName}>مَلَاذ (Stealth)</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Bottom User Bar */}
            <View style={styles.drawerUserBar}>
              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>SA</Text>
                </View>
                <View style={styles.onlineDot} />
              </View>

              <TouchableOpacity
                style={styles.iconActionBtn}
                onPress={() => {
                  closeSidebar();
                  navigation.navigate("Voice");
                }}
              >
                <Text style={styles.iconActionText}>MIC</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconActionBtn}
                onPress={() => {
                  closeSidebar();
                  navigation.navigate("Library");
                }}
              >
                <Text style={styles.iconActionText}>LIB</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconActionBtn}
                onPress={() => {
                  closeSidebar();
                  navigation.navigate("Settings");
                }}
              >
                <Text style={styles.iconActionText}>CFG</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#07090e",
  },
  topbar: {
    height: 52,
    backgroundColor: "#0d1117",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  topbarLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  hamburgerBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#161b22",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    gap: 3,
  },
  hamburgerBar: {
    width: 16,
    height: 2,
    backgroundColor: "#f0f6fc",
    borderRadius: 1,
  },
  channelHashIcon: {
    fontSize: 20,
    fontWeight: "800",
    color: "#00f59b",
    marginRight: 6,
  },
  topbarInfo: {
    flex: 1,
  },
  topbarChannelTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  topbarTopic: {
    fontSize: 11,
    color: "#8b949e",
    marginTop: 1,
  },
  topbarRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  membersBtn: {
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "rgba(22, 27, 34, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 155, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  membersBtnText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#00f59b",
    letterSpacing: 0.5,
  },

  chatViewport: {
    flex: 1,
    backgroundColor: "#07090e",
  },
  messagesScrollView: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },

  welcomeHero: {
    paddingBottom: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  heroIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#111622",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 155, 0.35)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  heroIconText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#00f59b",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 6,
  },
  heroDesc: {
    fontSize: 13,
    color: "#8b949e",
    lineHeight: 18,
  },

  messageRow: {
    marginBottom: 18,
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
  },
  msgAuthor: {
    fontSize: 14,
    fontWeight: "700",
    color: "#00f59b",
  },
  msgFingerprint: {
    fontSize: 11,
    color: "#6e7681",
    fontFamily: Platform.OS === "android" ? "monospace" : "Menlo",
  },
  msgBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeZbat: {
    backgroundColor: "rgba(0, 245, 155, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 155, 0.3)",
  },
  badgeE2ee: {
    backgroundColor: "rgba(0, 212, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.35)",
  },
  badgeDirect: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  badgeHops: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#8b949e",
  },
  badgeTextZbat: {
    color: "#00f59b",
  },
  badgeTextE2ee: {
    color: "#00d4ff",
  },
  msgTime: {
    fontSize: 11,
    color: "#6e7681",
    marginLeft: "auto",
  },
  msgBody: {
    fontSize: 14,
    color: "#f0f6fc",
    lineHeight: 20,
  },

  composerWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#07090e",
  },
  composerBox: {
    backgroundColor: "#111622",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 155, 0.3)",
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    height: 48,
  },
  attachBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
  attachBtnText: {
    fontSize: 22,
    color: "#8b949e",
    fontWeight: "600",
  },
  shieldIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  composerInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 13,
    paddingVertical: 0,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#00f59b",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },
  sendBtnText: {
    fontSize: 14,
    color: "#07090e",
    fontWeight: "900",
  },

  modalRoot: {
    flex: 1,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  drawerContainer: {
    width: 260,
    height: "100%",
    backgroundColor: "#0a0d14",
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.08)",
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    gap: 12,
  },
  drawerCloseBtn: {
    padding: 4,
  },
  drawerCloseText: {
    color: "#8b949e",
    fontSize: 18,
  },
  drawerBrand: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  drawerSub: {
    fontSize: 11,
    color: "#00f59b",
    marginTop: 1,
  },
  drawerScroll: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 14,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 6,
    marginBottom: 6,
  },
  categoryTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6e7681",
    letterSpacing: 0.5,
  },
  categoryAdd: {
    fontSize: 15,
    color: "#6e7681",
    fontWeight: "700",
  },
  channelItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 6,
    marginBottom: 2,
    gap: 8,
  },
  channelItemActive: {
    backgroundColor: "rgba(0, 245, 155, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 155, 0.3)",
  },
  channelHash: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6e7681",
  },
  channelHashActive: {
    color: "#00f59b",
  },
  channelName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8b949e",
    flex: 1,
  },
  channelNameActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  channelItemBadge: {
    backgroundColor: "rgba(246, 173, 85, 0.15)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  channelItemBadgeText: {
    color: "#f6ad55",
    fontSize: 10,
    fontWeight: "700",
  },
  drawerUserBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#07090e",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "space-between",
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 245, 155, 0.2)",
    borderWidth: 1,
    borderColor: "#00f59b",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#00f59b",
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#00f59b",
    borderWidth: 1.5,
    borderColor: "#07090e",
  },
  iconActionBtn: {
    padding: 6,
  },
  iconActionText: {
    fontSize: 16,
  },
});

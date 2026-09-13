// Crypto polyfill - MUST be first import
import "react-native-get-random-values";

/**
 * WyreNet / WyreSup - Sovereign P2P Mesh & Avalanche L1 Subnet
 * وايرنِت / وايرصَب
 * Identical Visual Geometry to WyreSup Main Page
 */

import React, { useState, useEffect } from "react";
import { StatusBar, View, StyleSheet, Text, TouchableOpacity, ScrollView } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import RootErrorBoundary from "./src/ui/RootErrorBoundary";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import WalletScreen from "./src/screens/WalletScreen";
import ContactsScreen from "./src/screens/ContactsScreen";
import ChatScreen from "./src/screens/ChatScreen";
import FeedScreen from "./src/screens/FeedScreen";
import ConnectionRequestScreen from "./src/screens/ConnectionRequestScreen";
import NearbyPeersScreen from "./src/screens/NearbyPeersScreen";
import TestRunnerScreen from "./src/screens/TestRunnerScreen";
import P2PConnectionScreen from "./src/screens/P2PConnectionScreen";
import TunnelScreen from "./src/screens/TunnelScreen";
import NaghamScreen from "./src/screens/NaghamScreen";
import MaladhScreen from "./src/screens/MaladhScreen";
import LibraryScreen from "./src/screens/LibraryScreen";
import { deserializeIdentity, WyreSUpIdentity } from "./src/utils/Identity";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab bar icons identical to WyreSup
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    P2P: "🌐",
    Nearby: "📡",
    Contacts: "👥",
    Requests: "🔔",
    Feed: "📝",
    Tests: "🧪",
    Settings: "⚙️",
  };
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
      {icons[name] || "•"}
    </Text>
  );
}

// Settings Screen with Avalanche Subnet 51950 & Sovereign Feature Hub
function SettingsScreen({ navigation }: any) {
  const [identity, setIdentity] = useState<WyreSUpIdentity | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("@wyrenet_identity").then(async (data) => {
      if (data) {
        setIdentity(deserializeIdentity(data));
      } else {
        const legacy = await AsyncStorage.getItem("wyresup_identity");
        if (legacy) setIdentity(deserializeIdentity(legacy));
      }
    });
  }, []);

  return (
    <ScrollView style={styles.settingsContainer}>
      <Text style={styles.settingsTitle}>Settings</Text>
      
      {identity && (
        <View style={styles.idCard}>
          <Text style={styles.idLabel}>Your WyreSup ID:</Text>
          <Text style={styles.idValue}>{identity.fullId}</Text>
        </View>
      )}

      <Text style={[styles.sectionHeading, { marginTop: 24 }]}>Sovereign Ecosystem</Text>
      <View style={styles.featureGrid}>
        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate("Wallet")}
        >
          <Text style={styles.featureIcon}>💼</Text>
          <Text style={styles.featureName}>خَزِينَة (Wallet)</Text>
          <Text style={styles.featureSub}>Avalanche Subnet 51950</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate("Tunnel")}
        >
          <Text style={styles.featureIcon}>🚇</Text>
          <Text style={styles.featureName}>نَفَق (Tunnel)</Text>
          <Text style={styles.featureSub}>P2P Port Forwarding</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate("Voice")}
        >
          <Text style={styles.featureIcon}>🎵</Text>
          <Text style={styles.featureName}>نَغَم (Nagham)</Text>
          <Text style={styles.featureSub}>DTMF Voice Channel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate("Stealth")}
        >
          <Text style={styles.featureIcon}>🕶️</Text>
          <Text style={styles.featureName}>مَلَاذ (Maladh)</Text>
          <Text style={styles.featureSub}>Stealth Discovery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate("Library")}
        >
          <Text style={styles.featureIcon}>📚</Text>
          <Text style={styles.featureName}>مَكْتَبَة (Library)</Text>
          <Text style={styles.featureSub}>Decentralized Content</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionHeading, { marginTop: 20 }]}>Network Specification</Text>
      <View style={styles.specCard}>
        <Text style={styles.specLabel}>Blockchain Subnet ID</Text>
        <Text style={styles.specValue}>2HmQcbYmNdjDPsA53R4hThwr2Ec4UTz1pe5MvATFSkgGr1CDtU</Text>
        
        <Text style={styles.specLabel}>Chain ID</Text>
        <Text style={styles.specValue}>51950 (WYRE Token)</Text>

        <Text style={styles.specLabel}>Avalanche Fuji Testnet</Text>
        <Text style={styles.specValue}>43113 (AVAX Token)</Text>

        <Text style={styles.specLabel}>Zero-Domain Mode</Text>
        <Text style={[styles.specValue, { color: "#00ff88" }]}>ACTIVE (P2P Mesh + Avalanche L1)</Text>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// Main Tab Navigator matching WyreSup geometry
function MainTabs() {
  const [selectedPeer, setSelectedPeer] = useState<any>(null);

  if (selectedPeer) {
    return (
      <ChatScreen
        peerId={selectedPeer.id}
        peerName={selectedPeer.id.split("@")[0]}
      />
    );
  }

  return (
    <Tab.Navigator
      initialRouteName="P2P"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#050510",
          borderTopColor: "#1a1a2e",
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: "#00ff88",
        tabBarInactiveTintColor: "#666",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
        },
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="P2P" component={P2PConnectionScreen} />
      <Tab.Screen name="Nearby" component={NearbyPeersScreen} />
      <Tab.Screen name="Contacts">
        {() => <ContactsScreen onSelectPeer={setSelectedPeer} />}
      </Tab.Screen>
      <Tab.Screen name="Requests" component={ConnectionRequestScreen} />
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Tests" component={TestRunnerScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// Root App Component
export default function App() {
  const [hasIdentity, setHasIdentity] = useState<boolean | null>(null);

  useEffect(() => {
    checkIdentity();
  }, []);

  const checkIdentity = async () => {
    try {
      const identity = (await AsyncStorage.getItem("@wyrenet_identity")) || (await AsyncStorage.getItem("wyresup_identity"));
      setHasIdentity(!!identity);
    } catch {
      setHasIdentity(false);
    }
  };

  return (
    <RootErrorBoundary>
      {hasIdentity === null ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>وايرصَب</Text>
        </View>
      ) : (
        <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#050510" />
        <NavigationContainer
          theme={{
            dark: true,
            colors: {
              primary: "#00ff88",
              background: "#050510",
              card: "#1a1a2e",
              text: "#ffffff",
              border: "#1a1a2e",
              notification: "#00ff88",
            },
            fonts: {
              regular: { fontFamily: "System", fontWeight: "400" },
              medium: { fontFamily: "System", fontWeight: "500" },
              bold: { fontFamily: "System", fontWeight: "700" },
              heavy: { fontFamily: "System", fontWeight: "900" },
            },
          }}
        >
          <Stack.Navigator
            initialRouteName={hasIdentity ? "Main" : "Welcome"}
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#050510" },
            }}
          >
            <Stack.Screen name="Welcome">
              {props => (
                <WelcomeScreen
                  {...props}
                  onComplete={() => {
                    setHasIdentity(true);
                    props.navigation.replace("Main");
                  }}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="Wallet"
              component={WalletScreen}
              options={{
                headerShown: true,
                title: "خَزِينَة (Sovereign Wallet)",
                headerStyle: { backgroundColor: "#050510" },
                headerTintColor: "#00ff88",
                headerTitleStyle: { fontWeight: "bold" },
              }}
            />
            <Stack.Screen
              name="Tunnel"
              component={TunnelScreen}
              options={{
                headerShown: true,
                title: "نَفَق (Nafaq Tunnel)",
                headerStyle: { backgroundColor: "#050510" },
                headerTintColor: "#00ff88",
                headerTitleStyle: { fontWeight: "bold" },
              }}
            />
            <Stack.Screen
              name="Voice"
              component={NaghamScreen}
              options={{
                headerShown: true,
                title: "نَغَم (Nagham Voice)",
                headerStyle: { backgroundColor: "#050510" },
                headerTintColor: "#00ff88",
                headerTitleStyle: { fontWeight: "bold" },
              }}
            />
            <Stack.Screen
              name="Stealth"
              component={MaladhScreen}
              options={{
                headerShown: true,
                title: "مَلَاذ (Maladh Stealth)",
                headerStyle: { backgroundColor: "#050510" },
                headerTintColor: "#00ff88",
                headerTitleStyle: { fontWeight: "bold" },
              }}
            />
            <Stack.Screen
              name="Library"
              component={LibraryScreen}
              options={{
                headerShown: true,
                title: "مَكْتَبَة (Maktaba)",
                headerStyle: { backgroundColor: "#050510" },
                headerTintColor: "#00ff88",
                headerTitleStyle: { fontWeight: "bold" },
              }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: "#050510" },
                headerTintColor: "#00ff88",
                headerTitleStyle: { fontWeight: "bold" },
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
      )}
    </RootErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#050510",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 48,
    fontWeight: "700",
    color: "#00ff88",
  },
  settingsContainer: {
    flex: 1,
    backgroundColor: "#050510",
    padding: 20,
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 20,
  },
  idCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
  },
  idLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  idValue: {
    fontSize: 16,
    color: "#00ff88",
    fontFamily: "monospace",
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: "#888",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  featureCard: {
    width: "48%",
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 136, 0.15)",
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  featureName: {
    color: "#00ff88",
    fontSize: 13,
    fontWeight: "700",
  },
  featureSub: {
    color: "#888",
    fontSize: 10,
    marginTop: 2,
  },
  specCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 136, 0.1)",
  },
  specLabel: {
    color: "#888",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 8,
  },
  specValue: {
    color: "#ffffff",
    fontSize: 12,
    fontFamily: "monospace",
    marginTop: 2,
  },
});

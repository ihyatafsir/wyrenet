// Crypto polyfill - MUST be first import
import 'react-native-get-random-values';

/**
 * WyreNet - Sovereign Mesh & Avalanche L1 Subnet Blockchain Edition
 * وايرنِت
 * Zero Domain Dependency - Native Embedded Crypto Wallet
 */

import React, { useState, useEffect } from 'react';
import { StatusBar, View, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import RootErrorBoundary from './src/ui/RootErrorBoundary';
import WelcomeScreen from './src/screens/WelcomeScreen';
import WalletScreen from './src/screens/WalletScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import ChatScreen from './src/screens/ChatScreen';
import FeedScreen from './src/screens/FeedScreen';
import ConnectionRequestScreen from './src/screens/ConnectionRequestScreen';
import NearbyPeersScreen from './src/screens/NearbyPeersScreen';
import TestRunnerScreen from './src/screens/TestRunnerScreen';
import P2PConnectionScreen from './src/screens/P2PConnectionScreen';
import TunnelScreen from './src/screens/TunnelScreen';
import NaghamScreen from './src/screens/NaghamScreen';
import MaladhScreen from './src/screens/MaladhScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import { deserializeIdentity, WyreSUpIdentity } from './src/utils/Identity';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Typographic Tab bar labels (Zero Emojis)
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const codes: Record<string, string> = {
    Wallet: '[W]',
    P2P: '[P2P]',
    Tunnel: '[TUN]',
    Voice: '[VOX]',
    Stealth: '[STL]',
    Nearby: '[NRB]',
    Library: '[LIB]',
    Contacts: '[USR]',
    Requests: '[REQ]',
    Feed: '[FED]',
    Tests: '[TST]',
    Settings: '[CFG]',
  };
  return (
    <Text style={{ fontSize: 11, fontWeight: '800', color: focused ? '#00FF66' : '#666666', fontFamily: 'monospace' }}>
      {codes[name] || '[-]'}
    </Text>
  );
}

// Settings Screen with Avalanche Subnet 51950 Configuration
function SettingsScreen() {
  const [identity, setIdentity] = useState<WyreSUpIdentity | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('@wyrenet_identity').then(async (data) => {
      if (data) {
        setIdentity(deserializeIdentity(data));
      } else {
        const legacy = await AsyncStorage.getItem('wyresup_identity');
        if (legacy) setIdentity(deserializeIdentity(legacy));
      }
    });
  }, []);

  return (
    <View style={styles.settingsContainer}>
      <Text style={styles.settingsTitle}>WyreNet Settings</Text>
      <Text style={styles.settingsSubtitle}>Sovereign L1 Blockchain Subnet 51950 (Testnet)</Text>
      
      <View style={styles.identityCard}>
        <Text style={styles.identityLabel}>Blockchain Subnet ID</Text>
        <Text style={styles.identityValue}>2HmQcbYmNdjDPsA53R4hThwr2Ec4UTz1pe5MvATFSkgGr1CDtU</Text>
        
        <Text style={styles.identityLabel}>Chain ID</Text>
        <Text style={styles.identityValue}>51950 (ZBAT Token)</Text>

        <Text style={styles.identityLabel}>Avalanche Fuji Testnet</Text>
        <Text style={styles.identityValue}>43113 (AVAX Token)</Text>

        <Text style={styles.identityLabel}>Zero-Domain Mode</Text>
        <Text style={[styles.identityValue, { color: '#00FF66' }]}>ACTIVE (Zero Domain Dependencies)</Text>

        {identity && (
          <>
            <Text style={styles.identityLabel}>Your Peer ID</Text>
            <Text style={styles.identityValue}>{identity.peerId}</Text>
            <Text style={styles.identityLabel}>Display Name</Text>
            <Text style={styles.identityValue}>{identity.displayName}</Text>
          </>
        )}
      </View>
    </View>
  );
}

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarStyle: {
          backgroundColor: '#050B07',
          borderTopColor: '#00FF6633',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#00FF66',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
        headerStyle: {
          backgroundColor: '#050B07',
          borderBottomColor: '#00FF6633',
          borderBottomWidth: 1,
        },
        headerTintColor: '#00FF66',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 15,
        },
      })}
    >
      <Tab.Screen name="Wallet" component={WalletScreen} options={{ title: 'Wallet (خَزِينَة)' }} />
      <Tab.Screen name="Library" component={LibraryScreen} options={{ title: 'Maktaba (مَكْتَبَة)' }} />
      <Tab.Screen name="P2P" component={P2PConnectionScreen} options={{ title: 'WyreNet Mesh' }} />
      <Tab.Screen name="Tunnel" component={TunnelScreen} options={{ title: 'Nafaq Tunnel' }} />
      <Tab.Screen name="Voice" component={NaghamScreen} options={{ title: 'Nagham DTMF' }} />
      <Tab.Screen name="Stealth" component={MaladhScreen} options={{ title: 'Maladh Stealth' }} />
      <Tab.Screen name="Nearby" component={NearbyPeersScreen} options={{ title: 'Nearby Mesh' }} />
      <Tab.Screen name="Contacts" component={ContactsScreen} options={{ title: 'Contacts' }} />
      <Tab.Screen name="Requests" component={ConnectionRequestScreen} options={{ title: 'Requests' }} />
      <Tab.Screen name="Feed" component={FeedScreen} options={{ title: 'Feed' }} />
      <Tab.Screen name="Tests" component={TestRunnerScreen} options={{ title: 'Diagnostics' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
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
      const identity = (await AsyncStorage.getItem('@wyrenet_identity')) || (await AsyncStorage.getItem('wyresup_identity'));
      setHasIdentity(!!identity);
    } catch {
      setHasIdentity(false);
    }
  };

  return (
    <RootErrorBoundary>
      {hasIdentity === null ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Initializing WyreNet...</Text>
        </View>
      ) : (
        <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#050B07" />
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName={hasIdentity ? 'Main' : 'Welcome'}
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#050B07' },
            }}
          >
            <Stack.Screen name="Welcome">
              {props => (
                <WelcomeScreen
                  {...props}
                  onComplete={() => setHasIdentity(true)}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{
                headerShown: true,
                headerStyle: { backgroundColor: '#050B07' },
                headerTintColor: '#00FF66',
                headerTitleStyle: { fontWeight: 'bold' },
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
    backgroundColor: '#050B07',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#00FF66',
    fontSize: 16,
    fontFamily: 'monospace',
  },
  settingsContainer: {
    flex: 1,
    backgroundColor: '#050B07',
    padding: 20,
  },
  settingsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00FF66',
    marginBottom: 4,
  },
  settingsSubtitle: {
    fontSize: 13,
    color: '#8492A6',
    marginBottom: 20,
  },
  identityCard: {
    backgroundColor: '#0A1810',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#00FF6633',
  },
  identityLabel: {
    color: '#8492A6',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  identityValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'monospace',
    marginTop: 3,
  },
});

// Crypto polyfill - MUST be first import
import 'react-native-get-random-values';

/**
 * WyreNet - Sovereign Mesh & Blockchain Edition
 * وايرنِت
 */

import React, { useState, useEffect } from 'react';
import { StatusBar, View, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
import { deserializeIdentity, WyreSUpIdentity } from './src/utils/Identity';
import { Peer } from './src/messaging/types';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab bar icons
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Wallet: '💎',
    P2P: '🌐',
    Tunnel: '🚇',
    Voice: '🎵',
    Stealth: '🕶️',
    Nearby: '📡',
    Contacts: '👥',
    Requests: '🔔',
    Feed: '📝',
    Tests: '🧪',
    Settings: '⚙️',
  };
  return (
    <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>
      {icons[name] || '•'}
    </Text>
  );
}

// Settings placeholder
function SettingsScreen() {
  const [identity, setIdentity] = useState<WyreSUpIdentity | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('wyresup_identity').then(data => {
      if (data) setIdentity(deserializeIdentity(data));
    });
  }, []);

  return (
    <View style={styles.settingsContainer}>
      <Text style={styles.settingsTitle}>WyreNet Settings</Text>
      <Text style={styles.settingsSubtitle}>Sovereign L1 Blockchain Edition</Text>
      {identity && (
        <View style={styles.identityCard}>
          <Text style={styles.identityLabel}>Your Peer ID</Text>
          <Text style={styles.identityValue}>{identity.peerId}</Text>
          <Text style={styles.identityLabel}>Display Name</Text>
          <Text style={styles.identityValue}>{identity.displayName}</Text>
          <Text style={styles.identityLabel}>Subnet ID</Text>
          <Text style={styles.identityValue}>2HmQcbYmNdjDPsA53R4hThwr2Ec4UTz1pe5MvATFSkgGr1CDtU</Text>
        </View>
      )}
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
          backgroundColor: '#0a0a0a',
          borderTopColor: '#00ff6633',
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#00ff66',
        tabBarInactiveTintColor: '#666',
        headerStyle: {
          backgroundColor: '#0a0a0a',
          borderBottomColor: '#00ff6633',
          borderBottomWidth: 1,
        },
        headerTintColor: '#00ff66',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Wallet" component={WalletScreen} options={{ title: 'Wallet (خَزِينَة)' }} />
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
      const identity = await AsyncStorage.getItem('wyresup_identity');
      setHasIdentity(!!identity);
    } catch {
      setHasIdentity(false);
    }
  };

  if (hasIdentity === null) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading WyreNet...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={hasIdentity ? 'Main' : 'Welcome'}
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0a0a0a' },
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
              headerStyle: { backgroundColor: '#0a0a0a' },
              headerTintColor: '#00ff66',
              headerTitleStyle: { fontWeight: 'bold' },
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#00ff66',
    fontSize: 18,
  },
  settingsContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ff66',
    marginBottom: 4,
  },
  settingsSubtitle: {
    fontSize: 14,
    color: '#668877',
    marginBottom: 20,
  },
  identityCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#00ff6633',
  },
  identityLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
  identityValue: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'monospace',
    marginTop: 2,
  },
});

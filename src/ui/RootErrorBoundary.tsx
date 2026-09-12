import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[RootErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>WYRENET RECOVERY</Text>
          <Text style={styles.subtitle}>Sovereign Mesh Safe Mode</Text>
          <ScrollView style={styles.errorBox}>
            <Text style={styles.errorText}>
              {this.state.error ? this.state.error.toString() : 'An unexpected exception occurred.'}
            </Text>
            {this.state.errorInfo && (
              <Text style={styles.stackText}>{this.state.errorInfo.componentStack}</Text>
            )}
          </ScrollView>
          <TouchableOpacity style={styles.btn} onPress={this.handleRestart}>
            <Text style={styles.btnText}>RELOAD WYRENET</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050B07',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#00FF66',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#8492A6',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorBox: {
    maxHeight: 250,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
    marginBottom: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  stackText: {
    color: '#8492A6',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  btn: {
    backgroundColor: '#00FF66',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 14,
  },
});

export default RootErrorBoundary;

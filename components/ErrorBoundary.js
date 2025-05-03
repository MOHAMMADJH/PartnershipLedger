import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Update state with error details for display
    this.setState({
      errorInfo: errorInfo
    });
    
    console.log('App crashed with error:', error);
    console.log('Component stack:', errorInfo.componentStack);
    
    // You could log to a service here in production
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{this.state.error?.toString()}</Text>
          {__DEV__ && this.state.errorInfo && (
            <Text style={styles.errorStack}>
              {this.state.errorInfo.componentStack}
            </Text>
          )}
          <Button 
            title="Try Again" 
            onPress={() => this.setState({ hasError: false, error: null, errorInfo: null })} 
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorMessage: {
    marginBottom: 20,
    textAlign: 'center',
  },
  errorStack: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f8f8f8',
    maxHeight: 200,
  },
});

export default ErrorBoundary;

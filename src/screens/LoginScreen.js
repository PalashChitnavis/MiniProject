import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {googleLogin, auth, signOutUser} from '../services/FirebaseService';

const LoginScreen = ({navigation}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setLoading(false);
      setIsLoggedIn(!!user);
      if (user) {
        console.log('User already logged in:', user.email);
        // Optional: Auto-navigate if logged in
        // determineUserRoleAndNavigate(user);
      }
    });

    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const user = await googleLogin();
      handleLoginSuccess(user);
    } catch (error) {
      handleAuthError('Login', error);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOutUser();
      handleLogoutSuccess();
    } catch (error) {
      handleAuthError('Logout', error);
    }
  };

  const handleLoginSuccess = user => {
    console.log('Login successful:', user);
    navigation.navigate(
      user.role === 'student' ? 'StudentHome' : 'TeacherHome',
    );
  };

  const handleLogoutSuccess = () => {
    setIsLoggedIn(false);
    Alert.alert('Logged out', 'You have been successfully logged out');
    setLoading(false);
  };

  const handleAuthError = (operation, error) => {
    setLoading(false);
    Alert.alert(`${operation} Error`, error.message);
    console.log(`${operation} error:`, error);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>IIITM Classroom</Text>

        {isLoggedIn ? (
          <>
            <Pressable
              style={[styles.button, styles.logoutButton]}
              onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </Pressable>
            <Text style={styles.note}>You are already logged in</Text>
          </>
        ) : (
          <>
            <Pressable style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Login with Google</Text>
            </Pressable>
            <Text style={styles.note}>Use your @iiitm.ac.in account</Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  button: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutButton: {
    backgroundColor: '#ff4444',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  note: {
    marginTop: 20,
    color: '#666',
    fontSize: 14,
  },
});

export default LoginScreen;

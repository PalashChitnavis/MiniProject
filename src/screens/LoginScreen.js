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
import {googleLogin, signOutUser} from '../services/FirebaseService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { createUser, getUser } from '../services/DatabaseService';

const LoginScreen = () => {
  const {user, storeUser} = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleLogin = async () => {
    try {
      setLoading(true);
      const dbuser = await googleLogin();
      await storeUser(dbuser);
      if(user.type === 'student'){
        navigation.replace('Student');
      }else{
        navigation.replace('Teacher');
      }
      setIsLoggedIn(true);
      setLoading(false);
    } catch (error) {
      handleAuthError('Login', error);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOutUser();
      navigation.replace('Login');
      handleLogoutSuccess();
    } catch (error) {
      handleAuthError('Logout', error);
    }
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

  const handleTestStudent = async () => {
    try {
      const rand = generate5DigitNumber();
      const dbuser = {
        batch: '2022',
        classes: [{
          className: 'Test Class',
          classTeacher: 'TESTABR',
          classCode: 'TEST',
        }],
        email: `test_student_${rand}@iiitm.ac.in`,
        name: `Test Student ${rand}`,
        type: 'student',
        rollNumber: `${rand}`,
      };
      setLoading(true);
      await createUser(dbuser);
      await storeUser(dbuser);
      navigation.replace('Student');
      setIsLoggedIn(true);
      setLoading(false);
    } catch (error) {
      handleAuthError('Login', error);
    }
    console.log('Testing as student');
  };

  const handleTestTeacher = async () => {
    try {
      setLoading(true);
      const dbuser = await getUser('test_teacher@iiitm.ac.in');
      await storeUser(dbuser);
      navigation.replace('Teacher');
      setIsLoggedIn(true);
      setLoading(false);
    } catch (error) {
      handleAuthError('Login', error);
    }
    console.log('Testing as teacher');
  };

  function generate5DigitNumber() {
    return Math.floor(10000 + Math.random() * 90000);
  }

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

            {/* Test Buttons Container */}
            <View style={styles.testButtonsContainer}>
              <Pressable
                style={[styles.button, styles.testStudentButton]}
                onPress={handleTestStudent}>
                <Text style={styles.testButtonText}>Test as Student</Text>
              </Pressable>

              <Pressable
                style={[styles.button, styles.testTeacherButton]}
                onPress={handleTestTeacher}>
                <Text style={styles.testButtonText}>Test as Teacher</Text>
              </Pressable>
            </View>
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
    marginBottom: 15,
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
    marginBottom: 30,
  },
  testButtonsContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  testStudentButton: {
    backgroundColor: '#4285F4',
  },
  testTeacherButton: {
    backgroundColor: '#34A853',
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LoginScreen;

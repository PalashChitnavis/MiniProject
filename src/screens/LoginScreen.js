import React, {useState} from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import {googleLogin, signOutUser} from '../services/FirebaseService';
import {useAuth} from '../contexts/AuthContext';
import {useNavigation} from '@react-navigation/native';
import {
  addStudentToClass,
  createUser,
  getUser,
} from '../services/DatabaseService';

const LoginScreen = () => {
  const {storeUser} = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const [errorModal, setErrorModal] = useState({
    visible: false,
    operation: '',
    message: '',
  });

  // Prevent multiple simultaneous async operations
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLogin = async () => {
    if (isProcessing) {
      return;
    }
    setIsProcessing(true);
    try {
      setLoading(true);
      const dbuser = await googleLogin();
      if (!dbuser || !dbuser.email || !dbuser.type) {
        throw new Error('Invalid user data received');
      }
      await storeUser(dbuser);

      if (dbuser.type === 'student') {
        if (!dbuser.photoUrl) {
          showFirstTimeAlert();
          return;
        }
        navigation.replace('Student');
      } else if (dbuser.type === 'teacher') {
        navigation.replace('Teacher');
      } else {
        throw new Error('Invalid user type');
      }
      setIsLoggedIn(true);
    } catch (error) {
      handleAuthError('Login', error);
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    if (isProcessing) {
      return;
    }
    setIsProcessing(true);
    try {
      setLoading(true);
      await signOutUser();
      navigation.reset({
        index: 0,
        routes: [{name: 'Login'}],
      });
      handleLogoutSuccess();
    } catch (error) {
      handleAuthError('Logout', error);
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  const handleLogoutSuccess = () => {
    setIsLoggedIn(false);
    Alert.alert('Logged out', 'You have been successfully logged out');
  };

  const handleAuthError = (operation, error) => {
    const errorMessage = error.message || 'An unexpected error occurred';
    console.log(`${operation} error:`, error);
    setErrorModal({
      visible: true,
      operation,
      message: 'Problem while logging in',
    });
  };

  const showFirstTimeAlert = () => {
    Alert.alert(
      'First Time User',
      'As a first time user, please upload your profile picture for attendance verification',
      [
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOutUser();
              navigation.reset({
                index: 0,
                routes: [{name: 'Login'}],
              });
              setIsLoggedIn(false);
            } catch (error) {
              handleAuthError('Logout', error);
            }
          },
        },
        {
          text: 'OK',
          onPress: () => navigation.replace('CameraScreen', {first: true}),
        },
      ],
      {cancelable: false},
    );
  };

  const handleTestStudent = async () => {
    if (isProcessing) {
      return;
    }
    setIsProcessing(true);
    try {
      setLoading(true);
      const rand = generate5DigitNumber();
      const email = `test_student_${rand}@iiitm.ac.in`;
      // Check if user already exists
      const existingUser = await getUser(email);
      if (existingUser) {
        throw new Error('Test student already exists');
      }

      const dbuser = {
        batch: '2022',
        classes: [
          {
            teacherCode: 'TT',
            classCode: 'TEST_CLASS',
          },
        ],
        course: 'imt',
        email,
        name: `Test Student ${rand}`,
        type: 'student',
        rollNumber: `${rand}`,
      };

      await createUser(dbuser);
      await storeUser(dbuser);
      await addStudentToClass('TEST_CLASS', 'TT', dbuser.email).catch(error => {
        throw new Error(`Failed to add student to class: ${error.message}`);
      });

      if (!dbuser.photoUrl) {
        showFirstTimeAlert();
        return;
      }
      navigation.replace('Student');
      setIsLoggedIn(true);
    } catch (error) {
      handleAuthError('Test Student Login', error);
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  const handleTestTeacher = async () => {
    if (isProcessing) {
      return;
    }
    setIsProcessing(true);
    try {
      setLoading(true);
      const dbuser = await getUser('test_teacher@iiitm.ac.in');
      if (!dbuser || !dbuser.email || dbuser.type !== 'teacher') {
        throw new Error('Invalid teacher data');
      }
      await storeUser(dbuser);
      navigation.replace('Teacher');
      setIsLoggedIn(true);
    } catch (error) {
      handleAuthError('Test Teacher Login', error);
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  function generate5DigitNumber() {
    return Math.floor(10000 + Math.random() * 90000);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading...</Text>
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
              onPress={handleLogout}
              disabled={isProcessing}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </Pressable>
            <Text style={styles.note}>You are already logged in</Text>
          </>
        ) : (
          <>
            <Pressable
              style={styles.button}
              onPress={handleLogin}
              disabled={isProcessing}>
              <Text style={styles.buttonText}>Login with Google</Text>
            </Pressable>
            <Text style={styles.note}>Use your @iiitm.ac.in account</Text>

            <View style={styles.testButtonsContainer}>
              <Pressable
                style={[styles.button, styles.testStudentButton]}
                onPress={handleTestStudent}
                disabled={isProcessing}>
                <Text style={styles.testButtonText}>Test as Student</Text>
              </Pressable>

              <Pressable
                style={[styles.button, styles.testTeacherButton]}
                onPress={handleTestTeacher}
                disabled={isProcessing}>
                <Text style={styles.testButtonText}>Test as Teacher</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
      <Modal
        visible={errorModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{errorModal.operation} Error</Text>
            <Text style={styles.modalText}>{errorModal.message}</Text>
            <Pressable
              style={styles.modalButton}
              onPress={() => {
                setErrorModal({...errorModal, visible: false});
                navigation.reset({
                  index: 0,
                  routes: [{name: 'Login'}],
                });
                setIsLoggedIn(false);
              }}>
              <Text style={styles.modalButtonText}>Return to Login</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
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
    elevation: 10,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#ff4444',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#ff4444',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LoginScreen;

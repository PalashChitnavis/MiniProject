/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-dupe-keys */
import React, {useState, useRef, useEffect} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {Camera, useCameraDevice} from 'react-native-vision-camera';
import {useAuth} from '../contexts/AuthContext';
import {useNavigation} from '@react-navigation/native';
import {
  compareFaces,
  imageToBase64,
  uploadUserPhoto,
} from '../services/ImageService';
import {getUser} from '../services/DatabaseService';

const CameraScreen = ({route}) => {
  const {user} = useAuth();
  const device = useCameraDevice('front');
  const camera = useRef(null);
  const [isActive, setIsActive] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState('not-determined');
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const navigation = useNavigation();
  const isFirstTime = route.params?.first ?? false;

  const {teacherCode, classCode, studentEmail} = route.params;

  useEffect(() => {
    checkPermissions();
    console.log(teacherCode, classCode, studentEmail);
  }, []);

  const checkPermissions = async () => {
    const status = await Camera.getCameraPermissionStatus();
    setPermissionStatus(status);

    if (status !== 'granted') {
      const newStatus = await Camera.requestCameraPermission();
      setPermissionStatus(newStatus);
    }
  };

  const capturePhoto = async () => {
    if (camera.current) {
      try {
        const photo = await camera.current.takePhoto({
          qualityPrioritization: 'quality',
          flash: 'off',
        });
        setCapturedPhoto(photo);
        setIsActive(false); // Pause camera when previewing
      } catch (error) {
        console.error('Failed to capture photo:', error);
      }
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setIsActive(true); // Resume camera
  };

  const handleAcceptFirstTime = async () => {
    if (!capturedPhoto || !user?.email) {
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatus('uploading');

      const downloadUrl = await uploadUserPhoto(user.email, capturedPhoto.path);
      console.log('Photo uploaded successfully:', downloadUrl);

      // Show success alert first
      await new Promise(resolve => {
        Alert.alert(
          'Success',
          'Profile picture uploaded successfully!',
          [
            {
              text: 'OK',
              onPress: () => resolve(),
            },
          ],
          {cancelable: false},
        );
      });

      // Then navigate to Student screen
      navigation.replace('Student');
    } catch (error) {
      console.error('Failed to upload photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAcceptAttendance = async () => {
    if (!capturedPhoto || !user?.email) {return;}

    try {
      setIsUploading(true);
      const dbUser = await getUser(user.email);
      if (!dbUser.photoUrl) {
        throw new Error('No reference photo found');
      }
      // setUploadStatus('uploading');
      setUploadStatus('processing');
      const firebaseImageResponse = await fetch(dbUser.photoUrl);
      const firebaseImageBlob = await firebaseImageResponse.blob();
      const [sourceBase64, targetBase64] = await Promise.all([
        new Promise(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result.split(',')[1]);
          };
          reader.readAsDataURL(firebaseImageBlob);
        }),
        imageToBase64(`file://${capturedPhoto.path}`),
      ]);

      const result = await compareFaces(sourceBase64, targetBase64);
      console.log(result);

      const onPhotoVerified = route.params?.onPhotoVerified;
      if (onPhotoVerified) {
        onPhotoVerified(result.matched && result.similarity >= 70);
        setUploadStatus('verified');
        navigation.goBack();
      } else {
        Alert.alert(
          'Verification Failed',
          `Photo did not match (${
            result.similarity?.toFixed(1) || 'unknown'
          }% similarity)`,
        );
      }
    } catch (error) {
      console.error('Error:', error);
      setUploadStatus(null);
      Alert.alert('Error', 'Failed to complete the process. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleOK = () => {
    navigation.navigate('StudentViewReportScreen');
    console.log('OK pressed');
  };

  if (!device) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  if (permissionStatus !== 'granted') {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          {permissionStatus === 'denied'
            ? 'Camera permission denied. Please enable it in settings.'
            : 'Requesting camera permission...'}
        </Text>
        {permissionStatus === 'denied' && (
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={checkPermissions}>
            <Text style={styles.permissionButtonText}>
              Request Permission Again
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (uploadStatus === 'uploading') {
    return (
      <View style={styles.statusContainer}>
        <View style={styles.animationContainer}>
          <ActivityIndicator size={80} color="#6C63FF" />
        </View>
        <Text style={styles.statusText}>Uploading your photo...</Text>
        <Text style={styles.statusSubtext}>
          Please wait while we upload your image
        </Text>
      </View>
    );
  }

  if (uploadStatus === 'processing') {
    return (
      <View style={styles.statusContainer}>
        <View style={styles.animationContainer}>
          <ActivityIndicator size={80} color="#6C63FF" />
        </View>
        <Text style={styles.statusText}>Marking attendance...</Text>
        <Text style={styles.statusSubtext}>Verifying your details</Text>
      </View>
    );
  }

  if (uploadStatus === 'verified') {
    return (
      <View style={styles.statusContainer}>
        <View style={styles.verifiedAnimation}>
          <View style={styles.checkmarkCircle}>
            <Text style={styles.verifiedIcon}>✓</Text>
          </View>
        </View>
        <Text style={styles.verifiedText}>Attendance Verified</Text>
        <Text style={styles.verifiedSubtext}>
          Your attendance has been successfully recorded
        </Text>
        <TouchableOpacity
          style={styles.okButton}
          onPress={handleOK}
          activeOpacity={0.7}>
          <Text style={styles.okButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {capturedPhoto ? (
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: `file://${capturedPhoto.path}` }}
            style={styles.previewImage}
            resizeMode="contain"
          />
          <View style={styles.previewControls}>
            <TouchableOpacity
              style={[styles.actionButton, styles.retakeButton]}
              onPress={handleRetake}
              disabled={isUploading}>
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={isFirstTime ? handleAcceptFirstTime : handleAcceptAttendance}
              disabled={isUploading}>
              {isUploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>✓ Accept</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <Camera
            ref={camera}
            style={styles.camera}
            device={device}
            isActive={isActive}
            photo={true}
          />
          <View style={styles.captureControls}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={capturePhoto}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#2d2d2d',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  camera: {
    flex: 1,
    margin: 0,
    borderRadius: 20,
    overflow: 'hidden',
  },
  captureControls: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    padding: 20,
  },
  previewImage: {
    flex: 1,
    borderRadius: 20,
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  retakeButton: {
    backgroundColor: '#2d2d2d',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  animationContainer: {
    marginBottom: 40,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusSubtext: {
    color: '#A0A0A0',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    maxWidth: '80%',
  },
  verifiedAnimation: {
    width: 150,
    height: 150,
    borderRadius: 100,
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  checkmarkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedIcon: {
    color: '#FFFFFF',
    fontSize: 60,
    fontWeight: 'bold',
    marginTop: -5,
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  verifiedSubtext: {
    color: '#A0A0A0',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    maxWidth: '80%',
  },
  okButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 30,
    marginTop: 20,
    shadowColor: '#6C63FF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  okButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  // Enhance existing button styles:
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  retakeButton: {
    backgroundColor: '#2d2d2d',
  },
  acceptButton: {
    backgroundColor: '#6C63FF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
});

export default CameraScreen;

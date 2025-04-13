/* eslint-disable no-dupe-keys */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useRef, useEffect} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import {Camera, useCameraDevice} from 'react-native-vision-camera';
import {useAuth} from '../contexts/AuthContext';
import {useNavigation} from '@react-navigation/native';
import {
  compareFaces,
  imageToBase64,
  uploadUserPhoto,
} from '../services/ImageService';

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const {teacherCode, classCode, studentEmail, photoUrl} = route.params;
  const progressAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkPermissions();
    console.log(teacherCode, classCode, studentEmail);
  }, []);

  useEffect(() => {
    // Update Animated value when uploadProgress changes
    Animated.timing(progressAnimation, {
      toValue: uploadProgress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [uploadProgress]);

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
  // const progressIntervalRef = useRef(null);

  const startProgressInterval = () => {
    setUploadProgress(0);

    const updateProgress = () => {
      setUploadProgress(prev => {
        const randomIncrement = 0.01 + Math.random() * 0.05;
        const newValue = prev + randomIncrement;
        const capped = newValue > 0.9 ? 0.9 : newValue;

        // If we're not at the cap yet, schedule another update
        if (capped < 0.9) {
          setTimeout(updateProgress, 1000);
        }

        return capped;
      });

      console.log('Progress update tick');
    };

    // Start the recursive updates
    setTimeout(updateProgress, 1000);
  };

  // useEffect(() => {
  //   return () => {
  //     if (progressIntervalRef.current) {
  //       clearInterval(progressIntervalRef.current);
  //     }
  //   };
  // }, []);

  const handleAcceptFirstTime = async () => {
    if (!capturedPhoto || !user?.email) {
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatus('uploading');

      const progressInterval = startProgressInterval();

      const downloadUrl = await uploadUserPhoto(user.email, capturedPhoto.path);
      console.log('Photo uploaded successfully:', downloadUrl);

      clearInterval(progressInterval);
      setUploadProgress(1); // Set to 100% when complete

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
    if (!capturedPhoto || !user?.email) {
      return;
    }

    try {
      setIsUploading(true);


      setUploadStatus('processing');
      const progressInterval = startProgressInterval();

      // Rest of your image processing code...
      const firebaseImageResponse = await fetch(photoUrl);
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

      // Fix the issue with directly reassigning result
      let result = await compareFaces(sourceBase64, targetBase64);

      console.log('Face comparison result:', result);

      clearInterval(progressInterval);
      setUploadProgress(1); // Set to 100% when complete

      const onPhotoVerified = route.params?.onPhotoVerified;
      if (onPhotoVerified) {
        onPhotoVerified(result.matched && result.similarity >= 70);
        setUploadStatus('verified');
      } else {
        setUploadStatus('notverified');
        Alert.alert(
          'Verification Failed',
          `Photo did not match (${
            result.similarity?.toFixed(1) || 'unknown'
          }% similarity)`,
        );
      }
    } catch (error) {
      console.error('Error in handleAcceptAttendance:', error);
      setUploadStatus('notverified');
      Alert.alert(
        'Error',
        error.message || 'Failed to complete the process. Please try again.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleOK = () => {
    // navigation.navigate('StudentViewReportScreen');
    navigation.goBack();
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
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.statusText}>
          {uploadProgress < 1
            ? `Uploading... ${Math.round(uploadProgress * 100)}%`
            : 'Finalizing...'}
        </Text>
        <Text style={styles.statusSubtext}>
          {uploadProgress < 1
            ? 'Please wait while we upload your image'
            : 'Almost done!'}
        </Text>
      </View>
    );
  }

  if (uploadStatus === 'processing') {
    return (
      <View style={styles.statusContainer}>
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.statusText}>
          {uploadProgress < 1
            ? `Marking attendance... ${Math.round(uploadProgress * 100)}%`
            : 'Finalizing...'}
        </Text>
        <Text style={styles.statusSubtext}>
          {uploadProgress < 0.9 ? 'Verifying your details' : 'Almost done!'}
        </Text>
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
  if (uploadStatus === 'notverified') {
    return (
      <View style={styles.statusContainer}>
        <View style={styles.notVerifiedAnimation}>
          <View style={styles.crossCircle}>
            <Text style={styles.notVerifiedIcon}>✕</Text>
          </View>
        </View>
        <Text style={styles.notVerifiedText}>Attendance Not Verified</Text>
        <Text style={styles.notVerifiedSubtext}>
          Photo did not match our records
        </Text>
        <TouchableOpacity
          style={styles.tryAgainButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <Text style={styles.tryAgainButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {capturedPhoto ? (
        <View style={styles.previewContainer}>
          <Image
            source={{uri: `file://${capturedPhoto.path}`}}
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
              onPress={
                isFirstTime ? handleAcceptFirstTime : handleAcceptAttendance
              }
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
  notVerifiedAnimation: {
    marginBottom: 20,
    alignItems: 'center',
  },
  crossCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFEBEE', // Light red background
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F44336', // Red border
  },
  notVerifiedIcon: {
    color: '#F44336', // Red color
    fontSize: 40,
    fontWeight: 'bold',
  },
  notVerifiedText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F44336', // Red color
    marginBottom: 10,
  },
  notVerifiedSubtext: {
    fontSize: 16,
    color: '#616161', // Gray color
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  tryAgainButton: {
    backgroundColor: '#F44336', // Red color
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  tryAgainButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    width: '80%',
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6C63FF',
    borderRadius: 4,
  },
  statusContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusSubtext: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
  },
});

export default CameraScreen;

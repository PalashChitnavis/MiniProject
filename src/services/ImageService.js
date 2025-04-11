import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

export const uploadUserPhoto = async (email, photoUri) => {
  try {
    // Validate inputs
    if (!email || !photoUri) {
      throw new Error('Email and photo URI are required');
    }

    // Create storage reference path
    const emailKey = email.replace(/[@.]/g, '_');
    const timestamp = Date.now();
    const storagePath = `user_photos/${emailKey}/${timestamp}.jpg`;

    // Upload image to Firebase Storage
    const reference = storage().ref(storagePath);
    const task = reference.putFile(photoUri);

    // Wait for upload to complete
    await task;

    // Get download URL
    const downloadUrl = await reference.getDownloadURL();

    // Update Firestore user document
    const userRef = firestore().collection('users').doc(emailKey);
    await userRef.update({
      photoUrl: downloadUrl,
      photoLastUpdated: firestore.FieldValue.serverTimestamp(),
    });

    console.log('User photo updated successfully');
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading user photo:', error);
    throw error;
  }
};

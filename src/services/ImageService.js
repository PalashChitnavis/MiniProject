import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import AWS from 'aws-sdk';
import { Buffer } from 'buffer';
import Config from 'react-native-config';

AWS.config.update({
  region: Config.AWS_REGION,
  accessKeyId: Config.AWS_ACCESS_KEY_ID,
  secretAccessKey: Config.AWS_SECRET_ACCESS_KEY,
});

const rekognition = new AWS.Rekognition();

export const compareFaces = async (sourceImageBase64, targetImageBase64) => {
  try {
    const params = {
      SourceImage: { Bytes: Buffer.from(sourceImageBase64, 'base64') },
      TargetImage: { Bytes: Buffer.from(targetImageBase64, 'base64') },
      SimilarityThreshold: 70,
    };

    const data = await rekognition.compareFaces(params).promise();

    console.log(data);

    return {
      similarity: data.FaceMatches[0]?.Similarity || 0,
      matched: data.FaceMatches.length > 0,
    };
  } catch (error) {
    console.error('AWS Rekognition Error:', error);
    throw error;
  }
};

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
    });

    console.log('User photo updated successfully');
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading user photo:', error);
    throw error;
  }
};

export const imageToBase64 = async (uri) => {
  // For local files
  if (uri.startsWith('file://')) {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result.split(',')[1];
        resolve(base64data);
      };
      reader.readAsDataURL(blob);
    });
  }
  // For network images
  else {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result.split(',')[1];
        resolve(base64data);
      };
      reader.readAsDataURL(blob);
    });
  }
};

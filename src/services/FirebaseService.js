/* eslint-disable no-unused-vars */
/* eslint-disable no-return-assign */
// services/FirebaseService.js
import {initializeApp} from 'firebase/app';
import {getDatabase} from 'firebase/database';
import {
  getAuth,
} from 'firebase/auth';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import prompt from 'react-native-prompt-android';
import { createUser, getUser } from './DatabaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';

const firebaseConfig = {
  apiKey: Config.FIREBASE_API,
  databaseURL: Config.FIREBASE_DATABASE,
  projectId: Config.FIREBASE_PROJECT,
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
export const auth = getAuth(app);

auth.setPersistence('local');

const webClientId = Config.FIREBASE_WEBCLIENT;

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: webClientId,
});

export const googleLogin = async () => {
  try {
    await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});

    await GoogleSignin.signOut();
    const response = await GoogleSignin.signIn();
    const {user} = response.data;

    if (!user.email.endsWith('@iiitm.ac.in')) {
      await GoogleSignin.signOut();
      throw new Error('Only iiitm.ac.in emails are allowed');
    }

    const existingUser = await getUser(user.email);
    if (existingUser) {
      console.log('user already exists:');
      console.log(existingUser);
      return existingUser;
    }

    const emailPrefix = user.email.split('@')[0];
    const hasNumbers = /\d/.test(emailPrefix);
    const isStudent = hasNumbers;
    const userInfo = {
      name: user.name || user.email,
      email: user.email,
      type: isStudent ? 'student' : 'teacher',
      classes: [],
    };

    if (isStudent) {
      // Match the pattern: letters_YYYYRRR (e.g., imt_2022080)
      const studentMatch = emailPrefix.match(/^([a-z]+)_(\d{4})(\d{3})$/i);
      if (!studentMatch) {
        throw new Error('Invalid student email format (should be prefix_YYYYRRR@iiitm.ac.in)');
      }
      const [, course, batch, rollNumber] = studentMatch;
      userInfo.batch = batch;
      userInfo.rollNumber = rollNumber;
      userInfo.course = course;
    }else {
      prompt(
        'Faculty Abbreviation',
        'Please enter your faculty abbreviation (e.g., AT for Prof Aditya Trivedi):',
        [
          {
            text: 'Cancel',
            onPress: () => console.log('cancel'),
            style: 'cancel',
          },
          {
            text: 'Submit',
            onPress: (text) => userInfo.facultyAbbreviation = text.toUpperCase(),
          },
        ],
        'plain-text',
        '',
        'default'
      );
    }

    const dbuser = await createUser(userInfo);
    return dbuser;
  } catch (error) {
    console.error('Login error:', error);
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Login cancelled');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Login in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play services required');
    } else {
      throw error;
    }
  }
};

// Sign out
export const signOutUser = async () => {
  await GoogleSignin.signOut();
  await AsyncStorage.removeItem('@user');
};

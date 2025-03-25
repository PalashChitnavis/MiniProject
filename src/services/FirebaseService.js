// services/FirebaseService.js
import {initializeApp} from 'firebase/app';
import {getDatabase, ref, set} from 'firebase/database';
import {
  getAuth,
  signInWithCredential,
  onAuthStateChanged,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

const firebaseConfig = {
  apiKey: 'AIzaSyAaGt_RbRd6goTypvPlYEtIXyYsMW0RDV8',
  authDomain: 'your-app.firebaseapp.com',
  databaseURL: 'https://mini-f5b2c-default-rtdb.firebaseio.com/',
  projectId: 'mini-f5b2c',
  storageBucket: 'your-app.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_ID',
  appId: 'YOUR_APP_ID',
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
export const auth = getAuth(app);

const webClientId =
  '880372801785-4sg3v286qirnutvglcer1acpq5ni4d0n.apps.googleusercontent.com';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: webClientId,
});

export const googleLogin = async () => {
  try {
    // 1. Check for Play Services
    await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});

    // 2. Force account picker to show every time
    await GoogleSignin.signOut();
    const response = await GoogleSignin.signIn();
    const {user} = response.data;

    // 3. Verify email domain
    if (!user.email.endsWith('@iiitm.ac.in')) {
      await GoogleSignin.signOut();
      throw new Error('Only iiitm.ac.in emails are allowed');
    }

    // 4. Process user data
    const emailPrefix = user.email.split('@')[0];
    const isStudent = /\d/.test(emailPrefix);
    let classGroup = null;

    if (isStudent) {
      const yearMatch = emailPrefix.match(/^(\d{4})_/);
      if (!yearMatch) {
        throw new Error('Invalid student email format (should be YYYY_ABC123)');
      }
      classGroup = yearMatch[1];
    }

    // 5. Prepare user data
    const userData = {
      id: isStudent ? emailPrefix : `staff_${user.id}`, // Unique ID for all users
      name: user.name || 'No Name Provided',
      email: user.email,
      profilePic: user.photo || null,
      type: isStudent ? 'student' : 'teacher',
      ...(isStudent && {class: classGroup}),
      subjects: {},
      lastActive: Date.now(),
      createdAt: Date.now(),
    };

    // 6. Store in single users table
    await set(ref(database, `users/${userData.id}`), userData);

    return userData;
  } catch (error) {
    console.error('Login error:', error);

    // Specific error handling
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
export const signOutUser = () => {
  return signOut(auth);
};

// Get current user data
export const getCurrentUser = async () => {
  const user = auth.currentUser;
  if (!user) return null;

  // Check if user is a student or teacher
  const email = user.email;
  const isStudent = email.includes('_');

  if (isStudent) {
    const studentId = email.split('@')[0];
    const snapshot = await get(ref(database, `students/${studentId}`));
    const studentData = snapshot.val();

    return {
      ...studentData,
      role: 'student',
    };
  } else {
    const snapshot = await get(ref(database, `teachers/${user.uid}`));
    const teacherData = snapshot.val();

    return {
      ...teacherData,
      role: 'teacher',
    };
  }
};

// --- Student Functions ---

// Get student by ID
export const getStudentById = async studentId => {
  const snapshot = await get(ref(database, `students/${studentId}`));
  return snapshot.val();
};

// Update student profile
export const updateStudentProfile = async (studentId, data) => {
  return update(ref(database, `students/${studentId}`), {
    ...data,
    lastActive: Date.now(),
  });
};

// Get all students in a class group
export const getStudentsByClass = async classGroup => {
  const studentsRef = ref(database, 'students');
  const classStudentsQuery = query(
    studentsRef,
    orderByChild('class'),
    equalTo(classGroup),
  );
  const snapshot = await get(classStudentsQuery);

  const students = {};
  snapshot.forEach(childSnapshot => {
    students[childSnapshot.key] = childSnapshot.val();
  });

  return students;
};

// --- Teacher Functions ---

// Get teacher by ID
export const getTeacherById = async teacherId => {
  const snapshot = await get(ref(database, `teachers/${teacherId}`));
  return snapshot.val();
};

// Update teacher profile
export const updateTeacherProfile = async (teacherId, data) => {
  return update(ref(database, `teachers/${teacherId}`), {
    ...data,
    lastActive: Date.now(),
  });
};

// --- Subject Functions ---

// Create a new subject
export const createSubject = async subjectData => {
  const {name, teacherId} = subjectData;

  if (!name || !teacherId) {
    throw new Error('Subject name and teacher ID are required');
  }

  const newSubjectRef = push(ref(database, 'subjects'));
  const subjectId = newSubjectRef.key;

  // Create the subject
  await set(newSubjectRef, {
    id: subjectId,
    name,
    teacherId,
    students: {},
    createdAt: Date.now(),
  });

  // Add subject to teacher's subjects list
  await update(ref(database, `teachers/${teacherId}/subjects`), {
    [subjectId]: true,
  });

  return subjectId;
};

// Get subject by ID
export const getSubjectById = async subjectId => {
  const snapshot = await get(ref(database, `subjects/${subjectId}`));
  return snapshot.val();
};

// Update subject
export const updateSubject = async (subjectId, data) => {
  return update(ref(database, `subjects/${subjectId}`), data);
};

// Delete subject
export const deleteSubject = async subjectId => {
  // Get the subject first to know the teacher
  const snapshot = await get(ref(database, `subjects/${subjectId}`));
  const subject = snapshot.val();

  if (!subject) {
    throw new Error('Subject not found');
  }

  // Remove subject from teacher
  await remove(
    ref(database, `teachers/${subject.teacherId}/subjects/${subjectId}`),
  );

  // Remove subject from all enrolled students
  if (subject.students) {
    for (const studentId of Object.keys(subject.students)) {
      await remove(
        ref(database, `students/${studentId}/subjects/${subjectId}`),
      );
    }
  }

  // Remove subject from database
  return remove(ref(database, `subjects/${subjectId}`));
};

// Enroll student in subject
export const enrollStudentInSubject = async (subjectId, studentId) => {
  // Add subject to student's subjects
  await update(ref(database, `students/${studentId}/subjects`), {
    [subjectId]: true,
  });

  // Add student to subject's students
  return update(ref(database, `subjects/${subjectId}/students`), {
    [studentId]: true,
  });
};

// Remove student from subject
export const removeStudentFromSubject = async (subjectId, studentId) => {
  // Remove subject from student's subjects
  await remove(ref(database, `students/${studentId}/subjects/${subjectId}`));

  // Remove student from subject's students
  return remove(ref(database, `subjects/${subjectId}/students/${studentId}`));
};

// Get subjects taught by teacher
export const getTeacherSubjects = async teacherId => {
  const subjectsRef = ref(database, 'subjects');
  const teacherSubjectsQuery = query(
    subjectsRef,
    orderByChild('teacherId'),
    equalTo(teacherId),
  );
  const snapshot = await get(teacherSubjectsQuery);

  const subjects = {};
  snapshot.forEach(childSnapshot => {
    subjects[childSnapshot.key] = childSnapshot.val();
  });

  return subjects;
};

// Get subjects enrolled by student
export const getStudentSubjects = async studentId => {
  const snapshot = await get(ref(database, `students/${studentId}/subjects`));
  const subjectIds = snapshot.val() || {};

  const subjects = {};
  for (const subjectId of Object.keys(subjectIds)) {
    const subjectSnapshot = await get(ref(database, `subjects/${subjectId}`));
    subjects[subjectId] = subjectSnapshot.val();
  }

  return subjects;
};

// --- Attendance Functions ---

// Take attendance for a subject
export const takeAttendance = async (
  subjectId,
  teacherId,
  presentStudentIds,
) => {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  // Verify the teacher teaches this subject
  const subjectSnapshot = await get(ref(database, `subjects/${subjectId}`));
  const subject = subjectSnapshot.val();

  if (!subject) {
    throw new Error('Subject not found');
  }

  if (subject.teacherId !== teacherId) {
    throw new Error(
      'Only the assigned teacher can take attendance for this subject',
    );
  }

  // Create a new attendance record
  const newAttendanceRef = push(ref(database, 'attendance'));
  const attendanceId = newAttendanceRef.key;

  const presentStudents = {};
  for (const studentId of presentStudentIds) {
    presentStudents[studentId] = {
      timestamp: Date.now(),
      bluetoothSignal: simulateBluetoothSignalStrength(),
    };
  }

  await set(newAttendanceRef, {
    id: attendanceId,
    subjectId,
    date,
    teacherId,
    presentStudents,
    timestamp: Date.now(),
  });

  return attendanceId;
};

// Get attendance for a subject on a specific date
export const getAttendanceBySubjectAndDate = async (subjectId, date) => {
  const attendanceRef = ref(database, 'attendance');
  const query1 = query(
    attendanceRef,
    orderByChild('subjectId'),
    equalTo(subjectId),
  );
  const snapshot = await get(query1);

  const attendanceRecords = [];
  snapshot.forEach(childSnapshot => {
    const record = childSnapshot.val();
    if (record.date === date) {
      attendanceRecords.push({
        id: childSnapshot.key,
        ...record,
      });
    }
  });

  return attendanceRecords;
};

// Get all attendance records for a subject
export const getAllAttendanceBySubject = async subjectId => {
  const attendanceRef = ref(database, 'attendance');
  const subjectAttendanceQuery = query(
    attendanceRef,
    orderByChild('subjectId'),
    equalTo(subjectId),
  );
  const snapshot = await get(subjectAttendanceQuery);

  const records = [];
  snapshot.forEach(childSnapshot => {
    records.push({
      id: childSnapshot.key,
      ...childSnapshot.val(),
    });
  });

  return records;
};

// Get attendance records for a student
export const getStudentAttendance = async studentId => {
  // Get all subjects the student is enrolled in
  const studentSubjects = await getStudentSubjects(studentId);
  const subjectIds = Object.keys(studentSubjects);

  // For each subject, get all attendance records
  const attendanceBySubject = {};

  for (const subjectId of subjectIds) {
    const records = await getAllAttendanceBySubject(subjectId);

    // Filter records to find which ones the student was present for
    const subjectAttendance = records.map(record => {
      const wasPresent =
        record.presentStudents && record.presentStudents[studentId];

      return {
        id: record.id,
        date: record.date,
        subject: studentSubjects[subjectId].name,
        present: !!wasPresent,
        timestamp: wasPresent ? wasPresent.timestamp : null,
      };
    });

    attendanceBySubject[subjectId] = {
      subjectName: studentSubjects[subjectId].name,
      records: subjectAttendance,
    };
  }

  return attendanceBySubject;
};

// Calculate attendance percentage for a student in a subject
export const calculateAttendancePercentage = async (studentId, subjectId) => {
  const allAttendance = await getAllAttendanceBySubject(subjectId);

  if (allAttendance.length === 0) {
    return 0;
  }

  let presentCount = 0;

  for (const record of allAttendance) {
    if (record.presentStudents && record.presentStudents[studentId]) {
      presentCount++;
    }
  }

  return (presentCount / allAttendance.length) * 100;
};

// --- Bluetooth Session Functions ---

// Start a bluetooth attendance session
export const startBluetoothSession = async (subjectId, teacherId) => {
  // Create or update a session record in Firebase
  const sessionData = {
    subjectId,
    teacherId,
    startTime: Date.now(),
    bluetoothToken: generateUUID(),
    active: true,
  };

  const newSessionRef = push(ref(database, 'bluetoothSessions'));
  await set(newSessionRef, sessionData);

  return {
    id: newSessionRef.key,
    ...sessionData,
  };
};

// End a bluetooth attendance session and record attendance
export const endBluetoothSession = async (sessionId, presentStudentIds) => {
  // Get the session data
  const sessionSnapshot = await get(
    ref(database, `bluetoothSessions/${sessionId}`),
  );
  const session = sessionSnapshot.val();

  if (!session) {
    throw new Error('Session not found');
  }

  // Update the session
  await update(ref(database, `bluetoothSessions/${sessionId}`), {
    endTime: Date.now(),
    active: false,
  });

  // Record the attendance
  const attendanceId = await takeAttendance(
    session.subjectId,
    session.teacherId,
    presentStudentIds,
  );

  return {
    sessionId,
    attendanceId,
    endTime: Date.now(),
  };
};

// Get active bluetooth sessions for a student's subjects
export const getActiveSessionsForStudent = async studentId => {
  // Get student's subjects
  const studentSubjects = await getStudentSubjects(studentId);
  const subjectIds = Object.keys(studentSubjects);

  // Check for active sessions in these subjects
  const activeSessions = [];

  for (const subjectId of subjectIds) {
    const sessionsRef = ref(database, 'bluetoothSessions');
    const subjectSessionsQuery = query(
      sessionsRef,
      orderByChild('subjectId'),
      equalTo(subjectId),
    );

    const snapshot = await get(subjectSessionsQuery);

    snapshot.forEach(childSnapshot => {
      const session = childSnapshot.val();
      if (session.active) {
        activeSessions.push({
          id: childSnapshot.key,
          subjectName: studentSubjects[subjectId].name,
          ...session,
        });
      }
    });
  }

  return activeSessions;
};

// Mark a student present in a bluetooth session
export const markStudentPresent = async (sessionId, studentId) => {
  // Get the session
  const sessionSnapshot = await get(
    ref(database, `bluetoothSessions/${sessionId}`),
  );
  const session = sessionSnapshot.val();

  if (!session) {
    throw new Error('Session not found');
  }

  if (!session.active) {
    throw new Error('Session is no longer active');
  }

  // Add student to present list
  return update(
    ref(database, `bluetoothSessions/${sessionId}/presentStudents`),
    {
      [studentId]: {
        timestamp: Date.now(),
        bluetoothSignal: simulateBluetoothSignalStrength(),
      },
    },
  );
};

// Listen for active bluetooth sessions for a student
export const listenForActiveSessionsForStudent = (studentId, callback) => {
  // This would require some complex query structures that aren't directly supported
  // Instead, we'll implement a polling mechanism

  let interval = setInterval(async () => {
    try {
      const activeSessions = await getActiveSessionsForStudent(studentId);
      callback(activeSessions);
    } catch (error) {
      console.error('Error checking for active sessions:', error);
    }
  }, 10000); // Check every 10 seconds

  return {
    stop: () => clearInterval(interval),
  };
};

// --- Helper Functions ---

// Simulate Bluetooth signal strength
const simulateBluetoothSignalStrength = () => {
  // Generate a random RSSI value between -100 (weak) and -40 (strong)
  return Math.floor(Math.random() * 60 - 100);
};

// Generate a UUID for Bluetooth token
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
export const checkAuthState = callback => {
  return onAuthStateChanged(auth, callback);
};

export default {
  auth,
  signOutUser,
  checkAuthState,
  getCurrentUser,
  getStudentById,
  updateStudentProfile,
  getStudentsByClass,
  getTeacherById,
  updateTeacherProfile,
  createSubject,
  getSubjectById,
  updateSubject,
  deleteSubject,
  enrollStudentInSubject,
  removeStudentFromSubject,
  getTeacherSubjects,
  getStudentSubjects,
  takeAttendance,
  getAttendanceBySubjectAndDate,
  getAllAttendanceBySubject,
  getStudentAttendance,
  calculateAttendancePercentage,
  startBluetoothSession,
  endBluetoothSession,
  getActiveSessionsForStudent,
  markStudentPresent,
  listenForActiveSessionsForStudent,
};

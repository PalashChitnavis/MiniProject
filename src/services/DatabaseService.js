import firestore from '@react-native-firebase/firestore';

export const createUser = async (user) => {
  try {
    // Validate input
    if (!user || typeof user !== 'object') {
      throw new Error('User must be a valid object');
    }
    if (!user.email || typeof user.email !== 'string') {
      throw new Error('User email is required and must be a string');
    }
    if (!user.type || !['student', 'teacher'].includes(user.type)) {
      throw new Error('User type is required and must be "student" or "teacher"');
    }

    // Preserve your email key transformation
    const emailKey = user.email.replace(/[@.]/g, '_');
    const userRef = firestore().collection('users').doc(emailKey);

    // Use transaction for consistency and to check existing data
    let result;
    await firestore().runTransaction(async (transaction) => {
      const docSnapshot = await transaction.get(userRef);

      // Prepare the user data with defaults for optional fields
      const userData = {
        email: user.email,
        type: user.type,
        name: user.name || '', // Default to empty string if not provided
        ...(user.type === 'student' && {
          batch: user.batch || '',
          rollNumber: user.rollNumber || '',
          classes: user.classes || [],
        }),
        ...(user.type === 'teacher' && {
          teacherCode: user.teacherCode || '',
          classes: user.classes || [],
        }),
      };

      if (docSnapshot.exists) {
        // Document exists, merge updates
        console.log(`User ${emailKey} already exists, merging updates`);
        transaction.set(userRef, userData, { merge: true });
        result = { id: emailKey, ...docSnapshot.data(), ...userData };
      } else {
        // New document
        transaction.set(userRef, userData, { merge: true });
        result = { id: emailKey, ...userData };
      }
    });

    console.log(`User ${emailKey} created or updated successfully`);
    return result; // Return the full user data
  } catch (error) {
    console.error('Error creating or updating user:', error.message);
    throw error;
  }
};

export const getUser = async (email) => {
  try {
    // Validate input
    if (!email || typeof email !== 'string') {
      throw new Error('Email is required and must be a string');
    }

    // Preserve your email key transformation
    const emailKey = email.replace(/[@.]/g, '_');
    const userRef = firestore().collection('users').doc(emailKey);

    // Fetch the document
    const docSnapshot = await userRef.get();

    if (!docSnapshot.exists) {
      console.log(`No user found for emailKey: ${emailKey}`);
      return null; // Consistent with original behavior
    }

    const userData = docSnapshot.data();

    // Optional: Verify the email matches the input to detect collisions
    if (userData.email !== email) {
      console.warn(`Email key collision detected: ${emailKey} maps to ${userData.email}, not ${email}`);
      // You could throw an error here if collisions are critical
      // throw new Error('Email key collision detected');
    }

    console.log(`User fetched successfully for emailKey: ${emailKey}`);
    return { id: emailKey, ...userData }; // Return data with ID
  } catch (error) {
    console.error('Error fetching user:', error.message);
    throw error;
  }
};

export const getTeacherEmailFromCode = async (teacherCode) => {
  try {
    // Validate input
    if (!teacherCode || typeof teacherCode !== 'string') {
      throw new Error('teacherCode is required and must be a string');
    }

    // Query users collection for teacherCode, ensuring type is "teacher"
    const snapshot = await firestore()
      .collection('users')
      .where('teacherCode', '==', teacherCode)
      .where('type', '==', 'teacher') // Ensure it’s a teacher
      .limit(1)
      .get();

    // Check if a teacher was found
    if (snapshot.empty) {
      console.log(`No teacher found with teacherCode: ${teacherCode}`);
      return null; // Indicate no match
    }

    // Get the first (and only) document
    const teacherData = snapshot.docs[0].data();

    // Log success
    console.log(`Teacher email fetched for teacherCode: ${teacherCode}`);
    return teacherData.email; // Return email as per original intent
  } catch (error) {
    console.error('Error fetching teacher email from code:', error.message);
    throw error;
  }
};

export const updateUser = async user => {
  try {
    const emailKey = user.email.replace(/[@.]/g, '_');
    const userRef = firestore().collection('users').doc(emailKey);

    // This will completely replace the existing document with the new user object
    await userRef.set(user);

    console.log('User updated successfully');
    return userRef;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const studentPutsAttendance = async (teacherCode, classCode, studentEmail) => {
  try {
    // Input validation
    if (!teacherCode || typeof teacherCode !== 'string' || teacherCode.trim() === '') {
      throw new Error('teacherCode is required and must be a non-empty string');
    }
    if (!classCode || typeof classCode !== 'string' || classCode.trim() === '') {
      throw new Error('classCode is required and must be a non-empty string');
    }
    if (!studentEmail || typeof studentEmail !== 'string' || !studentEmail.includes('@')) {
      throw new Error('studentEmail is required and must be a valid email');
    }

    const emailKey = studentEmail.replace(/[@.]/g, '_');
    const studentAttendanceRef = firestore().collection('student_attendance').doc(emailKey);
    const teacherAttendanceRef = firestore().collection('teacher_attendance').doc(`${classCode}_${teacherCode}`);

    // Use server timestamp for consistency
    const currentDate = firestore.Timestamp.now();

    await firestore().runTransaction(async (transaction) => {
      // Fetch both documents
      const studentDoc = await transaction.get(studentAttendanceRef);
      const teacherDoc = await transaction.get(teacherAttendanceRef);

      // 1. Update student_attendance
      if (!studentDoc.exists) {
        // First attendance ever for this student
        transaction.set(studentAttendanceRef, {
          studentEmail,
          classes: [{
            classCode,
            teacherCode,
            datesPresent: [currentDate],
          }],
        });
      } else {
        const studentData = studentDoc.data();
        // Ensure classes is an array, default to empty if undefined or invalid
        const classes = Array.isArray(studentData.classes) ? studentData.classes : [];
        console.log('Student classes:', classes); // Debug log

        const classIndex = classes.findIndex(
          (cls) => cls.classCode === classCode && cls.teacherCode === teacherCode
        );

        if (classIndex >= 0) {
          // Class exists, update datesPresent
          const datesPresent = Array.isArray(classes[classIndex].datesPresent)
            ? classes[classIndex].datesPresent
            : [];
          if (
            datesPresent.some(
              (d) => d.toDate().toDateString() === currentDate.toDate().toDateString()
            )
          ) {
            throw new Error('Attendance already recorded for this date in student record');
          }
          transaction.update(studentAttendanceRef, {
            [`classes.${classIndex}.datesPresent`]: firestore.FieldValue.arrayUnion(currentDate),
          });
        } else {
          // New class for this student
          transaction.update(studentAttendanceRef, {
            classes: firestore.FieldValue.arrayUnion({
              classCode,
              teacherCode,
              datesPresent: [currentDate],
            }),
          });
        }
      }

      // 2. Update teacher_attendance
      if (!teacherDoc.exists) {
        // First attendance for this class
        transaction.set(teacherAttendanceRef, {
          classCode,
          teacherCode,
          classes: [{
            date: currentDate,
            present: [studentEmail],
          }],
        });
      } else {
        const teacherData = teacherDoc.data();
        // Ensure classes is an array, default to empty if undefined or invalid
        const classes = Array.isArray(teacherData.classes) ? teacherData.classes : [];
        console.log('Teacher classes:', classes); // Debug log

        const classIndex = classes.findIndex(
          (cls) => cls.date.toDate().toDateString() === currentDate.toDate().toDateString()
        );

        if (classIndex >= 0) {
          // Date exists, update present array
          const present = Array.isArray(classes[classIndex].present)
            ? classes[classIndex].present
            : [];
          if (present.includes(studentEmail)) {
            throw new Error('Student already marked present for this date in teacher record');
          }
          transaction.update(teacherAttendanceRef, {
            [`classes.${classIndex}.date`]: currentDate,
            [`classes.${classIndex}.present`]: firestore.FieldValue.arrayUnion(studentEmail),
          });
        } else {
          // New date for this class
          transaction.update(teacherAttendanceRef, {
            classes: firestore.FieldValue.arrayUnion({
              date: currentDate,
              present: [studentEmail],
            }),
          });
        }
      }
    });

    console.log('Attendance recorded successfully for', studentEmail, 'in class', classCode);
    return true;
  } catch (error) {
    console.error('Error recording student attendance:', error.message);
    throw error;
  }
};

export const teacherCancelsAttendance = async (teacherCode, classCode, studentEmail) => {
  try {
    // Create document IDs
    const studentKey = studentEmail.replace(/[@.]/g, '_');
    const classKey = `${classCode}_${teacherCode}`;

    // Get current date (server time)
    const currentDate = firestore.Timestamp.now();

    // Get references to both documents
    const studentAttendanceRef = firestore().collection('student_attendance').doc(studentKey);
    const teacherAttendanceRef = firestore().collection('teacher_attendance').doc(classKey);

    await firestore().runTransaction(async (transaction) => {
      // 1. Update student_attendance document
      const studentDoc = await transaction.get(studentAttendanceRef);

      if (!studentDoc.exists) {
        throw new Error('Student attendance record not found');
      }

      const studentData = studentDoc.data();
      const classes = studentData.classes || [];

      const classIndex = classes.findIndex(
        (cls) => cls.classCode === classCode && cls.teacherCode === teacherCode
      );

      if (classIndex === -1) {
        throw new Error('Class record not found for this student');
      }

      const existingClass = classes[classIndex];
      const datesPresent = existingClass.datesPresent || [];

      // Match date by day only (ignore time)
      const dateIndex = datesPresent.findIndex(
        (date) => date.toDate().toDateString() === currentDate.toDate().toDateString()
      );
      if (dateIndex === -1) {
        throw new Error('Attendance not found for the specified date');
      }

      const updatedDates = datesPresent.filter(
        (date) => date.toDate().toDateString() !== currentDate.toDate().toDateString()
      );

      if (updatedDates.length === 0) {
        transaction.update(studentAttendanceRef, {
          classes: firestore.FieldValue.arrayRemove(classes[classIndex]),
        });
      } else {
        transaction.update(studentAttendanceRef, {
          [`classes.${classIndex}.datesPresent`]: updatedDates,
        });
      }

      // 2. Update teacher_attendance document
      const teacherDoc = await transaction.get(teacherAttendanceRef);

      if (!teacherDoc.exists) {
        throw new Error('Teacher attendance record not found');
      }

      const teacherData = teacherDoc.data();
      const teacherClasses = teacherData.classes || [];

      // Match date by day only (ignore time)
      const teacherClassIndex = teacherClasses.findIndex(
        (cls) => cls.date.toDate().toDateString() === currentDate.toDate().toDateString()
      );

      if (teacherClassIndex === -1) {
        throw new Error('Class date record not found in teacher attendance');
      }

      const teacherClass = teacherClasses[teacherClassIndex];
      const presentStudents = teacherClass.present || [];

      if (!presentStudents.includes(studentEmail)) {
        throw new Error('Student not marked as present in teacher record');
      }

      transaction.update(teacherAttendanceRef, {
        [`classes.${teacherClassIndex}.present`]: firestore.FieldValue.arrayRemove(studentEmail),
      });

      // Remove the entire date record if no students left
      if (presentStudents.length === 1) {
        transaction.update(teacherAttendanceRef, {
          classes: firestore.FieldValue.arrayRemove(teacherClass),
        });
      }
    });

    console.log('Attendance cancelled successfully');
    return true;
  } catch (error) {
    console.error('Error cancelling attendance:', error.message);
    throw error;
  }
};


export const upsertTeacherAttendance = async (classCode, teacherCode) => {
  try {
    // References to both collections
    const teacherAttendanceRef = firestore()
      .collection('teacher_attendance')
      .doc(`${classCode}_${teacherCode}`);
    const classesRef = firestore()
      .collection('classes')
      .doc(`${classCode}_${teacherCode}`);

    // Use server timestamp for consistency
    const currentDate = firestore.Timestamp.now();

    await firestore().runTransaction(async (transaction) => {
      // Fetch both documents
      const teacherDoc = await transaction.get(teacherAttendanceRef);
      const classesDoc = await transaction.get(classesRef);

      // 1. Update teacher_attendance
      const newClass = {
        date: currentDate,
        present: [],
      };

      if (!teacherDoc.exists) {
        // First class ever for this teacher-class combo
        transaction.set(teacherAttendanceRef, {
          teacherCode,
          classCode,
          classes: [newClass],
        });
      } else {
        const teacherData = teacherDoc.data();
        const classes = teacherData.classes || [];
        // Check for duplicate date
        if (classes.some((cls) => cls.date.toDate().toDateString() === currentDate.toDate().toDateString())) {
          console.log('Class already recorded for this date in teacher_attendance');
        }
        transaction.update(teacherAttendanceRef, {
          classes: firestore.FieldValue.arrayUnion(newClass),
        });
      }

      // 2. Update classes
      if (!classesDoc.exists) {
        // First class instance
        transaction.set(classesRef, {
          classCode,
          teacherCode,
          dates: [currentDate],
          students: [], // Ensure schema consistency
        });
      } else {
        const classesData = classesDoc.data();
        const dates = classesData.dates || [];
        // Check for duplicate date
        if (dates.some((d) => d.toDate().toDateString() === currentDate.toDate().toDateString())) {
          throw new Error('Class already recorded for this date in classes');
        }
        transaction.update(classesRef, {
          dates: firestore.FieldValue.arrayUnion(currentDate),
        });
      }
    });

    console.log('Teacher attendance and class record updated successfully');
    return true; // Consistent return value
  } catch (error) {
    console.error('Error upserting teacher attendance:', error.message);
    throw error;
  }
};

export const getAttendanceTeacherCurrentDate = async (teacherCode, classCode) => {
  try {
    // Validate inputs
    if (!teacherCode || typeof teacherCode !== 'string') {
      throw new Error('teacherCode is required and must be a string');
    }
    if (!classCode || typeof classCode !== 'string') {
      throw new Error('classCode is required and must be a string');
    }

    const docRef = firestore()
      .collection('teacher_attendance')
      .doc(`${classCode}_${teacherCode}`);

    // Fetch the document
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      console.log(`No attendance record found for ${classCode}_${teacherCode}`);
      return [];
    }

    const data = docSnapshot.data();

    // Check for valid classes array
    if (!Array.isArray(data.classes)) {
      console.warn(`Invalid or missing classes array for ${classCode}_${teacherCode}`);
      return [];
    }

    // Use server-aligned current date
    const currentDate = firestore.Timestamp.now();

    // Find today's class (match by day, ignoring time)
    const todaysClass = data.classes.find(
      (cls) => cls.date && cls.date.toDate().toDateString() === currentDate.toDate().toDateString()
    );

    if (!todaysClass) {
      console.log(`No attendance record for today in ${classCode}_${teacherCode}`);
      return [];
    }

    console.log(`Attendance fetched for ${classCode}_${teacherCode} on current date`);
    return todaysClass.present || [];
  } catch (error) {
    console.error('Error fetching teacher attendance:', error.message);
    throw error;
  }
};

export const upsertClassesTeacher = async (teacherCode, classCode) => {
  try {
    // Validate inputs
    if (!teacherCode || typeof teacherCode !== 'string' || teacherCode.trim() === '') {
      throw new Error('teacherCode is required and must be a non-empty string');
    }
    if (!classCode || typeof classCode !== 'string' || classCode.trim() === '') {
      throw new Error('classCode is required and must be a non-empty string');
    }

    const classesRef = firestore().collection('classes').doc(`${classCode}_${teacherCode}`);

    // Use a transaction for consistency
    let result;
    await firestore().runTransaction(async (transaction) => {
      const docSnapshot = await transaction.get(classesRef);

      if (docSnapshot.exists) {
        const existingData = docSnapshot.data();
        // Optional: Verify consistency of existing data
        if (existingData.teacherCode !== teacherCode || existingData.classCode !== classCode) {
          console.warn(`Existing class data mismatch for ${classCode}_${teacherCode}`);
        }
        result = existingData;
      } else {
        const record = {
          teacherCode,
          classCode,
          students: [], // Could accept initial students as an optional param if needed
          dates: [],    // Could accept initial dates if needed
        };
        transaction.set(classesRef, record);
        result = record;
      }
    });

    console.log(`Class record upserted successfully for ${classCode}_${teacherCode}`);
    return result; // Consistent return of data
  } catch (error) {
    console.error('Error upserting class record:', error.message);
    throw error;
  }
};

export const addStudentToClass = async (classCode, teacherCode, studentEmail) => {
  try {
    // Validate inputs
    if (!classCode || !teacherCode || !studentEmail) {
      throw new Error('classCode, teacherCode, and studentEmail are required');
    }

    const classesRef = firestore().collection('classes').doc(`${classCode}_${teacherCode}`);

    // Use a transaction to ensure consistency
    await firestore().runTransaction(async (transaction) => {
      const docSnapshot = await transaction.get(classesRef);

      // Check if the document exists
      if (!docSnapshot.exists) {
        throw new Error(`Class ${classCode} with teacher ${teacherCode} does not exist`);
      }

      const classData = docSnapshot.data();
      const students = classData.students || [];

      // Check if student is already enrolled
      if (students.includes(studentEmail)) {
        console.log(`Student ${studentEmail} is already enrolled in ${classCode}`);
        return; // No update needed
      }

      // Add student to the array
      transaction.update(classesRef, {
        students: firestore.FieldValue.arrayUnion(studentEmail),
      });
    });

    console.log(`Student ${studentEmail} added to class ${classCode} successfully`);
    return true; // Consistent success indicator
  } catch (error) {
    console.error('Error adding student to class:', error.message);
    throw error;
  }
};

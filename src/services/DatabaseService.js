import firestore from '@react-native-firebase/firestore';

export const createUser = async user => {
  try {
    const emailKey = user.email.replace(/[@.]/g, '_');
    const userRef = firestore().collection('users').doc(`${emailKey}`);
    await userRef.set(user, {merge: true});
    console.log('user created successfully');
    return userRef;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getUser = async email => {
  const emailKey = email.replace(/[@.]/g, '_');
  const doc = await firestore().collection('users').doc(emailKey).get();
  return doc.exists ? doc.data() : null;
};

export const getTeacher = async teacherAbbr => {
  try {
    const snapshot = await firestore()
      .collection('users')
      .where('facultyAbbreviation', '==', teacherAbbr)
      .limit(1)
      .get();

    const teacherData = snapshot.docs[0].data();
    return teacherData.email;
  } catch (error) {
    console.error('Error getting teacher:', error);
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

export const putAttendance = async (teacherCode, classCode, studentEmail) => {
  try {
    // Create document IDs
    const studentEmailKey = studentEmail.replace(/[@.]/g, '_');
    const teacherAttendanceDocId = `${classCode}_${teacherCode}`;

    // Get current date in format "29/March/2025"
    const currentDate = getLocalDateString();

    // Get references to both documents
    const studentRef = firestore()
      .collection('student_attendance')
      .doc(studentEmailKey);
    const teacherRef = firestore()
      .collection('teacher_attendance')
      .doc(teacherAttendanceDocId);

    // Use a transaction to update both documents atomically
    await firestore().runTransaction(async transaction => {
      // 1. Update student_attendance document
      const studentDoc = await transaction.get(studentRef);

      if (!studentDoc.exists) {
        // Create new student document
        transaction.set(studentRef, {
          studentEmail: studentEmail,
          classes: [
            {
              classCode: classCode,
              teacherCode: teacherCode,
              datesPresent: [currentDate],
            },
          ],
        });
      } else {
        // Update existing student document
        const studentData = studentDoc.data();
        const classes = studentData.classes || [];

        const classIndex = classes.findIndex(
          cls => cls.classCode === classCode && cls.teacherCode === teacherCode,
        );

        if (classIndex >= 0) {
          // Update existing class record
          const existingClass = classes[classIndex];
          const updatedDates = Array.from(
            new Set([...(existingClass.datesPresent || []), currentDate]),
          );

          transaction.update(studentRef, {
            [`classes.${classIndex}.datesPresent`]: updatedDates,
          });
        } else {
          // Add new class record
          transaction.update(studentRef, {
            classes: firestore.FieldValue.arrayUnion({
              classCode: classCode,
              teacherCode: teacherCode,
              datesPresent: [currentDate],
            }),
          });
        }
      }

      // 2. Update teacher_attendance document
      const teacherDoc = await transaction.get(teacherRef);

      // Update existing teacher document
      const teacherData = teacherDoc.data();
      const classes = teacherData.classes || [];

      // Find the class record for today's date
      const classIndex = classes.findIndex(cls => cls.date === currentDate);

      if (classIndex >= 0) {
        // Update existing date record
        transaction.update(teacherRef, {
          [`classes.${classIndex}.present`]:
            firestore.FieldValue.arrayUnion(studentEmail),
          [`classes.${classIndex}.date`]: currentDate,
        });
      }
    });

    console.log(
      'Attendance recorded successfully in both student and teacher records!',
    );
    return true;
  } catch (error) {
    console.error('Error putting attendance:', error);
    throw error;
  }
};

export const cancelAttendance = async (
  teacherCode,
  classCode,
  studentEmail,
) => {
  try {
    // Create document IDs
    const studentEmailKey = studentEmail.replace(/[@.]/g, '_');
    const teacherAttendanceDocId = `${classCode}_${teacherCode}`;

    // Get current date
    const currentDate = getLocalDateString();

    // Get references to both documents
    const studentRef = firestore()
      .collection('student_attendance')
      .doc(studentEmailKey);
    const teacherRef = firestore()
      .collection('teacher_attendance')
      .doc(teacherAttendanceDocId);

    await firestore().runTransaction(async transaction => {
      // 1. Update student_attendance document
      const studentDoc = await transaction.get(studentRef);

      if (!studentDoc.exists) {
        throw new Error('Student attendance record not found');
      }

      const studentData = studentDoc.data();
      const classes = studentData.classes || [];

      const classIndex = classes.findIndex(
        cls => cls.classCode === classCode && cls.teacherCode === teacherCode,
      );

      if (classIndex === -1) {
        throw new Error('Class record not found for this student');
      }

      const existingClass = classes[classIndex];
      const datesPresent = existingClass.datesPresent || [];

      const dateIndex = datesPresent.indexOf(currentDate);
      if (dateIndex === -1) {
        throw new Error('Attendance not found for the specified date');
      }

      const updatedDates = datesPresent.filter(date => date !== currentDate);

      if (updatedDates.length === 0) {
        transaction.update(studentRef, {
          classes: firestore.FieldValue.arrayRemove(classes[classIndex]),
        });
      } else {
        transaction.update(studentRef, {
          [`classes.${classIndex}.datesPresent`]: updatedDates,
        });
      }

      // 2. Update teacher_attendance document
      const teacherDoc = await transaction.get(teacherRef);

      if (!teacherDoc.exists) {
        throw new Error('Teacher attendance record not found');
      }

      const teacherData = teacherDoc.data();
      let index = 0;
      for (let i = 0; i < teacherData.length; i++) {
        if (teacherData[i].date === currentDate) break;
        index++;
      }
      const teacherClasses = teacherData.classes;
      const teacherClassIndex = index;

      if (teacherClassIndex === -1) {
        throw new Error('Class date record not found in teacher attendance');
      }

      const teacherClass = teacherClasses[teacherClassIndex];
      const presentStudents = teacherClass.present || [];

      if (!presentStudents.includes(studentEmail)) {
        throw new Error('Student not marked as present in teacher record');
      }

      transaction.update(teacherRef, {
        [`classes.${teacherClassIndex}.present`]:
          firestore.FieldValue.arrayRemove(studentEmail),
      });

      // Remove the entire date record if no students left
      if (presentStudents.length === 1) {
        transaction.update(teacherRef, {
          classes: firestore.FieldValue.arrayRemove(teacherClass),
        });
      }
    });

    console.log('Attendance cancelled successfully');
    return true;
  } catch (error) {
    console.error('Error cancelling attendance:', error);
    throw error;
  }
};

export const upsertTeacherAttendance = async (classCode, teacherCode) => {
  try {
    const teacherAttendanceRef = firestore()
      .collection('teacher_attendance')
      .doc(`${classCode}_${teacherCode}`);
    const classesRef = firestore()
      .collection('classes')
      .doc(`${classCode}_${teacherCode}`);
    const currentDate = getLocalDateString();

    await firestore().runTransaction(async transaction => {
      // 1. Get teacher attendance document
      const docSnapshot = await transaction.get(teacherAttendanceRef);

      // 2. Prepare the new class record
      const newClass = {
        date: currentDate,
        present: [],
      };

      if (docSnapshot.exists) {
        // Update existing document
        transaction.update(teacherAttendanceRef, {
          classes: firestore.FieldValue.arrayUnion(newClass),
        });
      } else {
        // Create new document
        transaction.set(teacherAttendanceRef, {
          teacherCode: teacherCode,
          classCode: classCode,
          classes: [newClass],
        });
      }

      // 3. Update the classes document
      const classesSnapshot = await transaction.get(classesRef);
      if (classesSnapshot.exists) {
        transaction.update(classesRef, {
          dates: firestore.FieldValue.arrayUnion(currentDate),
        });
      } else {
        transaction.set(classesRef, {
          dates: [currentDate],
          classCode: classCode,
          teacherCode: teacherCode,
        });
      }
    });

    console.log('Successfully updated attendance records');
    return teacherAttendanceRef;
  } catch (error) {
    console.error('Error managing attendance record:', error);
    throw error;
  }
};

export const getAttendanceTeacher = async (teacherCode, classCode) => {
  try {
    console.log(`Fetching attendance for: ${classCode}_${teacherCode}`);

    const docRef = firestore()
      .collection('teacher_attendance')
      .doc(`${classCode}_${teacherCode}`);

    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      console.log('No attendance record found');
      return [];
    }

    const data = docSnapshot.data();
    console.log('Document data:', data);

    const currentDate = getLocalDateString();

    // Handle object-style classes (with numeric keys)
    if (!data.classes || typeof data.classes !== 'object') {
      console.log('Classes not found or invalid format');
      return [];
    }

    // Convert classes object to array and find today's class
    const classesArray = Object.values(data.classes);
    const todaysClass = classesArray.find(cls => cls.date === currentDate);

    if (!todaysClass) {
      console.log(`No attendance record for today (${currentDate})`);
      return [];
    }

    return todaysClass.present || [];
  } catch (error) {
    console.error('Error fetching attendance record:', error);
    throw error;
  }
};

export const upsertClassesTeacher = async (teacherCode, classCode) => {
  try {
    const attendanceRef = firestore()
      .collection('classes')
      .doc(`${classCode}_${teacherCode}`);
    const docSnapshot = await attendanceRef.get();

    if (docSnapshot.exists) {
      return (await attendanceRef.get()).data();
    } else {
      // Document doesn't exist - create new record
      const record = {
        teacherCode: teacherCode,
        classCode: classCode,
        students: [],
        dates: [],
      };

      await attendanceRef.set(record);
      console.log('Created new class record:', record);
      return attendanceRef;
    }
  } catch (error) {
    console.error('Error creating classes document:', error);
    throw error;
  }
};

export const addStudentToClass = async (
  classCode,
  teacherCode,
  studentEmail,
) => {
  try {
    const classesRef = firestore()
      .collection('classes')
      .doc(`${classCode}_${teacherCode}`);
    if (classesRef === null) {
      console.log('No classes found for this');
      return null;
    }
    await classesRef.update({
      students: firestore.FieldValue.arrayUnion(studentEmail),
    });
    console.log('Student added to class successfully!');
    return classesRef;
  } catch (error) {
    console.error('Error adding student to class:', error);
    throw error;
  }
};

function getLocalDateString() {
  const now = new Date();

  // Date parts
  const day = now.getDate();
  const month = now.toLocaleString('default', {month: 'long'});
  const year = now.getFullYear();

  return `${day}/${month}/${year}`;
}

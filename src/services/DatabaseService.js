import firestore from '@react-native-firebase/firestore';

export const createUser = async (user) => {
    try{
        const emailKey = user.email.replace(/[@.]/g, '_');
        const userRef = firestore().collection('users').doc(`${emailKey}`);
        await userRef.set(user, { merge: true });
        console.log('user created successfully');
        return userRef;
    }catch(error){
        console.error('Error creating user:', error);
        throw error;
    }
};

export const getUser = async (email) => {
    const emailKey = email.replace(/[@.]/g, '_');
    const doc = await firestore().collection('users').doc(emailKey).get();
    return doc.exists ? doc.data() : null;
};

export const getTeacher = async (teacherAbbr) => {
    try{
        const snapshot = await firestore().collection('users').where('facultyAbbreviation', '==', teacherAbbr).limit(1).get();

        const teacherData = snapshot.docs[0].data();
        return teacherData.email;
    }catch(error){
        console.error('Error getting teacher:', error);
        throw error;
    }
};

export const updateUser = async (user) => {
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

export const putAttendance = async (teacherAbbr, classCode, studentEmail) => {
    try {
        const emailKey = studentEmail.replace(/[@.]/g, '_');
        // 1. Get the document reference directly using your ID format
        const docRef = firestore()
            .collection('users')
            .doc(emailKey);

        // 2. Get the document snapshot
        const docSnapshot = await docRef.get();

        if (docSnapshot.exists) {
            throw new Error('Attendance session not found');
        }

        // 3. Update present array using arrayUnion to prevent duplicates
        await docRef.update({
            present: firestore.FieldValue.arrayUnion(studentEmail),
        });

        console.log('Attendance recorded successfully!');
        return true;

    } catch (error) {
        console.error('Error putting attendance:', error);
        throw error;
    }
};

export const createTeacherAttendance = async (teacherEmail, classCode, teacherAbbr) => {
    try {
        const emailKey = teacherEmail.replace(/[@.]/g, '_');
        const attendanceRef = firestore().collection('teacher_attendance').doc(emailKey);
        const docSnapshot = await attendanceRef.get();

        if (docSnapshot.exists) {
            const newClass = {
                date: getLocalDateString(),
                present: [],
            };

            await attendanceRef.update({
                classes: firestore.FieldValue.arrayUnion(newClass),
            });

            console.log('Added new class to existing attendance record:', newClass);
            return attendanceRef;
        } else {
            // Document doesn't exist - create new record
            const record = {
                teacherAbbr,
                classCode: classCode,
                classes: [{
                    date: getLocalDateString(),
                    present: [],
                    absent: [],
                }],
            };

            await attendanceRef.set(record);
            console.log('Created new attendance record:', record);
            return attendanceRef;
        }
    } catch(error) {
        console.error('Error managing attendance record:', error);
        throw error;
    }
};

export const getAttendanceTeacher = async (facultyAbbreviation, classCode, random3DigitNumber) => {
    try {
        console.log(`${facultyAbbreviation}_${classCode}_${random3DigitNumber}`);

        const docSnapshot = await firestore()
            .collection('attendance')
            .doc(`${facultyAbbreviation}_${classCode}_${random3DigitNumber}`)
            .get();

        if (!docSnapshot.exists) {
            console.log('No attendance record found');
            return null;
        }
        console.log(docSnapshot.data());
        return docSnapshot.data();

    } catch (error) {
        console.error('Error fetching attendance record:', error);
        throw error;
    }
};

function getLocalDateString() {
    const now = new Date();

    // Date parts
    const day = now.getDate();
    const month = now.toLocaleString('default', { month: 'long' });
    const year = now.getFullYear();

    return `${day}/${month}/${year}`;
  }

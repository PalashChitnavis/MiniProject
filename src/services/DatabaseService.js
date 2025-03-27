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

export const putAttendance = async (teacherAbbr, classCode, studentEmail, random3DigitNumber) => {
    try {
        // 1. Get the document reference directly using your ID format
        const docRef = firestore()
            .collection('attendance')
            .doc(`${teacherAbbr}_${classCode}_${random3DigitNumber}`);

        // 2. Get the document snapshot
        const docSnapshot = await docRef.get();

        if (!docSnapshot.exists) {
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

export const createAttendance = async (teacherEmail, classCode, random3DigitNumber, facultyAbbreviation) => {
    try{
        const attendanceRef = firestore().collection('attendance').doc(`${facultyAbbreviation}_${classCode}_${random3DigitNumber}`);

        console.log(`${facultyAbbreviation}_${classCode}_${random3DigitNumber}`);

        const record = {
            date: getLocalDateTimeString(),
            teacherEmail: teacherEmail,
            classCode: classCode,
            present: [],
        };

        await attendanceRef.set(record);
        console.log('Attendance recorded created successfully!');
        return attendanceRef;
    }catch(error){
        console.error('Error creating attendance record:', error);
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
        return {
            ...docSnapshot.data(),
        };

    } catch (error) {
        console.error('Error fetching attendance record:', error);
        throw error;
    }
};

function getLocalDateTimeString() {
    const now = new Date();

    // Time parts
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const twelveHour = hours % 12 || 12;
    const formattedTime = `${twelveHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;

    // Date parts
    const day = now.getDate();
    const month = now.toLocaleString('default', { month: 'long' });
    const year = now.getFullYear();

    return `${formattedTime} ${day} ${month} ${year}`;
  }

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

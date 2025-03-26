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

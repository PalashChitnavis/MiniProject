import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import emailjs from 'emailjs-com';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [timer, setTimer] = useState(0);

  // Function to generate a 4-digit OTP
  const generateOtp = () => {
    return Math.floor(10000 + Math.random() * 90000).toString(); // 5-digit OTP
};

  // Function to send OTP via email
  const sendOtp = () => {
    if (!email.endsWith('@iiitm.ac.in')) {
      Alert.alert('Invalid Email', 'Please use College Email (@iiitm.ac.in)');
      return;
    }

    if (!otpSent) {
      const newOtp = generateOtp();
      setGeneratedOtp(newOtp);
    }

    setOtpSent(true);
    setIsButtonDisabled(true);
    setTimer(60); // Start 60 seconds countdown

    // Send OTP via EmailJS
    emailjs.send(
        'service_7dn740d', // Replace with your EmailJS service ID
        'template_7zao56l', // Replace with your EmailJS template ID
        { to_email: email, otp: generatedOtp || generateOtp() },
        'keEZF8JBGaM3MB6v4' // Replace with your EmailJS public key
      ).then(() => {
        Alert.alert('OTP Sent', 'Check your email for the OTP.');
      }).catch((error) => {
        console.error('Error sending OTP:', error);
        Alert.alert('Error', 'Failed to send OTP.');
      });
  };

  // Countdown Timer Effect
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setIsButtonDisabled(false); // Enable button after countdown
    }
  }, [timer]);

  // Function to verify OTP
  const verifyOtp = () => {
    if (otp === generatedOtp) {
      console.log('Success');
      Alert.alert('Success', 'Login successful!');
    } else {
      Alert.alert('Invalid OTP', 'Please enter the correct OTP.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter email ID"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <Button
        title={otpSent ? `Resend OTP (${timer}s)` : 'Send OTP'}
        onPress={sendOtp}
        disabled={isButtonDisabled}
      />

      {otpSent && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter OTP"
            keyboardType="numeric"
            value={otp}
            onChangeText={setOtp}
          />
          <Button title="Verify OTP" onPress={verifyOtp} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f4f4f4',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '80%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
});

export default LoginScreen;

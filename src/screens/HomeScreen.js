import React from 'react';
import { View, StyleSheet } from 'react-native';
import ButtonComponent from '../components/ButtonComponent';

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <ButtonComponent title="Teacher" onPress={() => navigation.navigate('Teacher')} />
      <ButtonComponent title="Student" onPress={() => navigation.navigate('Student')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
  },
});

export default HomeScreen;

import React, {useState} from 'react';
import {View, Text, StyleSheet, Alert} from 'react-native';
import ButtonComponent from '../components/ButtonComponent';
import TeacherAttendanceFormInput from '../components/TeacherAttendanceFormInput';
import {Picker} from '@react-native-picker/picker';

const TeacherAttendanceSetup = ({navigation}) => {
  const [course, setCourse] = useState('');
  const [batch, setBatch] = useState('');
  const [teacher, setTeacher] = useState('');
  const [classSize, setClassSize] = useState('small');
  const [formError, setFormError] = useState(false);

  const handleSubmit = () => {
    if (!course || !batch || !teacher) {
      setFormError(true);
      return;
    }

    navigation.navigate('TeacherBluetoothScanScreen', {
      course,
      batch,
      teacher,
      classSize,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Setup Attendance Session</Text>

      <TeacherAttendanceFormInput
        label="Course Name"
        value={course}
        onChangeText={setCourse}
        placeholder="Enter course name"
      />

      <TeacherAttendanceFormInput
        label="Batch Name"
        value={batch}
        onChangeText={setBatch}
        placeholder="Enter batch name"
      />

      <TeacherAttendanceFormInput
        label="Teacher Name"
        value={teacher}
        onChangeText={setTeacher}
        placeholder="Enter teacher name"
      />

      <Text style={styles.label}>Class Size</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={classSize}
          onValueChange={setClassSize}
          style={styles.picker}>
          <Picker.Item label="Small (1-30)" value="small" />
          <Picker.Item label="Medium (31-60)" value="medium" />
          <Picker.Item label="Large (61+)" value="large" />
        </Picker>
      </View>

      {formError && (
        <Text style={styles.errorText}>Please fill all fields</Text>
      )}

      <ButtonComponent
        title="Start Attendance Session"
        onPress={handleSubmit}
        color="#4CAF50"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    marginLeft: 10,
    color: '#555',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: 'white',
  },
  picker: {
    height: 50,
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
});

export default TeacherAttendanceSetup;

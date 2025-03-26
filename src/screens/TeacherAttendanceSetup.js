import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ButtonComponent from '../components/ButtonComponent';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const TeacherAttendanceSetup = ({ navigation }) => {
  const { user } = useAuth();
  const [attendanceObject, setAttendanceObject] = useState({
    selectedClass: '',
    classSize: 'small',
  });
  const [formError, setFormError] = useState(false);
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const classes = user.classes || [];

  const handleSubmit = () => {
    if (!attendanceObject.selectedClass) {
      setFormError(true);
      return;
    }

    const data = {
      className: attendanceObject.selectedClass,
      teacher: user.facultyAbbreviation,
      classSize: attendanceObject.classSize === 'small' ? 'S' : attendanceObject.classSize === 'medium' ? 'M' : 'L',
    };

    console.log(data);

    navigation.navigate('TeacherBluetoothScanScreen', {
      data: data,
    });
  };

  const togglePicker = () => {
    setIsPickerVisible(!isPickerVisible);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Setup Attendance Session</Text>
        <Text style={styles.subHeader}>Select class and expected size</Text>
      </View>

      <View style={styles.formContainer}>
        {/* Class Selection */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Select Class</Text>
          <TouchableOpacity
            style={styles.selectionBox}
            onPress={togglePicker}
          >
            <Text style={[
              styles.selectionText,
              !attendanceObject.selectedClass && styles.placeholderText,
            ]}>
              {attendanceObject.selectedClass || 'Select a class'}
            </Text>
            <Icon
              name={isPickerVisible ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={24}
              color="#666"
            />
          </TouchableOpacity>

          {isPickerVisible && (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={attendanceObject.selectedClass}
                onValueChange={(itemValue) => {
                  setAttendanceObject(prev => ({
                    ...prev,
                    selectedClass: itemValue,
                  }));
                  setFormError(false);
                  togglePicker();
                }}
                style={styles.picker}
              >
                <Picker.Item label="Select a class" value="" />
                {classes.map((cls, index) => (
                  <Picker.Item
                    key={`${cls.classCode}-${index}`}
                    label={`${cls.className} (${cls.classCode})`}
                    value={cls.classCode}
                  />
                ))}
              </Picker>
            </View>
          )}
        </View>

        {/* Class Size Selection */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Expected Class Size</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={attendanceObject.classSize}
              onValueChange={(itemValue) => {
                setAttendanceObject(prev => ({
                  ...prev,
                  classSize: itemValue,
                }));
              }}
              style={styles.picker}
            >
              <Picker.Item label="Small (1-30 students)" value="small" />
              <Picker.Item label="Medium (31-60 students)" value="medium" />
              <Picker.Item label="Large (61+ students)" value="large" />
            </Picker>
          </View>
        </View>

        {formError && (
          <Text style={styles.errorText}>
            Please select a class to continue
          </Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <ButtonComponent
          title="Start Attendance Session"
          onPress={handleSubmit}
          color="#4a6da7"
          icon="play-circle-filled"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
  },
  headerContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 5,
  },
  subHeader: {
    fontSize: 14,
    color: '#64748b',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  inputContainer: {
    marginBottom: 25,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
    color: '#334155',
    paddingLeft: 5,
  },
  selectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 15,
    backgroundColor: 'white',
  },
  selectionText: {
    fontSize: 16,
    color: '#1e293b',
  },
  placeholderText: {
    color: '#94a3b8',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#1e293b',
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
  },
  buttonContainer: {
    paddingBottom: 30,
    paddingHorizontal: 10,
  },
});

export default TeacherAttendanceSetup;

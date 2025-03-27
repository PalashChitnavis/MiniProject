import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import ButtonComponent from '../components/ButtonComponent';
import {Picker} from '@react-native-picker/picker';
import {useAuth} from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const TeacherAttendanceSetup = ({navigation}) => {
  const {user} = useAuth();
  const classes = user.classes || [];
  const [attendanceObject, setAttendanceObject] = useState({
    selectedClass: classes[0].classCode ? classes[0].classCode : '',
    classSize: 'small',
  });
  const [formError, setFormError] = useState(false);
  const [isPickerVisible, setIsPickerVisible] = useState(false);


  const handleSubmit = () => {
    if (!attendanceObject.selectedClass) {
      setFormError(true);
      return;
    }

    const data = {
      className: attendanceObject.selectedClass,
      teacher: user.facultyAbbreviation,
      classSize:
        attendanceObject.classSize === 'small'
          ? 'S'
          : attendanceObject.classSize === 'medium'
          ? 'M'
          : 'L',
    };

    console.log(data);

    navigation.navigate('TeacherBluetoothScanScreen', {
      data: data,
    });
  };

  const getSelectedClassLabel = () => {
    if (!attendanceObject.selectedClass) return `${classes[0].className}`;

    const selectedClass = classes.find(
      cls => cls.classCode === attendanceObject.selectedClass,
    );

    return selectedClass
      ? `${selectedClass.className} (${selectedClass.classCode})`
      : `${classes[0].className} ${classes[0].classCode}`;
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
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={attendanceObject.selectedClass}
              onValueChange={itemValue => {
                setAttendanceObject(prev => ({
                  ...prev,
                  selectedClass: itemValue,
                }));
                setFormError(false);
              }}
              style={styles.picker}>
              <Picker.Item
                label={`${classes[0].className} (${classes[0].classCode})`}
                value={`${classes[0].classCode}`}
              />
              {classes.map(
                (cls, index) =>
                  index > 0 && (
                    <Picker.Item
                      key={`${cls.classCode}-${index}`}
                      label={`${cls.className} (${cls.classCode})`}
                      value={cls.classCode}
                    />
                  ),
              )}
            </Picker>
          </View>

          {formError && (
            <Text style={styles.errorText}>
              Please select a class to continue
            </Text>
          )}
        </View>

        {/* Class Size Selection */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Expected Class Size</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={attendanceObject.classSize}
              onValueChange={itemValue => {
                setAttendanceObject(prev => ({
                  ...prev,
                  classSize: itemValue,
                }));
              }}
              style={styles.picker}>
              <Picker.Item label="Small (1-30 students)" value="small" />
              <Picker.Item label="Medium (31-60 students)" value="medium" />
              <Picker.Item label="Large (61+ students)" value="large" />
            </Picker>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <ButtonComponent
          style={styles.buttonText}
          title="Start Session"
          width={200}
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
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',

    paddingBottom: 30,
    paddingHorizontal: 10,
  },
  buttonText: {
    width: 200,
  },
});

export default TeacherAttendanceSetup;

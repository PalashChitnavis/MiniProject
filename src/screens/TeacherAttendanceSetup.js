import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import ButtonComponent from '../components/ButtonComponent';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const TeacherAttendanceSetup = ({
  navigation,
}) => {
  const { user } = useAuth();
  const classes = user.classes || [];
  const [
    attendanceObject,
    setAttendanceObject,
  ] = useState({
    selectedClass: classes[0]?.classCode
      ? classes[0].classCode
      : "Please Add Classes in 'Manage Classes'",
    classSize: 'small',
  });
  const [formError, setFormError] =
    useState(false);

  const handleSubmit = () => {
    if (
      !attendanceObject.selectedClass
    ) {
      setFormError(true);
      return;
    }

    const data = {
      classCode:
        attendanceObject.selectedClass,
      teacherCode: user.teacherCode,
      classSize:
        attendanceObject.classSize,
    };

    // console.log(data);

    navigation.navigate(
      'TeacherBluetoothScanScreen',
      {
        data: data,
      },
    );
  };

  return (
    <View style={styles.container}>
      <View
        style={styles.headerContainer}
      >
        <Text style={styles.header}>
          Setup Attendance Session
        </Text>
        <Text style={styles.subHeader}>
          Select class and expected size
        </Text>
      </View>

      <View
        style={styles.formContainer}
      >
        {/* Class Selection */}
        <View
          style={styles.inputContainer}
        >
          <Text style={styles.label}>
            Select Class
          </Text>
          <View
            style={styles.pickerWrapper}
          >
            <View
              style={
                styles.pickerContainer
              }
            >
              <Picker
                selectedValue={
                  attendanceObject.selectedClass
                }
                onValueChange={(
                  itemValue,
                ) => {
                  setAttendanceObject(
                    (prev) => ({
                      ...prev,
                      selectedClass:
                        itemValue,
                    }),
                  );
                  setFormError(false);
                }}
                style={styles.picker}
              >
                {classes.length > 0 ? (
                  classes.map(
                    (cls, index) => (
                      <Picker.Item
                        key={`${cls.classCode}-${index}`}
                        label={`${cls.classCode}`}
                        value={
                          cls.classCode
                        }
                      />
                    ),
                  )
                ) : (
                  <Picker.Item
                    label="No classes available"
                    value=""
                  />
                )}
              </Picker>
            </View>
            <Icon
              name="arrow-drop-down"
              size={24}
              color="#64748b"
              style={
                styles.dropdownIcon
              }
            />
          </View>

          {formError && (
            <Text
              style={styles.errorText}
            >
              Please select a class to
              continue
            </Text>
          )}
        </View>

        {/* Class Size Selection */}
        <View
          style={styles.inputContainer}
        >
          <Text style={styles.label}>
            Expected Class Size
          </Text>
          <View
            style={styles.pickerWrapper}
          >
            <View
              style={
                styles.pickerContainer
              }
            >
              <Picker
                selectedValue={
                  attendanceObject.classSize
                }
                onValueChange={(
                  itemValue,
                ) => {
                  setAttendanceObject(
                    (prev) => ({
                      ...prev,
                      classSize:
                        itemValue,
                    }),
                  );
                }}
                style={styles.picker}
              >
                <Picker.Item
                  label="Small (1-30 students)"
                  value="small"
                />
                <Picker.Item
                  label="Medium (31-60 students)"
                  value="medium"
                />
                <Picker.Item
                  label="Large (61+ students)"
                  value="large"
                />
              </Picker>
            </View>
            <Icon
              name="arrow-drop-down"
              size={24}
              color="#64748b"
              style={
                styles.dropdownIcon
              }
            />
          </View>
        </View>
      </View>

      <View
        style={styles.buttonContainer}
      >
        <ButtonComponent
          style={styles.buttonText}
          title="Start Session"
          width={200}
          onPress={handleSubmit}
          color="#007BFF"
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
  pickerWrapper: {
    position: 'relative',
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
    paddingRight: 30, // Make space for the dropdown icon
  },
  dropdownIcon: {
    position: 'absolute',
    right: 10,
    top: 12,
    pointerEvents: 'none', // Allows clicks to pass through to the Picker
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

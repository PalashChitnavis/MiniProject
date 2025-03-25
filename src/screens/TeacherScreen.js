import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';

const {width} = Dimensions.get('window');
const BUTTON_WIDTH = width * 0.44;
const BUTTON_HEIGHT = 150;

const IMAGES = {
  attendance: require('../assets/images/abv.png'),
  classes: require('../assets/images/abv.png'),
  reports: require('../assets/images/abv.png'),
  logout: require('../assets/images/abv.png'),
};

const TeacherScreen = ({navigation}) => {
  const handleTakeAttendance = () => {
    navigation.navigate('TeacherAttendanceSetup');
  };

  const handleManageClasses = () => console.log('Manage Classes pressed');
  const handleViewReports = () => console.log('View Reports pressed');
  const handleLogout = () => console.log('Logout pressed');

  const SectionButton = ({image, title, onPress, color}) => (
    <TouchableOpacity
      style={[styles.button, {backgroundColor: 'white', borderColor: color}]}
      onPress={onPress}>
      <View style={styles.buttonContent}>
        <Image source={image} style={styles.buttonImage} />
        <Text style={[styles.buttonText, {color}]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Teacher Dashboard</Text>

      <View style={styles.gridContainer}>
        <View style={styles.row}>
          <SectionButton
            image={IMAGES.attendance}
            title="Take Attendance"
            onPress={handleTakeAttendance}
            color="#4CAF50"
          />
          <SectionButton
            image={IMAGES.classes}
            title="Manage Classes"
            onPress={handleManageClasses}
            color="#2196F3"
          />
        </View>

        <View style={styles.row}>
          <SectionButton
            image={IMAGES.reports}
            title="View Reports"
            onPress={handleViewReports}
            color="#FF9800"
          />
          <SectionButton
            image={IMAGES.logout}
            title="Logout"
            onPress={handleLogout}
            color="#F44336"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
    paddingTop: 50,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    borderWidth: 2,
  },
  buttonContent: {
    alignItems: 'center',
    padding: 10,
  },
  buttonImage: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default TeacherScreen;

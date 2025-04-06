// StudentScreen.js
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  SafeAreaView,
} from 'react-native';
import {Calendar} from 'react-native-calendars';
import {useAuth} from '../contexts/AuthContext';
import {
  getStudentAttendanceReport,
  upsertClassesTeacher,
} from '../services/DatabaseService';

const StudentViewReportScreen = () => {
  const {user} = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [classData, setClassData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [activeTab, setActiveTab] = useState('calendar');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get student data first
        const resp = await getStudentAttendanceReport(user.email);
        setStudentData(resp);

        // Then get class data for all classes
        const classes = user.classes || [];
        const classPromises = classes.map(cls =>
          upsertClassesTeacher(cls.teacherCode, cls.classCode),
        );

        const classResponses = await Promise.all(classPromises);
        setClassData(classResponses);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (classData.length > 0) {
      const processedData = processAttendanceData(studentData, classData);
      setAttendanceData(processedData);
      console.log(processedData);
    }
  }, [studentData, classData]);

  const processAttendanceData = (studentData, classData) => {
    // If no student data exists, treat it as if the student hasn't attended any classes
    const studentClasses = studentData?.classes || [];

    // For each class the student is enrolled in (from user.classes)
    return classData.map(classInfo => {
      // Find if student has any attendance record for this class
      const studentClass = studentClasses.find(
        sc => sc.classCode === classInfo.classCode,
      ) || {
        classCode: classInfo.classCode,
        teacherCode: classInfo.teacherCode,
        datesPresent: [],
      };

      // Convert Firestore timestamps to Date objects
      const classDates = classInfo?.dates || [];
      const presentDates = studentClass?.datesPresent || [];

      // Create attendance records (mark all as absent if no student data)
      const attendanceRecords = classDates.map(date => {
        const isPresent = presentDates.some(
          presentDate => presentDate === date,
        );
        return {
          date,
          status: isPresent ? 'Present' : 'Absent',
          statusColor: isPresent ? '#4CAF50' : '#F44336',
        };
      });

      // Calculate attendance percentage
      const totalClasses = classDates.length;
      const attendedClasses = presentDates.length;
      const percentage =
        totalClasses > 0
          ? Math.round((attendedClasses / totalClasses) * 100)
          : 0;

      return {
        classCode: classInfo.classCode,
        teacherCode: classInfo.teacherCode,
        attendanceRecords,
        totalClasses,
        attendedClasses,
        percentage,
      };
    });
  };

  //   useEffect(() => {
  //     console.log(studentData);
  //     console.log(classData);
  //     console.log(attendanceData);
  //   }, [attendanceData]);

  // Sample data (will be replaced with your actual data)
  const classes = [
    {id: '1', name: 'Mathematics', code: 'MATH101', attendance: 85},
    {id: '2', name: 'Computer Science', code: 'CS201', attendance: 92},
    {id: '3', name: 'Physics', code: 'PHYS101', attendance: 78},
    {id: '4', name: 'English Literature', code: 'ENG102', attendance: 88},
    {id: '5', name: 'Chemistry', code: 'CHEM101', attendance: 90},
  ];

  const attendanceDates = {
    present: [
      {date: '2025-03-24', status: 'present'},
      {date: '2025-03-26', status: 'present'},
      {date: '2025-03-31', status: 'present'},
      {date: '2025-04-02', status: 'present'},
    ],
    absent: [
      {date: '2025-03-25', status: 'absent'},
      {date: '2025-03-30', status: 'absent'},
    ],
  };

  //   Prepare marked dates for calendar
  const getMarkedDates = () => {
    const markedDates = {};

    selectedClass?.attendanceRecords.forEach(classItem => {
      // Convert from 'DD/MM/YYYY' to 'YYYY-MM-DD'
      const [day, month, year] = classItem.date.split('/');
      const formattedDate = `${year}-${month}-${day}`;

      markedDates[formattedDate] = {
        selected: true,
        selectedColor: classItem.statusColor,
      };
    });

    console.log('first: ', markedDates);

    return markedDates;
  };

  const renderClassItem = ({item}) => (
    <TouchableOpacity
      style={styles.classCard}
      onPress={() => setSelectedClass(item)}>
      <View style={styles.classCardContent}>
        <View>
          <Text style={styles.className}>{item?.classCode}</Text>
          <Text style={styles.classCode}>{item?.teacherCode}</Text>
        </View>
        <View
          style={[
            styles.attendanceIndicator,
            {backgroundColor: getAttendanceColor(item.percentage)},
          ]}>
          <Text style={styles.attendanceText}>{item.percentage}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getAttendanceColor = percentage => {
    if (percentage >= 90) return '#4CAF50';
    if (percentage >= 80) return '#8BC34A';
    if (percentage >= 75) return '#FFC107';
    return '#F44336';
  };

  const formatDate2 = dateStr => {
    // Split and rearrange date from DD/MM/YYYY to YYYY-MM-DD
    const [day, month, year] = dateStr.split('/');
    const isoDateStr = `${year}-${month}-${day}`;

    // Create Date object and format it
    const date = new Date(isoDateStr);
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    return date.toLocaleDateString('en-US', options);
  };

  const renderAttendanceList = () => {
    return (
      <View style={styles.attendanceListContainer}>
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Present</Text>
          {selectedClass?.attendanceRecords.map(item => {
            if (item.status === 'Present')
              return (
                <View key={item.date} style={styles.dateItem}>
                  <View
                    style={[styles.statusDot, {backgroundColor: '#4CAF50'}]}
                  />
                  <Text style={styles.dateText}>{formatDate2(item.date)}</Text>
                </View>
              );
          })}
        </View>

        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Absent</Text>
          {selectedClass?.attendanceRecords.map(item => {
            if (item.status === 'Absent')
              return (
                <View key={item.date} style={styles.dateItem}>
                  <View
                    style={[styles.statusDot, {backgroundColor: '#F44336'}]}
                  />
                  <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                </View>
              );
          })}
        </View>
      </View>
    );
  };

  const formatDate = dateString => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getOverAllAttendancePercentage = () => {
    let percentage = 0;
    for (let i = 0; i < attendanceData.length; i++) {
      percentage += attendanceData[i].percentage;
    }
    return Math.round(percentage / attendanceData.length);
  };

  return (
    <SafeAreaView style={styles.container}>
      {!selectedClass ? (
        // Classes List Screen
        <>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Classes</Text>
            <View style={styles.overallAttendance}>
              <Text style={styles.overallAttendanceLabel}>
                Overall Attendance
              </Text>
              <Text style={styles.overallAttendanceValue}>
                {getOverAllAttendancePercentage()}%
              </Text>
            </View>
          </View>
          <FlatList
            data={attendanceData}
            renderItem={renderClassItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.classesList}
          />
        </>
      ) : (
        // Class Detail Screen
        <>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedClass(null)}>
              {/* <Text style={styles.backButtonText}>←</Text> */}
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{selectedClass?.classCode}</Text>
            <Text style={styles.classCode}>{selectedClass?.teacherCode}</Text>
            <Text style={styles.classAttendanceValue}>
              {selectedClass.percentage || '-1'}%
            </Text>
          </View>

          <View style={styles.content}>
            {activeTab === 'calendar' ? (
              <View style={styles.calendarContainer}>
                <Calendar
                  markedDates={getMarkedDates()}
                  renderHeader={date => {
                    // Format date to your custom title, e.g., "My Attendance Calendar"
                    const header = 'My Attendance Calendar';
                    return (
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: 'bold',
                          color: '#2d4150',
                        }}>
                        {header}
                      </Text>
                    );
                  }}
                  theme={{
                    backgroundColor: '#ffffff',
                    calendarBackground: '#ffffff',
                    textSectionTitleColor: '#b6c1cd',
                    selectedDayBackgroundColor: '#4CAF50',
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: '#6200ee',
                    dayTextColor: '#2d4150',
                    textDisabledColor: '#d9e1e8',
                    monthTextColor: '#2d4150',
                    indicatorColor: '#6200ee',
                  }}
                />

                <View style={styles.legendContainer}>
                  <View style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, {backgroundColor: '#4CAF50'}]}
                    />
                    <Text style={styles.legendText}>Present</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, {backgroundColor: '#F44336'}]}
                    />
                    <Text style={styles.legendText}>Absent</Text>
                  </View>
                </View>
              </View>
            ) : (
              renderAttendanceList()
            )}
          </View>

          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'calendar' && styles.activeTab]}
              onPress={() => setActiveTab('calendar')}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'calendar' && styles.activeTabText,
                ]}>
                Calendar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'list' && styles.activeTab]}
              onPress={() => setActiveTab('list')}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'list' && styles.activeTabText,
                ]}>
                Attendance Log
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333333',
  },
  overallAttendance: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overallAttendanceLabel: {
    fontSize: 14,
    color: '#757575',
  },
  overallAttendanceValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
  },
  classesList: {
    padding: 16,
  },
  classCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  classCardContent: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  classCode: {
    fontSize: 14,
    color: '#757575',
  },
  attendanceIndicator: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  attendanceText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 24,
    color: '#333333',
  },
  classAttendanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 6,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    padding: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#757575',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6200EE',
  },
  tabText: {
    color: '#757575',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#6200EE',
    fontWeight: '600',
  },
  attendanceListContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  listSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333333',
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  dateText: {
    fontSize: 14,
    color: '#333333',
  },
});

export default StudentViewReportScreen;

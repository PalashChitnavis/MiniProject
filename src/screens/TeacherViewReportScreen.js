// TeacherScreen.js
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {Calendar} from 'react-native-calendars';

const TeacherViewReportScreen = () => {
  const [selectedClass, setSelectedClass] = useState(null);
  const [activeTab, setActiveTab] = useState('attendance');

  // Sample data (will be replaced with your actual data)
  const classes = [
    {
      id: '1',
      name: 'Mathematics',
      code: 'MATH101',
      students: 28,
      nextClass: 'Today, 10:00 AM',
    },
    {
      id: '2',
      name: 'Advanced Calculus',
      code: 'MATH301',
      students: 18,
      nextClass: 'Tomorrow, 2:00 PM',
    },
    {
      id: '3',
      name: 'Linear Algebra',
      code: 'MATH202',
      students: 24,
      nextClass: 'Apr 8, 9:00 AM',
    },
    {
      id: '4',
      name: 'Discrete Mathematics',
      code: 'MATH210',
      students: 22,
      nextClass: 'Apr 10, 1:00 PM',
    },
  ];

  const sessionData = [
    {
      id: '1',
      date: 'Apr 3, 2025',
      topic: 'Integration Techniques',
      present: 25,
      absent: 3,
      students: [
        {id: '101', name: 'Alice Johnson', status: 'present'},
        {id: '102', name: 'Bob Smith', status: 'present'},
        {id: '103', name: 'Charlie Brown', status: 'absent'},
        {id: '104', name: 'Diana Parker', status: 'present'},
        {id: '105', name: 'Edward Miller', status: 'present'},
        {id: '106', name: 'Fiona Wilson', status: 'absent'},
      ],
    },
    {
      id: '2',
      date: 'Mar 31, 2025',
      topic: 'Differential Equations',
      present: 26,
      absent: 2,
      students: [
        {id: '101', name: 'Alice Johnson', status: 'present'},
        {id: '102', name: 'Bob Smith', status: 'present'},
        {id: '103', name: 'Charlie Brown', status: 'present'},
        {id: '104', name: 'Diana Parker', status: 'absent'},
        {id: '105', name: 'Edward Miller', status: 'present'},
        {id: '106', name: 'Fiona Wilson', status: 'absent'},
      ],
    },
    {
      id: '3',
      date: 'Mar 27, 2025',
      topic: 'Limits and Continuity',
      present: 24,
      absent: 4,
      students: [
        {id: '101', name: 'Alice Johnson', status: 'present'},
        {id: '102', name: 'Bob Smith', status: 'absent'},
        {id: '103', name: 'Charlie Brown', status: 'present'},
        {id: '104', name: 'Diana Parker', status: 'present'},
        {id: '105', name: 'Edward Miller', status: 'absent'},
        {id: '106', name: 'Fiona Wilson', status: 'present'},
      ],
    },
  ];

  const enrolledStudents = [
    {id: '101', name: 'Alice Johnson', rollNo: '2023001', attendance: 92},
    {id: '102', name: 'Bob Smith', rollNo: '2023002', attendance: 85},
    {id: '103', name: 'Charlie Brown', rollNo: '2023003', attendance: 78},
    {id: '104', name: 'Diana Parker', rollNo: '2023004', attendance: 95},
    {id: '105', name: 'Edward Miller', rollNo: '2023005', attendance: 88},
    {id: '106', name: 'Fiona Wilson', rollNo: '2023006', attendance: 72},
    {id: '107', name: 'George Adams', rollNo: '2023007', attendance: 90},
    {id: '108', name: 'Hannah Martin', rollNo: '2023008', attendance: 83},
  ];

  const renderClassItem = ({item}) => (
    <TouchableOpacity
      style={styles.classCard}
      onPress={() => setSelectedClass(item)}>
      <View style={styles.classCardContent}>
        <View>
          <Text style={styles.className}>{item.name}</Text>
          <Text style={styles.classCode}>{item.code}</Text>
          <View style={styles.classStats}>
            <Text style={styles.classStatsText}>{item.students} students</Text>
            <View style={styles.statsDivider} />
            <Text style={styles.classStatsText}>Next: {item.nextClass}</Text>
          </View>
        </View>
        <Text style={styles.arrowIcon}>→</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSessionItem = ({item}) => (
    <View style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionDate}>{item.date}</Text>
        <Text style={styles.sessionTopic}>{item.topic}</Text>
      </View>

      <View style={styles.attendanceSummary}>
        <View style={styles.attendanceStat}>
          <Text style={styles.statValue}>{item.present}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>
        <View style={styles.attendanceStat}>
          <Text style={styles.statValue}>{item.absent}</Text>
          <Text style={styles.statLabel}>Absent</Text>
        </View>
        <View style={styles.attendanceStat}>
          <Text style={styles.statValue}>
            {Math.round((item.present / (item.present + item.absent)) * 100)}%
          </Text>
          <Text style={styles.statLabel}>Attendance</Text>
        </View>
      </View>

      <Text style={styles.studentListHeader}>Students</Text>
      {item.students.map(student => (
        <View key={student.id} style={styles.studentRow}>
          <Text style={styles.studentName}>{student.name}</Text>
          <View
            style={[
              styles.statusBadge,
              student.status === 'present'
                ? styles.presentBadge
                : styles.absentBadge,
            ]}>
            <Text
              style={[
                styles.statusText,
                student.status === 'present'
                  ? styles.presentText
                  : styles.absentText,
              ]}>
              {student.status === 'present' ? 'Present' : 'Absent'}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderStudentItem = ({item}) => (
    <View style={styles.studentCard}>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.studentId}>Roll No: {item.rollNo}</Text>
      </View>
      <View
        style={[
          styles.attendanceIndicator,
          {backgroundColor: getAttendanceColor(item.attendance)},
        ]}>
        <Text style={styles.attendanceText}>{item.attendance}%</Text>
      </View>
    </View>
  );

  const getAttendanceColor = percentage => {
    if (percentage >= 90) return '#4CAF50';
    if (percentage >= 80) return '#8BC34A';
    if (percentage >= 75) return '#FFC107';
    return '#F44336';
  };

  return (
    <SafeAreaView style={styles.container}>
      {!selectedClass ? (
        // Classes List Screen
        <>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Classes</Text>
          </View>
          <FlatList
            data={classes}
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
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{selectedClass.name}</Text>
            <Text style={styles.classCode}>{selectedClass.code}</Text>
          </View>

          <View style={styles.content}>
            {activeTab === 'attendance' ? (
              <FlatList
                data={sessionData}
                renderItem={renderSessionItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.sessionsList}
              />
            ) : (
              <View style={styles.classDetailsContainer}>
                <View style={styles.classInfoCard}>
                  <Text style={styles.classInfoTitle}>Class Information</Text>
                  <View style={styles.classInfoRow}>
                    <Text style={styles.infoLabel}>Class Name:</Text>
                    <Text style={styles.infoValue}>{selectedClass.name}</Text>
                  </View>
                  <View style={styles.classInfoRow}>
                    <Text style={styles.infoLabel}>Class Code:</Text>
                    <Text style={styles.infoValue}>{selectedClass.code}</Text>
                  </View>
                  <View style={styles.classInfoRow}>
                    <Text style={styles.infoLabel}>Total Students:</Text>
                    <Text style={styles.infoValue}>
                      {selectedClass.students}
                    </Text>
                  </View>
                  <View style={styles.classInfoRow}>
                    <Text style={styles.infoLabel}>Next Class:</Text>
                    <Text style={styles.infoValue}>
                      {selectedClass.nextClass}
                    </Text>
                  </View>
                </View>

                <Text style={styles.enrolledTitle}>Enrolled Students</Text>
                <FlatList
                  data={enrolledStudents}
                  renderItem={renderStudentItem}
                  keyExtractor={item => item.id}
                  contentContainerStyle={styles.enrolledList}
                  scrollEnabled={false}
                  nestedScrollEnabled={true}
                />
              </View>
            )}
          </View>

          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'attendance' && styles.activeTab,
              ]}
              onPress={() => setActiveTab('attendance')}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'attendance' && styles.activeTabText,
                ]}>
                Attendance
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'details' && styles.activeTab]}
              onPress={() => setActiveTab('details')}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'details' && styles.activeTabText,
                ]}>
                Class Details
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
  classStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  classStatsText: {
    fontSize: 12,
    color: '#757575',
  },
  statsDivider: {
    height: 12,
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  arrowIcon: {
    fontSize: 18,
    color: '#757575',
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 24,
    color: '#333333',
  },
  content: {
    flex: 1,
  },
  sessionsList: {
    padding: 16,
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  sessionTopic: {
    fontSize: 14,
    color: '#757575',
  },
  attendanceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 12,
  },
  attendanceStat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  studentListHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  studentName: {
    fontSize: 14,
    color: '#333333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  presentBadge: {
    backgroundColor: '#E8F5E9',
  },
  absentBadge: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  presentText: {
    color: '#4CAF50',
  },
  absentText: {
    color: '#F44336',
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
  classDetailsContainer: {
    padding: 16,
  },
  classInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  classInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  classInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#757575',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  enrolledTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  enrolledList: {
    paddingBottom: 16,
  },
  studentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  studentInfo: {
    flex: 1,
  },
  studentId: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  attendanceIndicator: {
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  attendanceText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
});

export default TeacherViewReportScreen;

import React, {useState} from 'react';
import {View, Text, TouchableOpacity, ScrollView, StyleSheet} from 'react-native';

const AttendanceSection = ({attendanceData, classData}) => {
  const [activeTab, setActiveTab] = useState('present');

  const presentStudents = attendanceData || [];
const absentStudents = classData.filter(student => !attendanceData.includes(student));

  return (
    <View style={styles.attendanceContainer}>
      {/* Toggle Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'present' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('present')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'present' && styles.activeTabText,
            ]}>
            Present ({presentStudents.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'absent' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('absent')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'absent' && styles.activeTabText,
            ]}>
            Absent ({absentStudents.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      {activeTab === 'present' ? (
        presentStudents.length > 0 ? (
          <ScrollView
            style={styles.presentList}
            persistentScrollbar={true}
            showsVerticalScrollIndicator={true}>
            {presentStudents.map((student, index) => (
              <View key={index} style={styles.studentItem}>
                <Text style={styles.studentText}>
                  {student.split('@')[0].replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.noStudentsText}>
            No students marked present yet. Hit refresh to get latest data.
          </Text>
        )
      ) : absentStudents.length > 0 ? (
        <ScrollView
          style={styles.presentList}
          persistentScrollbar={true}
          showsVerticalScrollIndicator={true}>
          {absentStudents.map((student, index) => (
            <View key={index} style={styles.studentItem}>
              <Text style={styles.studentText}>
                {student.split('@')[0].replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.noStudentsText}>
          No absent students recorded.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
    attendanceContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 15,
        width: '100%',
        minHeight: 200,
        maxHeight: 300,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 10,
        marginTop: 10,
    },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3498db',
  },
  tabText: {
    color: '#7f8c8d',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3498db',
    fontWeight: '600',
  },
  presentList: {
    width: '100%',
  },
  studentItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  studentText: {
    fontSize: 14,
    color: '#34495e',
  },
  noStudentsText: {
    textAlign: 'center',
    color: '#95a5a6',
    fontSize: 14,
    paddingVertical: 20,
  },
});

export default AttendanceSection;

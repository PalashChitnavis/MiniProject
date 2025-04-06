/* eslint-disable no-shadow */
/* eslint-disable react-hooks/exhaustive-deps */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getStudentAttendanceReport, upsertClassesTeacher } from '../services/DatabaseService';

const StudentAttendanceReport = ({ navigation }) => {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [classData, setClassData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get student data first
        const resp = await getStudentAttendanceReport(user.email);
        setStudentData(resp);

        // Then get class data for all classes
        const classes = user.classes || [];
        const classPromises = classes.map(cls =>
          upsertClassesTeacher(cls.teacherCode, cls.classCode)
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
      const studentClass = studentClasses.find(sc => sc.classCode === classInfo.classCode) || {
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
          presentDate => presentDate === date
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
      const percentage = totalClasses > 0
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

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading attendance data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Attendance Report</Text>
      <Text style={styles.subHeader}>Student: {user.email}</Text>

      {attendanceData.length === 0 ? (
        <Text style={styles.noDataText}>No attendance data available</Text>
      ) : (
        attendanceData.map((classItem, index) => (
          <View key={index} style={styles.classContainer}>
            <View style={styles.classHeader}>
              <Text style={styles.classTitle}>
                {classItem.classCode} (Teacher: {classItem.teacherCode})
              </Text>
              <Text style={styles.percentageText}>
                Attendance: {classItem.percentage}%
              </Text>
            </View>

            <Text style={styles.summaryText}>
              {classItem.attendedClasses} of {classItem.totalClasses} classes attended
            </Text>

            <View style={styles.attendanceList}>
              {classItem.attendanceRecords.length > 0 ? (
                classItem.attendanceRecords.map((record, idx) => (
                  <View key={idx} style={styles.attendanceItem}>
                    <Text style={styles.dateText}>
                      {(record.date, 'MMM dd, yyyy')}
                    </Text>
                    <Text style={[styles.statusText, { color: record.statusColor }]}>
                      {record.status}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noClassesText}>No classes conducted yet</Text>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subHeader: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  classContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  classTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  attendanceList: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  attendanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  noClassesText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 8,
  },
});

export default StudentAttendanceReport;

// TeacherScreen.js
import React, {
  useEffect,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import {
  getTeachertAttendanceReport,
  upsertClassesTeacher,
} from '../services/DatabaseService';
import { Calendar } from 'react-native-calendars';
import { CSV } from 'react-native-csv';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

const TeacherViewReportScreen = () => {
  const { user } = useAuth();
  const [
    attendanceData,
    setAttendanceData,
  ] = useState([]);

  const [
    selectedClass,
    setSelectedClass,
  ] = useState(null);
  const [activeTab, setActiveTab] =
    useState('attendance');

  const [
    exportTriggered,
    setExportTriggered,
  ] = useState(false);

  useEffect(() => {
    console.log(attendanceData);
  }, [attendanceData]);

  useEffect(() => {
    const fetchAttendanceReports =
      async () => {
        if (
          user?.type === 'teacher' &&
          user?.classes?.length > 0
        ) {
          const {
            teacherCode,
            classes,
          } = user;

          try {
            // Fetch attendance reports
            const attendanceReports =
              await Promise.all(
                classes?.map(
                  async (classItem) => {
                    const report =
                      await getTeachertAttendanceReport(
                        classItem.classCode,
                        teacherCode,
                      );
                    return {
                      classCode:
                        classItem.classCode,
                      report,
                    };
                  },
                ),
              );

            // Fetch class data: enrolled students and dates
            const classResponses =
              await Promise.all(
                classes?.map((cls) =>
                  upsertClassesTeacher(
                    teacherCode,
                    cls.classCode,
                  ),
                ),
              );

            // Merge and update each class item
            const mergedResults =
              attendanceReports.map(
                (item, index) => {
                  const response =
                    classResponses[
                      index
                    ];
                  const enrolledStudents =
                    response?.students ||
                    [];

                  // Add `absent` array to each report.classes element
                  const updatedClasses =
                    item?.report?.classes?.map(
                      (entry) => {
                        const present =
                          entry.present ||
                          [];
                        const absent =
                          enrolledStudents.filter(
                            (student) =>
                              !present.includes(
                                student,
                              ),
                          );
                        return {
                          ...entry,
                          absent, // ⬅️ added here
                        };
                      },
                    ) || [];

                  return {
                    ...item,
                    report: {
                      ...item.report,
                      classes:
                        updatedClasses, // ⬅️ updated classes with absent info
                    },
                    datesConducted:
                      response?.dates ||
                      [],
                    enrolledStudents,
                  };
                },
              );

            setAttendanceData(
              mergedResults,
            );
          } catch (error) {
            console.error(
              'Failed to fetch attendance reports or class info:',
              error,
            );
          }
        }
      };

    fetchAttendanceReports();
  }, [user]);

  const [isExporting, setIsExporting] =
    useState(false);

  const handleExportData = async () => {
    if (!selectedClass) {
      Alert.alert(
        'Error',
        'No class selected',
      );
      return;
    }

    setIsExporting(true);

    try {
      // Process the attendance data to generate CSV content
      const csvRows = [];

      // Add header rows with class information
      csvRows.push(
        `Class: ${selectedClass.classCode}`,
      );
      csvRows.push(
        `Teacher: ${user.teacherCode}`,
      );
      csvRows.push(''); // Empty row for spacing

      // Prepare the header row with dates
      const headerRow = [
        'Student Email',
      ];
      selectedClass.datesConducted.forEach(
        (date) => {
          headerRow.push(date);
        },
      );
      headerRow.push('Attendance %');
      csvRows.push(headerRow.join(','));

      // Sort students by email
      const sortedStudents = [
        ...selectedClass.enrolledStudents,
      ].sort();

      // Process each student's attendance data
      sortedStudents.forEach(
        (student) => {
          const studentRow = [student];
          let presentCount = 0;

          selectedClass.datesConducted.forEach(
            (date) => {
              // Check if student was present on this date
              const classSession =
                selectedClass.report.classes.find(
                  (session) =>
                    session.date ===
                    date,
                );

              const isPresent =
                classSession &&
                classSession.present.includes(
                  student,
                );
              studentRow.push(
                isPresent ? '1' : '0',
              );
              if (isPresent)
                presentCount++;
            },
          );

          // Calculate attendance percentage
          const percentage =
            selectedClass.datesConducted
              .length > 0
              ? (
                  (presentCount /
                    selectedClass
                      .datesConducted
                      .length) *
                  100
                ).toFixed(2)
              : '0.00';
          studentRow.push(
            `${percentage}%`,
          );

          csvRows.push(
            studentRow.join(','),
          );
        },
      );

      // Join all rows with newlines to create CSV content
      const csvContent =
        csvRows.join('\n');

      // Define file path for saving
      const fileName = `attendance_${
        selectedClass.classCode
      }_${
        new Date()
          .toISOString()
          .split('T')[0]
      }.csv`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

      // Write CSV content to file
      await RNFS.writeFile(
        filePath,
        csvContent,
        'utf8',
      );

      // Open share dialog
      const shareOptions = {
        title: 'Export Attendance',
        message: `Attendance Report for ${selectedClass.classCode}`,
        url: `file://${filePath}`,
        type: 'text/csv',
      };

      await Share.open(shareOptions);
      Alert.alert(
        'Success',
        'Attendance data exported successfully',
      );
    } catch (error) {
      console.error(
        'Export failed:',
        error,
      );
      Alert.alert(
        'Error',
        'Failed to export attendance data',
      );
    } finally {
      setIsExporting(false);
    }
  };

  const renderClassItem = ({
    item,
  }) => (
    <TouchableOpacity
      style={styles.classCard}
      key={item.id}
      onPress={() =>
        setSelectedClass(item)
      }
    >
      <View
        style={styles.classCardContent}
      >
        <View>
          <Text
            style={styles.className}
          >
            {item?.classCode}
          </Text>
          <Text
            style={styles.classCode}
          >
            {user.teacherCode}
          </Text>
        </View>
        <Text style={styles.arrowIcon}>
          →
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderSessionItem = ({
    item,
  }) => (
    <View
      style={styles.sessionCard}
      key={item.id}
    >
      <View
        style={styles.sessionHeader}
      >
        <Text
          style={styles.sessionDate}
        >
          {item.date}
        </Text>
        {/* <Text style={styles.sessionTopic}>{item.topic}</Text> */}
      </View>

      <View
        style={styles.attendanceSummary}
      >
        <View
          style={styles.attendanceStat}
        >
          <Text
            style={styles.statValue}
          >
            {item.present.length}
          </Text>
          <Text
            style={styles.statLabel}
          >
            Present
          </Text>
        </View>
        <View
          style={styles.attendanceStat}
        >
          <Text
            style={styles.statValue}
          >
            {selectedClass
              ?.enrolledStudents
              .length -
              item.present.length}
          </Text>
          <Text
            style={styles.statLabel}
          >
            Absent
          </Text>
        </View>
        <View
          style={styles.attendanceStat}
        >
          <Text
            style={styles.statValue}
          >
            {Math.round(
              (item.present.length /
                selectedClass
                  ?.enrolledStudents
                  .length) *
                100,
            )}
            %
          </Text>
          <Text
            style={styles.statLabel}
          >
            Attendance
          </Text>
        </View>
      </View>

      <Text
        style={styles.studentListHeader}
      >
        Students
      </Text>
      <ScrollView
        style={styles.studentScrollView}
        showsVerticalScrollIndicator={
          true
        }
        contentContainerStyle={
          styles.studentScrollContent
        }
      >
        {item?.present?.map(
          (student) => (
            <View
              key={student}
              style={styles.studentRow}
            >
              <Text
                style={
                  styles.studentName
                }
              >
                {student}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  styles.presentBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    styles.presentText,
                  ]}
                >
                  Present
                </Text>
              </View>
            </View>
          ),
        )}
        {item?.absent?.map(
          (student) => (
            <View
              key={student}
              style={styles.studentRow}
            >
              <Text
                style={
                  styles.studentName
                }
              >
                {student}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  styles.absentBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    styles.absentText,
                  ]}
                >
                  Absent
                </Text>
              </View>
            </View>
          ),
        )}
      </ScrollView>
    </View>
  );

  const renderStudentItem = ({
    item,
  }) => (
    <View
      style={styles.studentCard}
      key={item.id}
    >
      <View style={styles.studentInfo}>
        <Text
          style={styles.studentName}
        >
          {item}
        </Text>
      </View>
    </View>
  );

  const getAttendanceColor = (
    percentage,
  ) => {
    if (percentage >= 90)
      return '#4CAF50';
    if (percentage >= 80)
      return '#8BC34A';
    if (percentage >= 75)
      return '#FFC107';
    return '#F44336';
  };

  return (
    <SafeAreaView
      style={styles.container}
    >
      {!selectedClass ? (
        // Classes List Screen
        <>
          <View style={styles.header}>
            <Text
              style={styles.headerTitle}
            >
              My Classes
            </Text>
          </View>
          <FlatList
            data={attendanceData}
            renderItem={renderClassItem}
            keyExtractor={(item) =>
              item.id
            }
            contentContainerStyle={
              styles.classesList
            }
          />
        </>
      ) : (
        // Class Detail Screen
        <>
          <View style={styles.header}>
            {/* <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedClass(null)}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity> */}
            <Text
              style={styles.headerTitle}
            >
              {selectedClass.classCode}
              {/* {console.log(selectedClass)} */}
            </Text>
            <Text
              style={styles.classCode}
            >
              {user.teacherCode}
            </Text>
          </View>

          <View style={styles.content}>
            {activeTab ===
              'attendance' && (
              <ScrollView
                style={
                  styles.studentScrollView3
                }
                showsVerticalScrollIndicator={
                  true
                }
                contentContainerStyle={
                  styles.studentScrollContent
                }
              >
                <FlatList
                  data={
                    selectedClass
                      ?.report?.classes
                  }
                  renderItem={
                    renderSessionItem
                  }
                  keyExtractor={(
                    item,
                  ) => item.id}
                  contentContainerStyle={
                    styles.sessionsList
                  }
                />
              </ScrollView>
            )}
            {activeTab ===
              'details' && (
              <View
                style={
                  styles.classDetailsContainer
                }
              >
                <View
                  style={
                    styles.classInfoCard
                  }
                >
                  <Text
                    style={
                      styles.classInfoTitle
                    }
                  >
                    Class Information
                  </Text>
                  <View
                    style={
                      styles.classInfoRow
                    }
                  >
                    <Text
                      style={
                        styles.infoLabel
                      }
                    >
                      Class Code:
                    </Text>
                    <Text
                      style={
                        styles.infoValue
                      }
                    >
                      {
                        selectedClass.classCode
                      }
                    </Text>
                  </View>
                  <View
                    style={
                      styles.classInfoRow
                    }
                  >
                    <Text
                      style={
                        styles.infoLabel
                      }
                    >
                      Teacher Code:
                    </Text>
                    <Text
                      style={
                        styles.infoValue
                      }
                    >
                      {user.teacherCode}
                    </Text>
                  </View>
                  <View
                    style={
                      styles.classInfoRow
                    }
                  >
                    <Text
                      style={
                        styles.infoLabel
                      }
                    >
                      Total Students:
                    </Text>
                    <Text
                      style={
                        styles.infoValue
                      }
                    >
                      {
                        selectedClass
                          .enrolledStudents
                          .length
                      }
                    </Text>
                  </View>
                </View>

                <Text
                  style={
                    styles.enrolledTitle
                  }
                >
                  Enrolled Students
                </Text>
                <ScrollView
                  style={
                    styles.studentScrollView2
                  }
                  showsVerticalScrollIndicator={
                    true
                  }
                  contentContainerStyle={
                    styles.studentScrollContent
                  }
                >
                  <FlatList
                    data={
                      selectedClass?.enrolledStudents
                    }
                    renderItem={
                      renderStudentItem
                    }
                    keyExtractor={(
                      item,
                    ) => item.id}
                    contentContainerStyle={
                      styles.enrolledList
                    }
                    scrollEnabled={
                      false
                    }
                    nestedScrollEnabled={
                      true
                    }
                  />
                </ScrollView>
              </View>
            )}
            {/* In your content section */}
            {activeTab === 'export' && (
              <View
                style={
                  styles.exportContainer
                }
              >
                <Text
                  style={
                    styles.exportTitle
                  }
                >
                  Export Attendance Data
                </Text>

                {/* Data summary preview */}
                <View
                  style={
                    styles.dataPreview
                  }
                >
                  <Text
                    style={
                      styles.previewText
                    }
                  >
                    {selectedClass
                      ?.report?.classes
                      ?.length ||
                      0}{' '}
                    sessions available
                  </Text>
                  <Text
                    style={
                      styles.previewText
                    }
                  >
                    {selectedClass
                      ?.enrolledStudents
                      ?.length ||
                      0}{' '}
                    students
                  </Text>
                </View>

                {/* Export button */}
                <TouchableOpacity
                  style={[
                    styles.exportButton,
                    isExporting &&
                      styles.exportButtonDisabled,
                  ]}
                  onPress={
                    handleExportData
                  }
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text
                      style={
                        styles.exportButtonText
                      }
                    >
                      Export as CSV
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab ===
                  'attendance' &&
                  styles.activeTab,
              ]}
              onPress={() =>
                setActiveTab(
                  'attendance',
                )
              }
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab ===
                    'attendance' &&
                    styles.activeTabText,
                ]}
              >
                Attendance
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab ===
                  'details' &&
                  styles.activeTab,
              ]}
              onPress={() =>
                setActiveTab('details')
              }
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab ===
                    'details' &&
                    styles.activeTabText,
                ]}
              >
                Class Details
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab ===
                  'export' &&
                  styles.activeTab,
              ]}
              onPress={() =>
                setActiveTab('export')
              }
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab ===
                    'export' &&
                    styles.activeTabText,
                ]}
              >
                Export Data
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 10,
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
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 10,
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
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 10,
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
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 10,
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
    // shadowColor: '#000',
    // shadowOffset: {width: 0, height: 1},
    // shadowOpacity: 0.05,
    // shadowRadius: 2,
    elevation: 10,
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
    marginHorizontal: 2,
    // shadowColor: '#000',
    // shadowOffset: {width: 0, height: 1},
    // shadowOpacity: 0.05,
    // shadowRadius: 1,
    elevation: 3,
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
  studentScrollView: {
    maxHeight: 200, // Fixed height for scrollable area
    width: '100%', // Takes full width of parent
  },
  studentScrollView2: {
    maxHeight: 400, // Fixed height for scrollable area
    width: '100%', // Takes full width of parent
  },
  studentScrollView3: {
    maxHeight: 800, // Fixed height for scrollable area
    width: '100%', // Takes full width of parent
  },
  studentScrollContent: {
    paddingBottom: 16, // Add some bottom padding
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    width: '100%', // Ensure full width
  },
  exportContainer: {
    flex: 1,
    padding: 20,
  },
  exportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  dataPreview: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  previewText: {
    fontSize: 14,
    marginBottom: 5,
  },
  exportButton: {
    backgroundColor: '#28a745', // Green color
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  exportButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  exportButtonDisabled: {
    backgroundColor: '#6c757d', // Gray color when disabled
  },
});

export default TeacherViewReportScreen;

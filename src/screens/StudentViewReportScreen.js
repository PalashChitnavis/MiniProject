/* eslint-disable react-native/no-inline-styles */
import React, {
  useEffect,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useAuth } from '../contexts/AuthContext';
import {
  getStudentAttendanceReport,
  upsertClassesTeacher,
} from '../services/DatabaseService';

const StudentViewReportScreen = () => {
  const { user } = useAuth();
  const [studentData, setStudentData] =
    useState(null);
  const [classData, setClassData] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [
    attendanceData,
    setAttendanceData,
  ] = useState([]);
  const [
    selectedClass,
    setSelectedClass,
  ] = useState(null);
  const [activeTab, setActiveTab] =
    useState('calendar');
  const [
    currentMonth,
    setCurrentMonth,
  ] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resp =
          await getStudentAttendanceReport(
            user.email,
          );
        setStudentData(resp);

        const classes =
          user.classes || [];
        if (classes.length === 0) {
          setLoading(false);
          return;
        }

        const classPromises =
          classes.map((cls) =>
            upsertClassesTeacher(
              cls.teacherCode,
              cls.classCode,
            ),
          );

        const classResponses =
          await Promise.all(
            classPromises,
          );
        setClassData(
          classResponses || [],
        );
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.email, user.classes]);

  useEffect(() => {
    if (
      classData.length > 0 &&
      studentData
    ) {
      const processedData =
        processAttendanceData(
          studentData,
          classData,
        );
      setAttendanceData(processedData);
    }
  }, [studentData, classData]);

  const processAttendanceData = (
    studentData,
    classData,
  ) => {
    const studentClasses =
      studentData?.classes || [];

    return classData.map(
      (classInfo) => {
        const studentClass =
          studentClasses.find(
            (sc) =>
              sc.classCode ===
              classInfo.classCode,
          ) || {
            classCode:
              classInfo.classCode,
            teacherCode:
              classInfo.teacherCode,
            datesPresent: [],
          };

        const classDates =
          classInfo?.dates || [];
        const presentDates =
          studentClass?.datesPresent ||
          [];

        const attendanceRecords =
          classDates.map((date) => {
            const isPresent =
              presentDates.some(
                (presentDate) =>
                  presentDate === date,
              );
            return {
              date,
              status: isPresent
                ? 'Present'
                : 'Absent',
              statusColor: isPresent
                ? '#4CAF50'
                : '#F44336',
            };
          });

        const totalClasses =
          classDates.length;
        const attendedClasses =
          presentDates.length;
        const percentage =
          totalClasses > 0
            ? Math.min(
                100,
                Math.max(
                  0,
                  Math.round(
                    (attendedClasses /
                      totalClasses) *
                      100,
                  ),
                ),
              )
            : 0;

        return {
          classCode:
            classInfo.classCode,
          teacherCode:
            classInfo.teacherCode,
          attendanceRecords,
          totalClasses,
          attendedClasses,
          percentage,
        };
      },
    );
  };

  const getMarkedDates = () => {
    if (
      !selectedClass?.attendanceRecords
        ?.length
    ) {
      return {};
    }

    const markedDates = {};
    selectedClass.attendanceRecords.forEach(
      (classItem) => {
        const [day, month, year] =
          classItem.date.split('/');
        const formattedDate = `${year}-${month}-${day}`;

        markedDates[formattedDate] = {
          selected: true,
          selectedColor:
            classItem.statusColor,
        };
      },
    );

    return markedDates;
  };

  const renderClassItem = ({
    item,
  }) => (
    <TouchableOpacity
      style={styles.classCard}
      onPress={() =>
        setSelectedClass(item)
      }
    >
      <View
        style={styles.classCardContent}
      >
        <View style={styles.classInfo}>
          <Text
            style={styles.className}
          >
            {item?.classCode}
          </Text>
          <Text
            style={styles.classCode}
          >
            {item?.teacherCode}
          </Text>
          <View
            style={
              styles.attendanceDetails
            }
          >
            <View
              style={
                styles.attendanceDetailItem
              }
            >
              <Text
                style={
                  styles.attendanceDetailLabel
                }
              >
                Total:
              </Text>
              <Text
                style={
                  styles.attendanceDetailValue
                }
              >
                {item.totalClasses}
              </Text>
            </View>
            <View
              style={
                styles.attendanceDetailItem
              }
            >
              <Text
                style={
                  styles.attendanceDetailLabel
                }
              >
                Present:
              </Text>
              <Text
                style={[
                  styles.attendanceDetailValue,
                  { color: '#4CAF50' },
                ]}
              >
                {item.attendedClasses}
              </Text>
            </View>
            <View
              style={
                styles.attendanceDetailItem
              }
            >
              <Text
                style={
                  styles.attendanceDetailLabel
                }
              >
                Absent:
              </Text>
              <Text
                style={[
                  styles.attendanceDetailValue,
                  { color: '#F44336' },
                ]}
              >
                {item.totalClasses -
                  item.attendedClasses}
              </Text>
            </View>
          </View>
        </View>
        <View
          style={[
            styles.attendanceIndicator,
            {
              backgroundColor:
                getAttendanceColor(
                  item.percentage,
                ),
            },
          ]}
        >
          <Text
            style={
              styles.attendanceText
            }
          >
            {item.percentage}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getAttendanceColor = (
    percentage,
  ) => {
    if (percentage >= 90) {
      return '#4CAF50';
    }
    if (percentage >= 80) {
      return '#8BC34A';
    }
    if (percentage >= 75) {
      return '#FFC107';
    }
    return '#F44336';
  };

  const formatDate2 = (dateStr) => {
    if (!dateStr) {
      return 'Invalid Date';
    }
    const [day, month, year] =
      dateStr.split('/');
    const isoDateStr = `${year}-${month}-${day}`;
    const date = new Date(isoDateStr);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    };
    return date.toLocaleDateString(
      'en-GB',
      options,
    );
  };

  const renderAttendanceList = () => {
    if (
      !selectedClass?.attendanceRecords
        ?.length
    ) {
      return (
        <View
          style={
            styles.attendanceListContainer
          }
        >
          <Text
            style={styles.sectionTitle}
          >
            No attendance records
            available
          </Text>
        </View>
      );
    }

    return (
      <View
        style={
          styles.attendanceListContainer
        }
      >
        <View
          style={styles.listSection}
        >
          <Text
            style={styles.sectionTitle}
          >
            Present
          </Text>
          {selectedClass.attendanceRecords.filter(
            (item) =>
              item.status === 'Present',
          ).length === 0 ? (
            <Text
              style={styles.dateText}
            >
              No present records
            </Text>
          ) : (
            selectedClass.attendanceRecords.map(
              (item, index) => {
                if (
                  item.status ===
                  'Present'
                ) {
                  return (
                    <View
                      key={index}
                      style={
                        styles.dateItem
                      }
                    >
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              '#4CAF50',
                          },
                        ]}
                      />
                      <Text
                        style={
                          styles.dateText
                        }
                      >
                        {formatDate2(
                          item.date,
                        )}
                      </Text>
                    </View>
                  );
                }
                return null;
              },
            )
          )}
        </View>

        <View
          style={styles.listSection}
        >
          <Text
            style={styles.sectionTitle}
          >
            Absent
          </Text>
          {selectedClass.attendanceRecords.filter(
            (item) =>
              item.status === 'Absent',
          ).length === 0 ? (
            <Text
              style={styles.dateText}
            >
              No absent records
            </Text>
          ) : (
            selectedClass.attendanceRecords.map(
              (item, index) => {
                if (
                  item.status ===
                  'Absent'
                ) {
                  return (
                    <View
                      key={index}
                      style={
                        styles.dateItem
                      }
                    >
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              '#F44336',
                          },
                        ]}
                      />
                      <Text
                        style={
                          styles.dateText
                        }
                      >
                        {formatDate2(
                          item.date,
                        )}
                      </Text>
                    </View>
                  );
                }
                return null;
              },
            )
          )}
        </View>
      </View>
    );
  };

  const getOverAllAttendancePercentage =
    () => {
      if (!attendanceData.length) {
        return 0;
      }

      const totalPercentage =
        attendanceData.reduce(
          (sum, item) =>
            sum + item.percentage,
          0,
        );
      return Math.min(
        100,
        Math.max(
          0,
          Math.round(
            totalPercentage /
              attendanceData.length,
          ),
        ),
      );
    };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        No classes enrolled
      </Text>
      <Text style={styles.emptySubText}>
        Join a class to view attendance
        records
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={styles.emptyContainer}
        >
          <Text
            style={styles.emptyText}
          >
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      {!selectedClass ? (
        <>
          <View style={styles.header}>
            <Text
              style={styles.headerTitle}
            >
              My Classes
            </Text>
            <View
              style={
                styles.overallAttendance
              }
            >
              <Text
                style={
                  styles.overallAttendanceLabel
                }
              >
                Overall Attendance
              </Text>
              <Text
                style={
                  styles.overallAttendanceValue
                }
              >
                {getOverAllAttendancePercentage()}
                %
              </Text>
            </View>
          </View>
          {attendanceData.length ===
          0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={attendanceData}
              renderItem={
                renderClassItem
              }
              keyExtractor={(item) =>
                item.classCode
              }
              contentContainerStyle={
                styles.classesList
              }
            />
          )}
        </>
      ) : (
        <>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() =>
                setSelectedClass(null)
              }
            />
            <Text
              style={styles.headerTitle}
            >
              {selectedClass?.classCode ||
                'Unknown Class'}
            </Text>
            <Text
              style={styles.classCode}
            >
              {selectedClass?.teacherCode ||
                'Unknown Teacher'}
            </Text>
            <Text
              style={
                styles.classAttendanceValue
              }
            >
              {selectedClass.percentage !==
              undefined
                ? `${selectedClass.percentage}%`
                : 'N/A'}
            </Text>
          </View>

          <View style={styles.content}>
            {activeTab ===
            'calendar' ? (
              <View
                style={
                  styles.calendarContainer
                }
              >
                <Calendar
                  markedDates={getMarkedDates()}
                  onMonthChange={(
                    month,
                  ) => {
                    setCurrentMonth(
                      new Date(
                        month.dateString,
                      ),
                    );
                  }}
                  renderHeader={(
                    date,
                  ) => {
                    const month =
                      date.toString(
                        'MMMM yyyy',
                      );
                    return (
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight:
                            'bold',
                          color:
                            '#2d4150',
                        }}
                      >
                        {month}
                      </Text>
                    );
                  }}
                  theme={{
                    backgroundColor:
                      '#ffffff',
                    calendarBackground:
                      '#ffffff',
                    textSectionTitleColor:
                      '#b6c1cd',
                    selectedDayBackgroundColor:
                      '#4CAF50',
                    selectedDayTextColor:
                      '#ffffff',
                    todayTextColor:
                      '#6200ee',
                    dayTextColor:
                      '#2d4150',
                    textDisabledColor:
                      '#d9e1e8',
                    monthTextColor:
                      '#2d4150',
                    indicatorColor:
                      '#6200ee',
                  }}
                />
                {selectedClass
                  .attendanceRecords
                  ?.length === 0 ? (
                  <View
                    style={
                      styles.emptyContainer
                    }
                  >
                    <Text
                      style={
                        styles.emptyText
                      }
                    >
                      No attendance
                      records
                    </Text>
                  </View>
                ) : (
                  <View
                    style={
                      styles.legendContainer
                    }
                  >
                    <View
                      style={
                        styles.legendItem
                      }
                    >
                      <View
                        style={[
                          styles.legendDot,
                          {
                            backgroundColor:
                              '#4CAF50',
                          },
                        ]}
                      />
                      <Text
                        style={
                          styles.legendText
                        }
                      >
                        Present
                      </Text>
                    </View>
                    <View
                      style={
                        styles.legendItem
                      }
                    >
                      <View
                        style={[
                          styles.legendDot,
                          {
                            backgroundColor:
                              '#F44336',
                          },
                        ]}
                      />
                      <Text
                        style={
                          styles.legendText
                        }
                      >
                        Absent
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              renderAttendanceList()
            )}
          </View>

          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab ===
                  'calendar' &&
                  styles.activeTab,
              ]}
              onPress={() =>
                setActiveTab('calendar')
              }
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab ===
                    'calendar' &&
                    styles.activeTabText,
                ]}
              >
                Calendar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'list' &&
                  styles.activeTab,
              ]}
              onPress={() =>
                setActiveTab('list')
              }
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab ===
                    'list' &&
                    styles.activeTabText,
                ]}
              >
                Attendance Log
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

// Styles remain unchanged
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
    marginBottom: 2,
  },
  classCode: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  attendanceIndicator: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 10,
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
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 10,
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
  attendanceListContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
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
  classInfo: {
    flex: 1,
  },
  attendanceDetails: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  attendanceDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendanceDetailLabel: {
    fontSize: 12,
    color: '#757575',
    marginRight: 4,
  },
  attendanceDetailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
  },
  // New styles for empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
});

export default StudentViewReportScreen;

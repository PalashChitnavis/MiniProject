import firestore from '@react-native-firebase/firestore';
import deviceInfo from 'react-native-device-info';
import { firebase } from '@react-native-firebase/app';
import '@react-native-firebase/installations';

export const createUser = async (
  user,
) => {
  try {
    // Validate input
    if (
      !user ||
      typeof user !== 'object'
    ) {
      throw new Error(
        'User must be a valid object',
      );
    }
    if (
      !user.email ||
      typeof user.email !== 'string'
    ) {
      throw new Error(
        'User email is required and must be a string',
      );
    }
    if (
      !user.type ||
      !['student', 'teacher'].includes(
        user.type,
      )
    ) {
      throw new Error(
        'User type is required and must be "student" or "teacher"',
      );
    }

    // Get device unique ID - handle potential failures
    let deviceId;
    try {
      // deviceId = await deviceInfo.getUniqueId();
      deviceId = await firebase
        .installations()
        .getId();
    } catch (deviceError) {
      console.warn(
        'Could not get device ID:',
        deviceError.message,
      );
      deviceId = 'unknown_device'; // Fallback value
    }

    // Preserve your email key transformation with safety checks
    const emailKey = user.email
      ? user.email.replace(/[@.]/g, '_')
      : '';
    if (!emailKey) {
      throw new Error(
        'Failed to generate valid email key',
      );
    }

    const userRef = firestore()
      .collection('users')
      .doc(emailKey);

    // Use transaction for consistency and to check existing data
    let result;
    try {
      await firestore().runTransaction(
        async (transaction) => {
          const docSnapshot =
            await transaction.get(
              userRef,
            );

          // Prepare the user data with device ID
          const userData = {
            email: user.email,
            type: user.type,
            name: user.name || '',
            deviceId, // Store the device ID
            ...(user.type ===
              'student' && {
              batch: user.batch || '',
              rollNumber:
                user.rollNumber || '',
              classes: Array.isArray(
                user.classes,
              )
                ? user.classes
                : [],
            }),
            ...(user.type ===
              'teacher' && {
              teacherCode:
                user.teacherCode || '',
              classes: Array.isArray(
                user.classes,
              )
                ? user.classes
                : [],
            }),
          };

          if (docSnapshot.exists) {
            // Document exists, merge updates
            console.log(
              `User ${emailKey} already exists, merging updates`,
            );
            transaction.set(
              userRef,
              userData,
              { merge: true },
            );
            const existingData =
              docSnapshot.data() || {};
            result = {
              id: emailKey,
              ...existingData,
              ...userData,
            };
          } else {
            // New document
            transaction.set(
              userRef,
              userData,
              { merge: true },
            );
            result = {
              id: emailKey,
              ...userData,
            };
          }
        },
      );
    } catch (transactionError) {
      console.error(
        'Transaction failed:',
        transactionError.message,
      );
      throw new Error(
        `Database transaction failed: ${transactionError.message}`,
      );
    }

    console.log(
      `User ${emailKey} created or updated successfully`,
    );
    return result;
  } catch (error) {
    console.error(
      'Error creating or updating user:',
      error.message,
    );
    throw error;
  }
};

export const getUser = async (
  email,
) => {
  try {
    // Validate input
    if (
      !email ||
      typeof email !== 'string'
    ) {
      throw new Error(
        'Email is required and must be a string',
      );
    }

    // Preserve your email key transformation
    const emailKey = email.replace(
      /[@.]/g,
      '_',
    );
    if (!emailKey) {
      throw new Error(
        'Failed to generate valid email key',
      );
    }

    const userRef = firestore()
      .collection('users')
      .doc(emailKey);

    // Fetch the document with error handling
    let docSnapshot;
    try {
      docSnapshot = await userRef.get();
    } catch (fetchError) {
      console.error(
        'Error fetching user document:',
        fetchError.message,
      );
      throw new Error(
        `Failed to fetch user: ${fetchError.message}`,
      );
    }

    if (!docSnapshot.exists) {
      console.log(
        `No user found for emailKey: ${emailKey}`,
      );
      return null; // Consistent with original behavior
    }

    const userData =
      docSnapshot.data() || {};

    // Optional: Verify the email matches the input to detect collisions
    if (userData.email !== email) {
      console.warn(
        `Email key collision detected: ${emailKey} maps to ${
          userData.email || 'undefined'
        }, not ${email}`,
      );
      // You could throw an error here if collisions are critical
      // throw new Error('Email key collision detected');
    }

    console.log(
      `User fetched successfully for emailKey: ${emailKey}`,
    );
    return {
      id: emailKey,
      ...userData,
    }; // Return data with ID
  } catch (error) {
    console.error(
      'Error fetching user:',
      error.message,
    );
    throw error;
  }
};

export const getTeacherEmailFromCode =
  async (teacherCode) => {
    try {
      // Validate input
      if (
        !teacherCode ||
        typeof teacherCode !== 'string'
      ) {
        throw new Error(
          'teacherCode is required and must be a string',
        );
      }

      // Query users collection for teacherCode, ensuring type is "teacher"
      let snapshot;
      try {
        snapshot = await firestore()
          .collection('users')
          .where(
            'teacherCode',
            '==',
            teacherCode,
          )
          .where(
            'type',
            '==',
            'teacher',
          ) // Ensure it's a teacher
          .limit(1)
          .get();
      } catch (queryError) {
        console.error(
          'Query failed:',
          queryError.message,
        );
        throw new Error(
          `Failed to query teacher: ${queryError.message}`,
        );
      }

      // Check if a teacher was found
      if (!snapshot || snapshot.empty) {
        console.log(
          `No teacher found with teacherCode: ${teacherCode}`,
        );
        return null; // Indicate no match
      }

      // Get the first (and only) document
      const teacherData =
        snapshot.docs[0]?.data();
      if (!teacherData) {
        console.warn(
          'Teacher document exists but data is empty',
        );
        return null;
      }

      // Log success
      console.log(
        `Teacher email fetched for teacherCode: ${teacherCode}`,
      );
      return teacherData.email || null; // Return email as per original intent
    } catch (error) {
      console.error(
        'Error fetching teacher email from code:',
        error.message,
      );
      throw error;
    }
  };

export const updateUser = async (
  user,
) => {
  try {
    // Validate input
    if (
      !user ||
      typeof user !== 'object'
    ) {
      throw new Error(
        'Invalid user object: must be a valid object',
      );
    }

    if (
      !user.email ||
      typeof user.email !== 'string'
    ) {
      throw new Error(
        'Invalid user object: email is required and must be a string',
      );
    }

    const emailKey = user.email.replace(
      /[@.]/g,
      '_',
    );
    if (!emailKey) {
      throw new Error(
        'Failed to generate valid email key',
      );
    }

    const userRef = firestore()
      .collection('users')
      .doc(emailKey);

    // Check if the document exists
    let docSnapshot;
    try {
      docSnapshot = await userRef.get();
    } catch (fetchError) {
      console.error(
        'Error checking if user exists:',
        fetchError.message,
      );
      throw new Error(
        `Failed to check if user exists: ${fetchError.message}`,
      );
    }

    try {
      if (docSnapshot.exists) {
        // Update only the provided fields
        await userRef.update(user);
      } else {
        // If the document doesn't exist, create it with the provided fields
        await userRef.set(user, {
          merge: true,
        });
      }
    } catch (writeError) {
      console.error(
        'Error writing user data:',
        writeError.message,
      );
      throw new Error(
        `Failed to update/create user: ${writeError.message}`,
      );
    }

    console.log(
      'User updated successfully',
    );
    return userRef;
  } catch (error) {
    console.error(
      'Error updating user:',
      error.message,
    );
    throw error;
  }
};

export const studentPutsAttendance =
  async (
    teacherCode,
    classCode,
    studentEmail,
  ) => {
    try {
      // Input validation
      if (
        !teacherCode ||
        typeof teacherCode !==
          'string' ||
        teacherCode.trim() === ''
      ) {
        throw new Error(
          'teacherCode is required and must be a non-empty string',
        );
      }
      if (
        !classCode ||
        typeof classCode !== 'string' ||
        classCode.trim() === ''
      ) {
        throw new Error(
          'classCode is required and must be a non-empty string',
        );
      }
      if (
        !studentEmail ||
        typeof studentEmail !==
          'string' ||
        !studentEmail.includes('@')
      ) {
        throw new Error(
          'studentEmail is required and must be a valid email',
        );
      }

      const emailKey =
        studentEmail.replace(
          /[@.]/g,
          '_',
        );
      if (!emailKey) {
        throw new Error(
          'Failed to generate valid email key',
        );
      }

      const studentAttendanceRef =
        firestore()
          .collection(
            'student_attendance',
          )
          .doc(emailKey);
      const teacherAttendanceRef =
        firestore()
          .collection(
            'teacher_attendance',
          )
          .doc(
            `${classCode}_${teacherCode}`,
          );

      // Use server timestamp for consistency
      const currentDate =
        getCurrentDate();

      try {
        await firestore().runTransaction(
          async (transaction) => {
            // Fetch both documents
            const studentDoc =
              await transaction.get(
                studentAttendanceRef,
              );
            const teacherDoc =
              await transaction.get(
                teacherAttendanceRef,
              );

            // 1. Update student_attendance
            if (!studentDoc.exists) {
              // First attendance ever for this student
              transaction.set(
                studentAttendanceRef,
                {
                  studentEmail,
                  classes: [
                    {
                      classCode,
                      teacherCode,
                      datesPresent: [
                        currentDate,
                      ],
                    },
                  ],
                },
              );
            } else {
              const studentData =
                studentDoc.data() || {};
              // Ensure classes is an array, default to empty if undefined or invalid
              const classes =
                Array.isArray(
                  studentData.classes,
                )
                  ? studentData.classes
                  : [];
              console.log(
                'Student classes:',
                classes,
              ); // Debug log

              // Safer implementation avoiding potential .find() errors
              let classIndex = -1;
              for (
                let i = 0;
                i < classes.length;
                i++
              ) {
                const cls = classes[i];
                if (
                  cls &&
                  cls.classCode ===
                    classCode &&
                  cls.teacherCode ===
                    teacherCode
                ) {
                  classIndex = i;
                  break;
                }
              }

              if (classIndex >= 0) {
                // Class exists, update datesPresent
                const classItem =
                  classes[classIndex];
                const datesPresent =
                  Array.isArray(
                    classItem.datesPresent,
                  )
                    ? classItem.datesPresent
                    : [];

                for (
                  let i = 0;
                  i <
                  datesPresent.length;
                  i++
                ) {
                  if (
                    datesPresent[i] ===
                    currentDate
                  ) {
                    throw new Error(
                      'Attendance already recorded for this date in student record',
                    );
                  }
                }

                transaction.update(
                  studentAttendanceRef,
                  {
                    [`classes.${classIndex}.datesPresent`]:
                      firestore.FieldValue.arrayUnion(
                        currentDate,
                      ),
                  },
                );
              } else {
                // New class for this student
                transaction.update(
                  studentAttendanceRef,
                  {
                    classes:
                      firestore.FieldValue.arrayUnion(
                        {
                          classCode,
                          teacherCode,
                          datesPresent:
                            [
                              currentDate,
                            ],
                        },
                      ),
                  },
                );
              }
            }

            // 2. Update teacher_attendance
            if (!teacherDoc.exists) {
              // First attendance for this class
              transaction.set(
                teacherAttendanceRef,
                {
                  classCode,
                  teacherCode,
                  classes: [
                    {
                      date: currentDate,
                      present: [
                        studentEmail,
                      ],
                    },
                  ],
                },
              );
            } else {
              const teacherData =
                teacherDoc.data() || {};
              // Ensure classes is an array, default to empty if undefined or invalid
              const classes =
                Array.isArray(
                  teacherData.classes,
                )
                  ? teacherData.classes
                  : [];
              console.log(
                'Teacher classes:',
                classes,
              ); // Debug log

              // Safer implementation avoiding potential .find() errors
              let classIndex = -1;
              for (
                let i = 0;
                i < classes.length;
                i++
              ) {
                if (
                  classes[i] &&
                  classes[i].date ===
                    currentDate
                ) {
                  classIndex = i;
                  break;
                }
              }

              if (classIndex >= 0) {
                // Date exists, update present array
                const classItem =
                  classes[classIndex];
                const present =
                  Array.isArray(
                    classItem.present,
                  )
                    ? classItem.present
                    : [];

                if (
                  present.includes(
                    studentEmail,
                  )
                ) {
                  throw new Error(
                    'Student already marked present for this date in teacher record',
                  );
                }

                const updatedClasses = [
                  ...classes,
                ];
                updatedClasses[
                  classIndex
                ] = {
                  ...updatedClasses[
                    classIndex
                  ],
                  date: currentDate,
                  present: [
                    ...(Array.isArray(
                      updatedClasses[
                        classIndex
                      ].present,
                    )
                      ? updatedClasses[
                          classIndex
                        ].present
                      : []),
                    studentEmail,
                  ],
                };

                transaction.update(
                  teacherAttendanceRef,
                  {
                    classes:
                      updatedClasses,
                  },
                );
              } else {
                // New date for this class
                transaction.update(
                  teacherAttendanceRef,
                  {
                    classes:
                      firestore.FieldValue.arrayUnion(
                        {
                          date: currentDate,
                          present: [
                            studentEmail,
                          ],
                        },
                      ),
                  },
                );
              }
            }
          },
        );
      } catch (transactionError) {
        console.error(
          'Transaction failed:',
          transactionError.message,
        );
        throw new Error(
          `Attendance recording failed: ${transactionError.message}`,
        );
      }

      console.log(
        'Attendance recorded successfully for',
        studentEmail,
        'in class',
        classCode,
      );
      return true;
    } catch (error) {
      console.error(
        'Error recording student attendance:',
        error.message,
      );
      throw error;
    }
  };

export const teacherCancelsAttendance =
  async (
    teacherCode,
    classCode,
    studentEmail,
  ) => {
    try {
      // Input validation
      if (
        !teacherCode ||
        typeof teacherCode !==
          'string' ||
        teacherCode.trim() === ''
      ) {
        throw new Error(
          'teacherCode is required and must be a non-empty string',
        );
      }
      if (
        !classCode ||
        typeof classCode !== 'string' ||
        classCode.trim() === ''
      ) {
        throw new Error(
          'classCode is required and must be a non-empty string',
        );
      }
      if (
        !studentEmail ||
        typeof studentEmail !==
          'string' ||
        !studentEmail.includes('@')
      ) {
        throw new Error(
          'studentEmail is required and must be a valid email',
        );
      }

      // Create document IDs
      const studentKey =
        studentEmail.replace(
          /[@.]/g,
          '_',
        );
      if (!studentKey) {
        throw new Error(
          'Failed to generate valid student key',
        );
      }

      const classKey = `${classCode}_${teacherCode}`;

      // Get current date (server time)
      const currentDate =
        getCurrentDate();

      // Get references to both documents
      const studentAttendanceRef =
        firestore()
          .collection(
            'student_attendance',
          )
          .doc(studentKey);
      const teacherAttendanceRef =
        firestore()
          .collection(
            'teacher_attendance',
          )
          .doc(classKey);

      try {
        await firestore().runTransaction(
          async (transaction) => {
            // 1. Update student_attendance document
            const studentDoc =
              await transaction.get(
                studentAttendanceRef,
              );

            if (!studentDoc.exists) {
              throw new Error(
                'Student attendance record not found',
              );
            }

            const studentData =
              studentDoc.data() || {};
            const classes =
              studentData.classes || [];

            // Safer implementation without using .find()
            let classIndex = -1;
            for (
              let i = 0;
              i < classes.length;
              i++
            ) {
              const cls = classes[i];
              if (
                cls &&
                cls.classCode ===
                  classCode &&
                cls.teacherCode ===
                  teacherCode
              ) {
                classIndex = i;
                break;
              }
            }

            if (classIndex === -1) {
              throw new Error(
                'Class record not found for this student',
              );
            }

            const existingClass =
              classes[classIndex];
            if (!existingClass) {
              throw new Error(
                'Class record is invalid',
              );
            }

            const datesPresent =
              Array.isArray(
                existingClass.datesPresent,
              )
                ? existingClass.datesPresent
                : [];

            // Check if attendance record exists for current date
            let dateExists = false;
            for (
              let i = 0;
              i < datesPresent.length;
              i++
            ) {
              if (
                datesPresent[i] ===
                currentDate
              ) {
                dateExists = true;
                break;
              }
            }

            if (!dateExists) {
              throw new Error(
                'Attendance not found for the specified date',
              );
            }

            // Remove the date from datesPresent array
            // const updatedDates = datesPresent.filter(date => date !== currentDate);
            const updatedDates = [];
            for (
              let i = 0;
              i < datesPresent.length;
              i++
            ) {
              if (
                datesPresent[i] !==
                currentDate
              ) {
                updatedDates.push(
                  datesPresent[i],
                );
              }
            }

            if (
              updatedDates.length === 0
            ) {
              // If no dates left, remove the entire class record
              transaction.update(
                studentAttendanceRef,
                {
                  classes:
                    firestore.FieldValue.arrayRemove(
                      classes[
                        classIndex
                      ],
                    ),
                },
              );
            } else {
              // Otherwise update the dates array
              transaction.update(
                studentAttendanceRef,
                {
                  [`classes.${classIndex}.datesPresent`]:
                    updatedDates,
                },
              );
            }

            // 2. Update teacher_attendance document
            const teacherDoc =
              await transaction.get(
                teacherAttendanceRef,
              );

            if (!teacherDoc.exists) {
              throw new Error(
                'Teacher attendance record not found',
              );
            }

            const teacherData =
              teacherDoc.data() || {};
            const teacherClasses =
              Array.isArray(
                teacherData.classes,
              )
                ? teacherData.classes
                : [];

            // Find class with matching date using a for loop instead of find()
            let teacherClassIndex = -1;
            for (
              let i = 0;
              i < teacherClasses.length;
              i++
            ) {
              if (
                teacherClasses[i] &&
                teacherClasses[i]
                  .date === currentDate
              ) {
                teacherClassIndex = i;
                break;
              }
            }

            if (
              teacherClassIndex === -1
            ) {
              throw new Error(
                'Class date record not found in teacher attendance',
              );
            }

            const teacherClass =
              teacherClasses[
                teacherClassIndex
              ];
            if (!teacherClass) {
              throw new Error(
                'Teacher class record is invalid',
              );
            }

            const presentStudents =
              Array.isArray(
                teacherClass.present,
              )
                ? teacherClass.present
                : [];

            if (
              !presentStudents.includes(
                studentEmail,
              )
            ) {
              throw new Error(
                'Student not marked as present in teacher record',
              );
            }

            // Update the teacher's attendance record
            // transaction.update(teacherAttendanceRef, {
            //   [`classes.${teacherClassIndex}.present`]:
            //     firestore.FieldValue.arrayRemove(studentEmail),
            // });

            // Remove studentEmail from present array manually
            const updatedPresent =
              teacherClass.present.filter(
                (email) =>
                  email !==
                  studentEmail,
              );

            // Replace the present array with the updated one in the specific class object
            const updatedTeacherClasses =
              [...teacherClasses];
            updatedTeacherClasses[
              teacherClassIndex
            ] = {
              ...teacherClass,
              present: updatedPresent,
            };

            // Update the entire classes array
            transaction.update(
              teacherAttendanceRef,
              {
                classes:
                  updatedTeacherClasses,
              },
            );

            // Remove the entire date record if no students left
            // if (presentStudents.length === 1) {
            //   transaction.update(teacherAttendanceRef, {
            //     classes: firestore.FieldValue.arrayRemove(teacherClass),
            //   });
            // }
          },
        );
      } catch (transactionError) {
        console.error(
          'Transaction failed:',
          transactionError.message,
        );
        throw new Error(
          `Attendance cancellation failed: ${transactionError.message}`,
        );
      }

      console.log(
        'Attendance cancelled successfully',
      );
      return true;
    } catch (error) {
      console.error(
        'Error cancelling attendance:',
        error.message,
      );
      throw error;
    }
  };

export const upsertTeacherAttendance =
  async (classCode, teacherCode) => {
    try {
      // Input validation
      if (
        !teacherCode ||
        typeof teacherCode !==
          'string' ||
        teacherCode.trim() === ''
      ) {
        throw new Error(
          'teacherCode is required and must be a non-empty string',
        );
      }
      if (
        !classCode ||
        typeof classCode !== 'string' ||
        classCode.trim() === ''
      ) {
        throw new Error(
          'classCode is required and must be a non-empty string',
        );
      }

      // References to both collections
      const teacherAttendanceRef =
        firestore()
          .collection(
            'teacher_attendance',
          )
          .doc(
            `${classCode}_${teacherCode}`,
          );
      const classesRef = firestore()
        .collection('classes')
        .doc(
          `${classCode}_${teacherCode}`,
        );

      // Use server timestamp for consistency
      const currentDate =
        getCurrentDate();

      let result;
      let attempts = 0;
      const maxAttempts = 3;

      // Add retry logic for transaction
      while (attempts < maxAttempts) {
        try {
          await firestore().runTransaction(
            async (transaction) => {
              // Fetch both documents
              const teacherDoc =
                await transaction.get(
                  teacherAttendanceRef,
                );
              const classesDoc =
                await transaction.get(
                  classesRef,
                );

              // 1. Handle teacher_attendance
              if (!teacherDoc.exists) {
                // First class ever for this teacher-class combo
                const newRecord = {
                  teacherCode,
                  classCode,
                  classes: [
                    {
                      date: currentDate,
                      present: [],
                    },
                  ],
                };
                transaction.set(
                  teacherAttendanceRef,
                  newRecord,
                );
                result = newRecord;
              } else {
                const teacherData =
                  teacherDoc.data() ||
                  {};
                const classes =
                  Array.isArray(
                    teacherData.classes,
                  )
                    ? teacherData.classes
                    : [];

                // Check for existing class for this date using a for loop instead of find()
                let existingClass =
                  null;
                for (
                  let i = 0;
                  i < classes.length;
                  i++
                ) {
                  if (
                    classes[i] &&
                    classes[i].date ===
                      currentDate
                  ) {
                    existingClass =
                      classes[i];
                    break;
                  }
                }

                if (existingClass) {
                  console.log(
                    'Using existing class record for this date',
                  );
                  result = {
                    ...teacherData,
                    existingDate: true,
                  };
                } else {
                  // Add new class date
                  transaction.update(
                    teacherAttendanceRef,
                    {
                      classes:
                        firestore.FieldValue.arrayUnion(
                          {
                            date: currentDate,
                            present: [],
                          },
                        ),
                    },
                  );
                  result = {
                    ...teacherData,
                    classes: [
                      ...classes,
                      {
                        date: currentDate,
                        present: [],
                      },
                    ],
                    existingDate: false,
                  };
                }
              }

              // 2. Handle classes collection (only add if new date)
              if (!classesDoc.exists) {
                // First class instance
                transaction.set(
                  classesRef,
                  {
                    classCode,
                    teacherCode,
                    dates: [
                      currentDate,
                    ],
                    students: [],
                  },
                );
              } else {
                const classesData =
                  classesDoc.data() ||
                  {};
                const dates =
                  Array.isArray(
                    classesData.dates,
                  )
                    ? classesData.dates
                    : [];

                // Check if date exists already
                let dateExists = false;
                for (
                  let i = 0;
                  i < dates.length;
                  i++
                ) {
                  if (
                    dates[i] ===
                    currentDate
                  ) {
                    dateExists = true;
                    break;
                  }
                }

                if (!dateExists) {
                  transaction.update(
                    classesRef,
                    {
                      dates:
                        firestore.FieldValue.arrayUnion(
                          currentDate,
                        ),
                    },
                  );
                }
              }
            },
          );

          // If we reach here, transaction succeeded
          break;
        } catch (error) {
          attempts++;
          console.warn(
            `Transaction attempt ${attempts} failed: ${error.message}`,
          );

          if (attempts >= maxAttempts) {
            throw new Error(
              `Failed after ${maxAttempts} attempts: ${error.message}`,
            );
          }

          // Wait before retrying
          await new Promise((resolve) =>
            setTimeout(
              resolve,
              500 * attempts,
            ),
          );
        }
      }

      console.log(
        'Teacher attendance processed successfully',
      );
      return (
        result || {
          status: 'success',
          message:
            'Attendance processed',
          date: currentDate,
        }
      );
    } catch (error) {
      console.error(
        'Error in upsertTeacherAttendance:',
        error.message,
      );
      throw error;
    }
  };

export const getAttendanceTeacherCurrentDate =
  async (teacherCode, classCode) => {
    try {
      // Validate inputs
      if (
        !teacherCode ||
        typeof teacherCode !== 'string'
      ) {
        throw new Error(
          'teacherCode is required and must be a string',
        );
      }
      if (
        !classCode ||
        typeof classCode !== 'string'
      ) {
        throw new Error(
          'classCode is required and must be a string',
        );
      }

      const docRef = firestore()
        .collection(
          'teacher_attendance',
        )
        .doc(
          `${classCode}_${teacherCode}`,
        );

      // Fetch the document with error handling
      let docSnapshot;
      try {
        docSnapshot =
          await docRef.get();
      } catch (fetchError) {
        console.error(
          'Error fetching attendance record:',
          fetchError.message,
        );
        throw new Error(
          `Failed to fetch attendance: ${fetchError.message}`,
        );
      }

      if (!docSnapshot.exists) {
        console.log(
          `No attendance record found for ${classCode}_${teacherCode}`,
        );
        return [];
      }

      const data =
        docSnapshot.data() || {};
      if (
        !data.classes ||
        !Array.isArray(data.classes)
      ) {
        console.log(
          `Invalid classes data structure for ${classCode}_${teacherCode}`,
        );
        return [];
      }

      // Use server-aligned current date
      const currentDate =
        getCurrentDate();

      console.log(
        'Current date:',
        currentDate,
      );
      console.log('Data:', data);

      // Find today's class (match by day, ignoring time) using for loop instead of find()
      let todaysClass = null;
      for (
        let i = 0;
        i < data.classes.length;
        i++
      ) {
        const cls = data.classes[i];
        if (
          cls &&
          cls.date &&
          cls.date === currentDate
        ) {
          todaysClass = cls;
          break;
        }
      }

      if (!todaysClass) {
        console.log(
          `No attendance record for today in ${classCode}_${teacherCode}`,
        );
        return [];
      }

      console.log(
        `Attendance fetched for ${classCode}_${teacherCode} on current date`,
      );
      return Array.isArray(
        todaysClass.present,
      )
        ? todaysClass.present
        : [];
    } catch (error) {
      console.error(
        'Error fetching teacher attendance:',
        error.message,
      );
      throw error;
    }
  };

export const upsertClassesTeacher =
  async (teacherCode, classCode) => {
    try {
      // Validate inputs
      if (
        !teacherCode ||
        typeof teacherCode !==
          'string' ||
        teacherCode.trim() === ''
      ) {
        throw new Error(
          'teacherCode is required and must be a non-empty string',
        );
      }
      if (
        !classCode ||
        typeof classCode !== 'string' ||
        classCode.trim() === ''
      ) {
        throw new Error(
          'classCode is required and must be a non-empty string',
        );
      }

      const classesRef = firestore()
        .collection('classes')
        .doc(
          `${classCode}_${teacherCode}`,
        );

      // Use a transaction for consistency with retry mechanism
      let result;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          await firestore().runTransaction(
            async (transaction) => {
              const docSnapshot =
                await transaction.get(
                  classesRef,
                );

              if (docSnapshot.exists) {
                const existingData =
                  docSnapshot.data() ||
                  {};
                // Optional: Verify consistency of existing data
                if (
                  existingData.teacherCode !==
                    teacherCode ||
                  existingData.classCode !==
                    classCode
                ) {
                  console.warn(
                    `Existing class data mismatch for ${classCode}_${teacherCode}`,
                  );
                }
                result = existingData;
              } else {
                const record = {
                  teacherCode,
                  classCode,
                  students: [], // Could accept initial students as an optional param if needed
                  dates: [], // Could accept initial dates if needed
                };
                transaction.set(
                  classesRef,
                  record,
                );
                result = record;
              }
            },
          );

          // Success - break out of retry loop
          break;
        } catch (error) {
          attempts++;
          console.warn(
            `Transaction attempt ${attempts} failed: ${error.message}`,
          );

          if (attempts >= maxAttempts) {
            throw new Error(
              `Failed after ${maxAttempts} attempts: ${error.message}`,
            );
          }

          // Wait before retrying with exponential backoff
          await new Promise((resolve) =>
            setTimeout(
              resolve,
              500 * attempts,
            ),
          );
        }
      }

      console.log(
        `Class record upserted successfully for ${classCode}_${teacherCode}`,
      );
      return result; // Consistent return of data
    } catch (error) {
      console.error(
        'Error upserting class record:',
        error.message,
      );
      throw error;
    }
  };

export const addStudentToClass = async (
  classCode,
  teacherCode,
  studentEmail,
) => {
  try {
    // Validate inputs
    if (
      !classCode ||
      !teacherCode ||
      !studentEmail
    ) {
      throw new Error(
        'classCode, teacherCode, and studentEmail are required',
      );
    }
    if (
      typeof classCode !== 'string' ||
      typeof teacherCode !== 'string' ||
      typeof studentEmail !== 'string'
    ) {
      throw new Error(
        'Inputs must be strings',
      );
    }
    if (
      /[\/#.$\[\]]/.test(classCode) ||
      /[\/#.$\[\]]/.test(teacherCode)
    ) {
      throw new Error(
        'Codes cannot contain /, #, ., $, [, or ]',
      );
    }

    const classesRef = firestore()
      .collection('classes')
      .doc(
        `${classCode}_${teacherCode}`,
      );

    // Retry transaction up to 3 times
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        await firestore().runTransaction(
          async (transaction) => {
            const docSnapshot =
              await transaction.get(
                classesRef,
              );

            if (!docSnapshot.exists) {
              throw new Error(
                `Class ${classCode} with teacher ${teacherCode} does not exist`,
              );
            }

            const classData =
              docSnapshot.data() || {};
            let students =
              Array.isArray(
                classData.students,
              )
                ? classData.students
                : [];

            // Check if student already enrolled using a manual loop for safety
            let studentExists = false;
            for (
              let i = 0;
              i < students.length;
              i++
            ) {
              if (
                students[i] ===
                studentEmail
              ) {
                studentExists = true;
                break;
              }
            }

            if (studentExists) {
              console.log(
                `Student ${studentEmail} is already enrolled in ${classCode}`,
              );
              return;
            }

            transaction.update(
              classesRef,
              {
                students:
                  firestore.FieldValue.arrayUnion(
                    studentEmail,
                  ),
              },
            );
          },
        );

        console.log(
          `Student ${studentEmail} added to class ${classCode} successfully`,
        );
        return true;
      } catch (error) {
        attempts++;
        if (
          error.message.includes(
            'does not exist',
          ) ||
          attempts >= maxAttempts
        ) {
          throw error;
        }
        // Wait before retrying with exponential backoff
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            500 * attempts,
          ),
        );
      }
    }

    throw new Error(
      'Failed to add student after multiple attempts',
    );
  } catch (error) {
    console.error(
      'Error adding student to class:',
      error.message,
    );
    throw error;
  }
};

export const getStudentAttendanceReport =
  async (studentEmail) => {
    try {
      // Validate input
      if (
        !studentEmail ||
        typeof studentEmail !== 'string'
      ) {
        throw new Error(
          'Email is required and must be a string',
        );
      }

      // Preserve your email key transformation
      const emailKey =
        studentEmail.replace(
          /[@.]/g,
          '_',
        );
      if (!emailKey) {
        throw new Error(
          'Failed to generate valid email key',
        );
      }

      const attendanceRef = firestore()
        .collection(
          'student_attendance',
        )
        .doc(emailKey);

      // Fetch the document with error handling
      let docSnapshot;
      try {
        docSnapshot =
          await attendanceRef.get();
      } catch (fetchError) {
        console.error(
          'Error fetching student attendance:',
          fetchError.message,
        );
        throw new Error(
          `Failed to fetch student attendance: ${fetchError.message}`,
        );
      }

      if (!docSnapshot.exists) {
        console.log(
          `No attendance found for student: ${emailKey}`,
        );
        return null; // Consistent with original behavior
      }

      const userData =
        docSnapshot.data() || {};

      // Optional: Verify the email matches the input to detect collisions
      if (
        userData.studentEmail &&
        userData.studentEmail !==
          studentEmail
      ) {
        console.warn(
          `Email key collision detected: ${emailKey} maps to ${userData.studentEmail}, not ${studentEmail}`,
        );
        // You could throw an error here if collisions are critical
        // throw new Error('Email key collision detected');
      }

      console.log(
        `Student attendance fetched successfully for emailKey: ${emailKey}`,
      );
      return {
        id: emailKey,
        ...userData,
      }; // Return data with ID
    } catch (error) {
      console.error(
        'Error fetching student attendance:',
        error.message,
      );
      throw error;
    }
  };

export const getTeachertAttendanceReport =
  async (classCode, teacherCode) => {
    try {
      // Validate input
      if (
        !classCode ||
        typeof classCode !== 'string'
      ) {
        throw new Error(
          'Class Code is required and must be a string',
        );
      }
      if (
        !teacherCode ||
        typeof teacherCode !== 'string'
      ) {
        throw new Error(
          'Teacher Code is required and must be a string',
        );
      }

      // Create document key
      const docKey = `${classCode}_${teacherCode}`;
      const attendanceRef = firestore()
        .collection(
          'teacher_attendance',
        )
        .doc(docKey);

      // Fetch the document with error handling
      let docSnapshot;
      try {
        docSnapshot =
          await attendanceRef.get();
      } catch (fetchError) {
        console.error(
          'Error fetching teacher attendance:',
          fetchError.message,
        );
        throw new Error(
          `Failed to fetch teacher attendance: ${fetchError.message}`,
        );
      }

      if (!docSnapshot.exists) {
        console.log(
          `No attendance record found for ${docKey}`,
        );
        return null; // Consistent with original behavior
      }

      const userData =
        docSnapshot.data() || {};

      // Verify document contains expected data
      if (
        userData.classCode !==
          classCode ||
        userData.teacherCode !==
          teacherCode
      ) {
        console.warn(
          `Document key mismatch detected: ${docKey} maps to different class/teacher codes`,
        );
      }

      console.log(
        'Teacher Attendance fetched successfully',
      );
      return { ...userData }; // Return data with ID
    } catch (error) {
      console.error(
        'Error fetching teacher attendance:',
        error.message,
      );
      throw error;
    }
  };

const getCurrentDate = () => {
  try {
    const currentDate =
      firestore.Timestamp.now();
    const dateObj =
      currentDate.toDate(); // Convert to JavaScript Date object

    const day = String(
      dateObj.getDate(),
    ).padStart(2, '0');
    const month = String(
      dateObj.getMonth() + 1,
    ).padStart(2, '0'); // Months are 0-indexed
    const year = dateObj.getFullYear();

    const formattedDate = `${day}/${month}/${year}`; // "06/04/2025"
    return formattedDate;
  } catch (error) {
    console.error(
      'Error generating current date:',
      error.message,
    );

    // Fallback implementation if the firestore timestamp fails
    const today = new Date();
    const day = String(
      today.getDate(),
    ).padStart(2, '0');
    const month = String(
      today.getMonth() + 1,
    ).padStart(2, '0');
    const year = today.getFullYear();

    return `${day}/${month}/${year}`;
  }
};

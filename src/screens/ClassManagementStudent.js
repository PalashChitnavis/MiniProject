/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, {
  useState,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  Animated,
  Easing,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  addStudentToClass,
  updateUser,
} from '../services/DatabaseService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const ClassManagementStudent = () => {
  const { user, storeUser } = useAuth();
  const navigation = useNavigation();
  const initialClasses = Array.isArray(
    user?.classes,
  )
    ? user.classes
    : [];

  const [
    originalClasses,
    setOriginalClasses,
  ] = useState(initialClasses);
  const [classes, setClasses] =
    useState(initialClasses);
  const [hasChanges, setHasChanges] =
    useState(false);
  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);
  const buttonSlideAnim = useRef(
    new Animated.Value(0),
  ).current;

  const [
    modalVisible,
    setModalVisible,
  ] = useState(false);
  const [isEditing, setIsEditing] =
    useState(false);
  const [
    editingIndex,
    setEditingIndex,
  ] = useState(null);
  const [
    currentClass,
    setCurrentClass,
  ] = useState({
    teacherCode: '',
    classCode: '',
  });

  useEffect(() => {
    const backAction = () => {
      if (hasChanges) {
        showUnsavedChangesAlert();
        return true;
      }
      return false;
    };

    const backHandler =
      BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

    const unsubscribe =
      navigation.addListener(
        'beforeRemove',
        (e) => {
          if (!hasChanges) {
            return;
          }
          e.preventDefault();
          showUnsavedChangesAlert(e);
        },
      );

    return () => {
      backHandler.remove();
      unsubscribe();
    };
  }, [hasChanges, navigation]);

  const showUnsavedChangesAlert = (
    e,
  ) => {
    Alert.alert(
      'Unsaved Changes',
      'You have unsaved changes. Do you want to save them before leaving?',
      [
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setClasses(originalClasses);
            setHasChanges(false);
            if (e) {
              navigation.dispatch(
                e.data.action,
              );
            } else {
              navigation.goBack();
            }
          },
        },
        {
          text: 'Save',
          onPress: async () => {
            await handleApplyChanges();
            if (e) {
              navigation.dispatch(
                e.data.action,
              );
            } else {
              navigation.goBack();
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
    );
  };

  const handleInputChange = (
    field,
    value,
  ) => {
    setCurrentClass((prev) => ({
      ...prev,
      [field]: value
        .toUpperCase()
        .trim(),
    }));
  };

  const resetForm = () => {
    setCurrentClass({
      teacherCode: '',
      classCode: '',
    });
    setIsEditing(false);
    setEditingIndex(null);
  };

  const classExists = (cls) => {
    return classes.some(
      (existingClass) =>
        existingClass.teacherCode ===
          cls.teacherCode &&
        existingClass.classCode ===
          cls.classCode,
    );
  };

  const anotherClassExists = (
    cls,
    currentIndex,
  ) => {
    return classes.some(
      (existingClass, index) =>
        index !== currentIndex &&
        existingClass.teacherCode ===
          cls.teacherCode &&
        existingClass.classCode ===
          cls.classCode,
    );
  };

  const validateClassInput = (cls) => {
    const { teacherCode, classCode } =
      cls;
    if (
      !teacherCode.trim() ||
      !classCode.trim()
    ) {
      return 'Please fill all fields';
    }
    if (
      /[^A-Z0-9]/.test(teacherCode) ||
      /[^A-Z0-9]/.test(classCode)
    ) {
      return 'Codes must contain only letters and numbers';
    }
    return null;
  };

  const handleSubmit = () => {
    if (isSubmitting) return;

    const validationError =
      validateClassInput(currentClass);
    if (validationError) {
      Alert.alert(
        'Error',
        validationError,
      );
      return;
    }

    if (
      isEditing &&
      editingIndex !== null
    ) {
      if (
        anotherClassExists(
          currentClass,
          editingIndex,
        )
      ) {
        Alert.alert(
          'Error',
          'A class with these details already exists',
        );
        return;
      }
      const updatedClasses = [
        ...classes,
      ];
      updatedClasses[editingIndex] = {
        ...currentClass,
      };
      setClasses(updatedClasses);
      setHasChanges(true);
      animateButtonsIn();
    } else {
      if (classExists(currentClass)) {
        Alert.alert(
          'Error',
          'This class already exists',
        );
        return;
      }
      const updatedClasses = [
        ...classes,
        { ...currentClass },
      ];
      setClasses(updatedClasses);
      setHasChanges(true);
      animateButtonsIn();
    }

    setModalVisible(false);
    resetForm();
  };

  const handleEdit = (cls, index) => {
    setCurrentClass({ ...cls });
    setIsEditing(true);
    setEditingIndex(index);
    setModalVisible(true);
  };

  const handleDelete = (index) => {
    Alert.alert(
      'Delete Class',
      'Are you sure you want to delete this class?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const newClasses =
              classes.filter(
                (_, i) => i !== index,
              );
            setClasses(newClasses);
            setHasChanges(true);
            animateButtonsIn();
          },
        },
      ],
    );
  };

  const handleApplyChanges =
    async () => {
      if (isSubmitting || !user.email)
        return;
      setIsSubmitting(true);

      try {
        const normalizedClasses =
          classes.map((cls) => ({
            teacherCode: cls.teacherCode
              .toUpperCase()
              .trim(),
            classCode: cls.classCode
              .toUpperCase()
              .trim(),
          }));

        const updatedUser = {
          ...user,
          classes: normalizedClasses,
        };
        await updateUser(updatedUser);
        await storeUser(updatedUser);

        let flag = false;

        // Sequentially add student to classes to avoid Firestore contention
        for (const cls of normalizedClasses) {
          try {
            await addStudentToClass(
              cls.classCode,
              cls.teacherCode,
              user.email,
            );
          } catch (error) {
            if (
              error.message.includes(
                'Class',
              ) &&
              error.message.includes(
                'does not exist',
              )
            ) {
              flag = true;
              Alert.alert(
                'Warning',
                `Class ${cls.classCode} with teacher ${cls.teacherCode} does not exist. Other changes saved.`,
              );
            } else {
              throw error;
            }
          }
        }

        setOriginalClasses(
          normalizedClasses,
        );
        setHasChanges(false);
        animateButtonsOut();
        if (!flag)
          Alert.alert(
            'Success',
            'Changes have been saved',
          );
      } catch (error) {
        Alert.alert(
          'Error',
          error.message ||
            'Failed to save changes',
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  const handleResetChanges = () => {
    Alert.alert(
      'Reset Changes',
      'Are you sure you want to discard all changes?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setClasses(originalClasses);
            setHasChanges(false);
            animateButtonsOut();
          },
        },
      ],
    );
  };

  const animateButtonsIn = () => {
    Animated.timing(buttonSlideAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const animateButtonsOut = () => {
    Animated.timing(buttonSlideAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const buttonsTranslateY =
    buttonSlideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [100, 0],
    });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          My Classes
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
          disabled={isSubmitting}
        >
          <Icon
            name="add"
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.classesContainer,
          {
            paddingBottom: hasChanges
              ? 100
              : 20,
          },
        ]}
      >
        {classes.length === 0 ? (
          <Text
            style={styles.emptyText}
          >
            No Classes Added Yet
          </Text>
        ) : (
          classes.map((cls, index) => (
            <View
              key={`${cls.classCode}-${cls.teacherCode}-${index}`}
              style={styles.classCard}
            >
              <View
                style={styles.classInfo}
              >
                <Text
                  style={
                    styles.classCode
                  }
                >
                  Class: {cls.classCode}
                </Text>
                <Text
                  style={
                    styles.teacherCode
                  }
                >
                  Teacher:{' '}
                  {cls.teacherCode}
                </Text>
              </View>
              {!(
                user.email?.startsWith(
                  'test_student',
                ) &&
                cls.classCode ===
                  'TEST_CLASS'
              ) && (
                <View
                  style={
                    styles.classActions
                  }
                >
                  <TouchableOpacity
                    onPress={() =>
                      handleEdit(
                        cls,
                        index,
                      )
                    }
                    disabled={
                      isSubmitting
                    }
                  >
                    <Icon
                      name="create-outline"
                      size={20}
                      color="#4a8cff"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      handleDelete(
                        index,
                      )
                    }
                    disabled={
                      isSubmitting
                    }
                  >
                    <Icon
                      name="trash-outline"
                      size={20}
                      color="#ff6b6b"
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <Animated.View
        style={[
          styles.changesButtonsContainer,
          {
            transform: [
              {
                translateY:
                  buttonsTranslateY,
              },
            ],
          },
        ]}
      >
        {hasChanges && (
          <>
            <TouchableOpacity
              style={[
                styles.changesButton,
                styles.resetButton,
              ]}
              onPress={
                handleResetChanges
              }
              disabled={isSubmitting}
            >
              <Text
                style={
                  styles.changesButtonText
                }
              >
                Discard
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.changesButton,
                styles.applyButton,
              ]}
              onPress={
                handleApplyChanges
              }
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                />
              ) : (
                <Text
                  style={
                    styles.changesButtonText
                  }
                >
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </Animated.View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <View
          style={styles.modalOverlay}
        >
          <View
            style={styles.modalContent}
          >
            <Text
              style={styles.modalTitleA}
            >
              {isEditing
                ? 'Edit Class Details'
                : 'Add New Class'}
            </Text>
            <Text
              style={styles.modalTitleB}
            >
              Both fields are required
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Class Code (e.g., OS, WCT)"
              placeholderTextColor="#666"
              value={
                currentClass.classCode
              }
              onChangeText={(text) =>
                handleInputChange(
                  'classCode',
                  text,
                )
              }
              selectionColor="#4a8cff"
              underlineColorAndroid="transparent"
              autoCapitalize="characters"
              autoFocus={true}
            />

            <TextInput
              style={styles.input}
              placeholder="Teacher Code (e.g., AT, KKP)"
              placeholderTextColor="#666"
              value={
                currentClass.teacherCode
              }
              onChangeText={(text) =>
                handleInputChange(
                  'teacherCode',
                  text,
                )
              }
              selectionColor="#4a8cff"
              underlineColorAndroid="transparent"
              autoCapitalize="characters"
            />
            <Text
              style={styles.modalTitleB}
            >
              Please use short codes
              only (e.g, AT, HCI, SNS,
              KKP)
            </Text>

            <View
              style={
                styles.modalButtons
              }
            >
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                ]}
                onPress={() => {
                  setModalVisible(
                    false,
                  );
                  resetForm();
                }}
                disabled={isSubmitting}
              >
                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.submitButton,
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text
                  style={
                    styles.submitButtonText
                  }
                >
                  {isEditing
                    ? 'Update'
                    : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4a8cff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  classesContainer: {
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
    fontSize: 16,
  },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  classInfo: {
    flex: 1,
  },
  teacherCode: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: 'green',
  },
  classCode: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  classActions: {
    flexDirection: 'row',
    gap: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor:
      'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitleA: {
    fontSize: 16,
    fontWeight: 'normal',
    marginBottom: 5,
    textAlign: 'center',
    color: '#333',
  },
  modalTitleB: {
    fontSize: 16,
    fontWeight: 'normal',
    marginBottom: 20,
    textAlign: 'center',
    color: 'red',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    color: '#000',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  submitButton: {
    backgroundColor: '#4a8cff',
  },
  cancelButtonText: {
    fontWeight: 'bold',
    color: '#333',
  },
  submitButtonText: {
    fontWeight: 'bold',
    color: '#fff',
  },
  changesButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  changesButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  resetButton: {
    backgroundColor: '#ff6b6b',
  },
  applyButton: {
    backgroundColor: '#4a8cff',
  },
  changesButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ClassManagementStudent;

/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { updateUser, upsertClassesTeacher } from '../services/DatabaseService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const ClassManagementTeacher = () => {
  const {user, storeUser} = useAuth();
  const navigation = useNavigation();
  // Initial classes data
  const initialClasses = user.classes || [];

  const [originalClasses, setOriginalClasses] = useState(initialClasses);
  const [classes, setClasses] = useState(initialClasses);
  const [hasChanges, setHasChanges] = useState(false);
  const buttonSlideAnim = useRef(new Animated.Value(0)).current;

  // Form state
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [currentClass, setCurrentClass] = useState({
    classCode: '',
  });

  // Handle back button/back navigation with unsaved changes
  useEffect(() => {
    const backAction = () => {
      if (hasChanges) {
        showUnsavedChangesAlert();
        return true; // Prevent default back behavior
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    // Add navigation listener for software back button
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!hasChanges) {
        return;
      }

      // Prevent default behavior of leaving the screen
      e.preventDefault();

      showUnsavedChangesAlert(e);
    });

    return () => {
      backHandler.remove();
      unsubscribe();
    };
  }, [hasChanges, navigation]);

  const showUnsavedChangesAlert = (e) => {
    Alert.alert(
      'Unsaved Changes',
      'You have unsaved changes. Do you want to save them before leaving?',
      [
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            // Reset changes and allow navigation
            setClasses(originalClasses);
            setHasChanges(false);
            navigation.dispatch(e.data.action);
          },
        },
        {
          text: 'Save',
          onPress: async () => {
            await handleApplyChanges();
            navigation.dispatch(e.data.action);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            // Do nothing, stay on screen
          },
        },
      ]
    );
  };

  // Convert input to uppercase
  const handleInputChange = (field, value) => {
    setCurrentClass(prev => ({
      ...prev,
      [field]: value.toUpperCase(), // Auto-uppercase
    }));
  };

  // Reset form
  const resetForm = () => {
    setCurrentClass({
      classCode: '',
    });
    setIsEditing(false);
    setEditingIndex(null);
  };

  // Check if class already exists
  const classExists = (cls) => {
    return classes.some(existingClass =>
      existingClass.classCode === cls.classCode
    );
  };

  // Check if another class with same data exists (for editing)
  const anotherClassExists = (cls, currentIndex) => {
    return classes.some((existingClass, index) =>
      index !== currentIndex &&
      existingClass.classCode === cls.classCode
    );
  };

  // Submit class (add or update)
  const handleSubmit = () => {
    if (!currentClass.classCode) {
      Alert.alert('Error', 'Please enter a class code');
      return;
    }

    if (isEditing && editingIndex !== null) {
      // Editing existing class
      if (anotherClassExists(currentClass, editingIndex)) {
        Alert.alert('Error', 'A class with this code already exists');
        return;
      }

      const updatedClasses = [...classes];
      updatedClasses[editingIndex] = currentClass;
      setClasses(updatedClasses);
      setHasChanges(true);
      animateButtonsIn();
    } else {
      if (classExists(currentClass)) {
        Alert.alert('Error', 'This class code already exists');
        return;
      }

      const updatedClasses = [...classes, currentClass];
      setClasses(updatedClasses);
      setHasChanges(true);
      animateButtonsIn();
    }

    setModalVisible(false);
    resetForm();
  };

  // Edit class
  const handleEdit = (cls, index) => {
    setCurrentClass(cls);
    setIsEditing(true);
    setEditingIndex(index);
    setModalVisible(true);
  };

  // Delete class
  const handleDelete = (index) => {
    Alert.alert(
      'Delete Class',
      'Are you sure you want to delete this class?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const newClasses = classes.filter((_, i) => i !== index);
            setClasses(newClasses);
            setHasChanges(true);
            animateButtonsIn();
          },
        },
      ]
    );
  };

  // Apply changes
  const handleApplyChanges = async () => {
    // Ensure all class codes are uppercase
    const normalizedClasses = classes.map(cls => ({
      classCode: cls.classCode.toUpperCase(),
    }));

    setOriginalClasses(normalizedClasses);
    console.log(normalizedClasses);
    const updatedUser = {...user, classes: normalizedClasses};
    await storeUser(updatedUser);
    await updateUser(updatedUser);
    for (const cls of normalizedClasses) {
      await upsertClassesTeacher(user.teacherCode, cls.classCode);
    }
    setHasChanges(false);
    animateButtonsOut();
    Alert.alert('Success', 'Changes have been saved');
  };

  // Reset changes
  const handleResetChanges = () => {
    Alert.alert(
      'Reset Changes',
      'Are you sure you want to discard all changes?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setClasses(originalClasses);
            setHasChanges(false);
            animateButtonsOut();
          },
        },
      ]
    );
  };

  // Animation for buttons
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

  const buttonsTranslateY = buttonSlideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>My Class Codes</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Classes List */}
      <ScrollView
        contentContainerStyle={[
          styles.classesContainer,
          { paddingBottom: hasChanges ? 100 : 20 }, // Add space for buttons when visible
        ]}
      >
        {classes.length === 0 ? (
          <Text style={styles.emptyText}>No Class Codes Added Yet</Text>
        ) : (
          classes.map((cls, index) => (
            <View key={`${cls.classCode}-${index}`} style={styles.classCard}>
              <View style={styles.classInfo}>
                <Text style={styles.classCode}>{cls.classCode}</Text>
              </View>
              <View style={styles.classActions}>
                {!(user.email === 'test_teacher@iiitm.ac.in' && cls.classCode === 'TEST_CLASS') && <><TouchableOpacity onPress={() => handleEdit(cls, index)}>
                  <Icon name="create-outline" size={20} color="#4a8cff" />
                </TouchableOpacity><TouchableOpacity onPress={() => handleDelete(index)}>
                    <Icon name="trash-outline" size={20} color="#ff6b6b" />
                  </TouchableOpacity></>}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Changes Buttons */}
      <Animated.View
        style={[
          styles.changesButtonsContainer,
          { transform: [{ translateY: buttonsTranslateY }] },
        ]}
      >
        {hasChanges && (
          <>
            <TouchableOpacity
              style={[styles.changesButton, styles.resetButton]}
              onPress={handleResetChanges}
            >
              <Text style={styles.changesButtonText}>Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.changesButton, styles.applyButton]}
              onPress={handleApplyChanges}
            >
              <Text style={styles.changesButtonText}>Save</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>

      {/* Add/Edit Class Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Edit Class Code' : 'Add New Class Code'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter class code (e.g., WCT)"
              placeholderTextColor="#666"
              value={currentClass.classCode}
              onChangeText={(text) => handleInputChange('classCode', text)}
              selectionColor="#4a8cff"
              underlineColorAndroid="transparent"
              autoCapitalize="characters"
              autoFocus={true}
            />
            <Text style={styles.modalTitleA}>
              Example: WCT, OS, DS, AI, CN etc
            </Text>
            <Text style={styles.modalTitleB}>
              Use Class Codes only, not full names.
            </Text>


            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>
                  {isEditing ? 'Update' : 'Add'}
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  classInfo: {
    flex: 1,
  },
  classCode: {
    fontSize: 18,
    fontWeight: 'bold',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  modalTitleA: {
    fontSize: 16,
    fontWeight: 'normal',
    marginBottom: 20,
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
    fontSize: 16,
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
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
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

export default ClassManagementTeacher;

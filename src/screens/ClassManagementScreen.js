/* eslint-disable react-native/no-inline-styles */
import React, { useState, useRef } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { updateUser } from '../services/DatabaseService';
import { useAuth } from '../contexts/AuthContext';

const ClassManagementScreen = () => {
  const {user, storeUser} = useAuth();
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
    className: '',
    classTeacher: '',
    classCode: '',
  });

  // Convert input to uppercase
  const handleInputChange = (field, value) => {
    setCurrentClass(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Reset form
  const resetForm = () => {
    setCurrentClass({
      className: '',
      classTeacher: '',
      classCode: '',
    });
    setIsEditing(false);
    setEditingIndex(null);
  };

  // Check if class already exists
  const classExists = (cls) => {
    return classes.some(existingClass =>
      existingClass.className === cls.className &&
      existingClass.classTeacher === cls.classTeacher &&
      existingClass.classCode === cls.classCode
    );
  };

  // Check if another class with same data exists (for editing)
  const anotherClassExists = (cls, currentIndex) => {
    return classes.some((existingClass, index) =>
      index !== currentIndex &&
      existingClass.className === cls.className &&
      existingClass.classTeacher === cls.classTeacher &&
      existingClass.classCode === cls.classCode
    );
  };

  // Submit class (add or update)
  const handleSubmit = () => {
    if (!currentClass.className || !currentClass.classTeacher || !currentClass.classCode) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (isEditing && editingIndex !== null) {
      // Editing existing class
      if (anotherClassExists(currentClass, editingIndex)) {
        Alert.alert('Error', 'A class with these details already exists');
        return;
      }

      const updatedClasses = [...classes];
      updatedClasses[editingIndex] = currentClass;
      setClasses(updatedClasses);
      setHasChanges(true);
      animateButtonsIn();
    } else {
      if (classExists(currentClass)) {
        Alert.alert('Error', 'This class already exists');
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
    classes.forEach((cls)=>{
      cls.classCode = cls.classCode.toUpperCase();
      cls.className = cls.className.toUpperCase();
      cls.classTeacher = cls.classTeacher.toUpperCase();
    });
    setOriginalClasses(classes);
    const updatedUser = {...user, classes};
    await storeUser(updatedUser);
    await updateUser(updatedUser);
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
          text: 'Reset',
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
        <Text style={styles.headerText}>Manage Classes</Text>
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
          <Text style={styles.emptyText}>No Classes Added Yet</Text>
        ) : (
          classes.map((cls, index) => (
            <View key={`${cls.classCode}-${index}`} style={styles.classCard}>
              <View style={styles.classInfo}>
                <Text style={styles.className}>{cls.className}</Text>
                <Text style={styles.classDetails}>Teacher: {cls.classTeacher}</Text>
                <Text style={styles.classDetails}>Class Code: {cls.classCode}</Text>
              </View>
              <View style={styles.classActions}>
                <TouchableOpacity onPress={() => handleEdit(cls, index)}>
                  <Icon name="create-outline" size={20} color="#4a8cff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(index)}>
                  <Icon name="trash-outline" size={20} color="#ff6b6b" />
                </TouchableOpacity>
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
              <Text style={styles.changesButtonText}>Reset Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.changesButton, styles.applyButton]}
              onPress={handleApplyChanges}
            >
              <Text style={styles.changesButtonText}>Apply Changes</Text>
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
              {isEditing ? 'Edit Class' : 'Add New Class'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Class Name (eg. Data Structures)"
              placeholderTextColor="#666"
              value={currentClass.className}
              onChangeText={(text) => handleInputChange('className', text)}
              selectionColor="#4a8cff"
              underlineColorAndroid="transparent"
              autoCapitalize="characters"
            />

            <TextInput
              style={styles.input}
              placeholder="Teacher (eg. AT for Prof Aditya Trivedi)"
              placeholderTextColor="#666"
              value={currentClass.classTeacher}
              onChangeText={(text) => handleInputChange('classTeacher', text)}
              selectionColor="#4a8cff"
              underlineColorAndroid="transparent"
              autoCapitalize="characters"
            />

            <TextInput
              style={styles.input}
              placeholder="Class Code (eg. DS for Data Structures)"
              placeholderTextColor="#666"
              value={currentClass.classCode}
              onChangeText={(text) => handleInputChange('classCode', text)}
              selectionColor="#4a8cff"
              underlineColorAndroid="transparent"
              autoCapitalize="characters"
            />

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
  className: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  classDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
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

export default ClassManagementScreen;

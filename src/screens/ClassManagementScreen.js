import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const ClassManagementScreen = () => {
  // Initial classes data (only using the 3 required parameters)
  const [classes, setClasses] = useState([
    {
      className: 'TEST CLASS',
      classTeacher: 'TESTABR',
      classCode: 'TEST',
    },
  ]);

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
      [field]: value.toUpperCase(),
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
      console.log('All classes after update:', updatedClasses);
    } else {
      // Adding new class
      if (classExists(currentClass)) {
        Alert.alert('Error', 'This class already exists');
        return;
      }

      const updatedClasses = [...classes, currentClass];
      setClasses(updatedClasses);
      console.log('All classes after addition:', updatedClasses);
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
            console.log('All classes after deletion:', newClasses);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>MANAGE CLASSES</Text>
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
      <ScrollView contentContainerStyle={styles.classesContainer}>
        {classes.length === 0 ? (
          <Text style={styles.emptyText}>NO CLASSES ADDED YET</Text>
        ) : (
          classes.map((cls, index) => (
            <View key={`${cls.classCode}-${index}`} style={styles.classCard}>
              <View style={styles.classInfo}>
                <Text style={styles.className}>{cls.className}</Text>
                <Text style={styles.classDetails}>TEACHER: {cls.classTeacher}</Text>
                <Text style={styles.classDetails}>CODE: {cls.classCode}</Text>
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
              {isEditing ? 'EDIT CLASS' : 'ADD NEW CLASS'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="CLASS NAME (ENTER FULL NAME)"
              placeholderTextColor="#666"
              value={currentClass.className}
              onChangeText={(text) => handleInputChange('className', text)}
              selectionColor="#4a8cff"
              underlineColorAndroid="transparent"
              autoCapitalize="characters"
            />

            <TextInput
              style={styles.input}
              placeholder="TEACHER ABBR (EG. AT FOR ADITYA TRIVEDI)"
              placeholderTextColor="#666"
              value={currentClass.classTeacher}
              onChangeText={(text) => handleInputChange('classTeacher', text)}
              selectionColor="#4a8cff"
              underlineColorAndroid="transparent"
              autoCapitalize="characters"
            />

            <TextInput
              style={styles.input}
              placeholder="CLASS CODE (EG. DS FOR DATA STRUCTURES)"
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
                <Text style={styles.cancelButtonText}>CANCEL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>
                  {isEditing ? 'UPDATE' : 'ADD'}
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
    textTransform: 'uppercase',
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
    textTransform: 'uppercase',
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
    textTransform: 'uppercase',
  },
  classDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
    textTransform: 'uppercase',
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
    textTransform: 'uppercase',
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
    textTransform: 'uppercase',
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
    textTransform: 'uppercase',
  },
  submitButtonText: {
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
});

export default ClassManagementScreen;

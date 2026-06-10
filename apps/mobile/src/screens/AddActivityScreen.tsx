import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';

export default function AddActivityScreen({ setScreen }: { setScreen: (s: string) => void }) {
  const [amount, setAmount] = useState('');

  // Mocking Location Services that respects battery life
  // "no background location polling (use significant location change)"
  const fetchSignificantLocationChange = () => {
    // In a real app, use react-native-geolocation-service configured for significant changes
    Alert.alert("Location", "Mocked: Fetched location using significant changes (low power).");
  };

  const handleSave = () => {
    Alert.alert(
      "Confirm Action",
      "Are you sure you want to save this activity?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes", onPress: () => { setScreen('Home'); } }
      ],
      { cancelable: true }
    );
  };

  return (
    <View 
      style={styles.container}
      accessible={true}
      accessibilityLabel="Add Activity screen"
    >
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => { setScreen('Home'); }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backButton}>&larr; Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} accessibilityRole="header">Log Activity</Text>
        <View style={{ width: 50 }} />
      </View>

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        placeholder="Enter amount"
        placeholderTextColor="#a4a4b2"
        accessible={true}
        accessibilityLabel="Activity amount input"
        accessibilityHint="Enter the numerical amount for the activity"
      />

      <TouchableOpacity 
        style={styles.locationButton}
        onPress={fetchSignificantLocationChange}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Detect transport mode via location"
        accessibilityHint="Fetches significant location changes to infer transport without polling"
      >
        <Text style={styles.locationText}>Detect Transport Mode (Eco Location)</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.saveButton}
        onPress={handleSave}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Save Activity"
      >
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121214', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  backButton: { color: '#9b70ff', fontSize: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  label: { color: '#a4a4b2', marginBottom: 8 },
  input: { backgroundColor: '#1e1e24', color: '#fff', padding: 16, borderRadius: 8, fontSize: 16, marginBottom: 24 },
  locationButton: { backgroundColor: 'rgba(78, 203, 113, 0.15)', padding: 16, borderRadius: 8, marginBottom: 24, alignItems: 'center' },
  locationText: { color: '#4ecb71', fontWeight: '600' },
  saveButton: { backgroundColor: '#633bbc', padding: 16, borderRadius: 8, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

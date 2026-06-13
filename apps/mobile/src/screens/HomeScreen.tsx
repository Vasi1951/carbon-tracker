import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function HomeScreen({ setScreen }: { setScreen: (s: string) => void }): React.JSX.Element {
  return (
    <ScrollView 
      style={styles.container}
      accessible={true}
      accessibilityLabel="Home screen"
    >
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">Carbon Score</Text>
        <Text style={styles.score} accessibilityRole="text" accessibilityLabel="Your daily carbon score is 12.5 kg">12.5 kgCO₂e</Text>
      </View>

      <Text style={styles.sectionTitle} accessibilityRole="header">Quick Add</Text>
      <View style={styles.grid}>
        {['Transport', 'Food', 'Energy', 'Consumption'].map((category) => (
          <TouchableOpacity
            key={category}
            style={styles.card}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Add ${category} activity`}
            accessibilityHint={`Opens the form to log a ${category} activity`}
            onPress={() => { setScreen('AddActivity'); }}
          >
            <Text style={styles.cardText}>{category}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View 
        style={styles.tipCard}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel="Today's Tip: Use public transport. Estimated savings 2 kg of CO2."
      >
        <Text style={styles.tipTitle}>Today's Tip</Text>
        <Text style={styles.tipText}>Consider taking the bus today to reduce emissions!</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121214', padding: 20 },
  header: { alignItems: 'center', marginVertical: 40 },
  title: { fontSize: 18, color: '#a4a4b2', marginBottom: 8 },
  score: { fontSize: 48, fontWeight: 'bold', color: '#4ecb71' },
  sectionTitle: { fontSize: 20, color: '#fff', marginBottom: 16, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: '#1e1e24', padding: 20, borderRadius: 12, marginBottom: 16, alignItems: 'center' },
  cardText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  tipCard: { backgroundColor: 'rgba(155, 112, 255, 0.1)', borderLeftWidth: 4, borderLeftColor: '#9b70ff', padding: 16, borderRadius: 8, marginTop: 20 },
  tipTitle: { color: '#9b70ff', fontWeight: 'bold', marginBottom: 4 },
  tipText: { color: '#e1e1e6', fontSize: 14 }
});

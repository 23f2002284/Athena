import React from 'react';
import { StyleSheet, View } from 'react-native';
import FactCheckForm from '../../src/components/FactCheckForm.js';

export default function FactCheckScreen() {
  return (
    <View style={styles.container}>
      <FactCheckForm />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

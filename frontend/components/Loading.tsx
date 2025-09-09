import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

type Props = {
  size?: number | 'small' | 'large';
};

export function Loading({ size = 'large' }: Props) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});



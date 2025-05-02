import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants';

const ReportsScreen = () => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('reports.title')}</Text>
      <Text style={styles.comingSoon}>Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.LIGHT,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: COLORS.DARK,
  },
  comingSoon: {
    fontSize: 18,
    color: COLORS.GRAY,
    textAlign: 'center',
    marginTop: 32,
  },
});

export default ReportsScreen;

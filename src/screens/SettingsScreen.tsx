import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants';

const SettingsScreen = () => {
  const { t, i18n } = useTranslation();
  const [isArabic, setIsArabic] = useState(i18n.language === 'ar');

  const toggleLanguage = () => {
    const newLanguage = isArabic ? 'en' : 'ar';
    i18n.changeLanguage(newLanguage);
    setIsArabic(!isArabic);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('settings.title')}</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>
            {isArabic ? 'العربية' : 'English'}
          </Text>
          <Switch
            value={isArabic}
            onValueChange={toggleLanguage}
            trackColor={{ false: COLORS.LIGHT, true: COLORS.PRIMARY }}
            thumbColor={isArabic ? COLORS.SECONDARY : COLORS.WHITE}
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
        <View style={styles.aboutContainer}>
          <Text style={styles.appName}>{t('common.appName')}</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.description}>
            An application for managing partnership finances, inventory, and profit distribution.
          </Text>
        </View>
      </View>
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
  section: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: COLORS.DARK,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.DARK,
  },
  aboutContainer: {
    alignItems: 'center',
    padding: 16,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 8,
  },
  version: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: COLORS.DARK,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SettingsScreen;

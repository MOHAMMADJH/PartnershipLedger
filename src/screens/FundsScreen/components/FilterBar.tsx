import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants';

interface FilterBarProps {
  paymentMethodFilter: 'all' | 'cash' | 'bank';
  setPaymentMethodFilter: (filter: 'all' | 'cash' | 'bank') => void;
  showPersonalFunds: boolean;
  setShowPersonalFunds: (show: boolean) => void;
  t: (key: string, options?: any) => string;
}

const FilterBar: React.FC<FilterBarProps> = ({
  paymentMethodFilter,
  setPaymentMethodFilter,
  showPersonalFunds,
  setShowPersonalFunds,
  t
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>{t('common.paymentMethod')}:</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              paymentMethodFilter === 'all' && styles.activeFilterButton
            ]}
            onPress={() => setPaymentMethodFilter('all')}
          >
            <Text
              style={[
                styles.filterButtonText,
                paymentMethodFilter === 'all' && styles.activeFilterButtonText
              ]}
            >
              {t('common.all')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              paymentMethodFilter === 'cash' && styles.activeFilterButton
            ]}
            onPress={() => setPaymentMethodFilter('cash')}
          >
            <Ionicons
              name="cash-outline"
              size={16}
              color={paymentMethodFilter === 'cash' ? COLORS.WHITE : COLORS.DARK}
            />
            <Text
              style={[
                styles.filterButtonText,
                paymentMethodFilter === 'cash' && styles.activeFilterButtonText
              ]}
            >
              {t('common.paymentMethods.cash')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              paymentMethodFilter === 'bank' && styles.activeFilterButton
            ]}
            onPress={() => setPaymentMethodFilter('bank')}
          >
            <Ionicons
              name="card-outline"
              size={16}
              color={paymentMethodFilter === 'bank' ? COLORS.WHITE : COLORS.DARK}
            />
            <Text
              style={[
                styles.filterButtonText,
                paymentMethodFilter === 'bank' && styles.activeFilterButtonText
              ]}
            >
              {t('common.paymentMethods.bank')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.switchContainer}>
        <Text style={styles.filterLabel}>{t('funds.showPersonal')}:</Text>
        <Switch
          value={showPersonalFunds}
          onValueChange={setShowPersonalFunds}
          trackColor={{ false: COLORS.GRAY, true: COLORS.LIGHT_SUCCESS }}
          thumbColor={showPersonalFunds ? COLORS.SUCCESS : COLORS.GRAY}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    padding: 10,
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 14,
    color: COLORS.DARK,
    marginRight: 10,
  },
  buttonGroup: {
    flexDirection: 'row',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: COLORS.LIGHT,
  },
  activeFilterButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  filterButtonText: {
    fontSize: 14,
    color: COLORS.DARK,
    marginLeft: 4,
  },
  activeFilterButtonText: {
    color: COLORS.WHITE,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default FilterBar;

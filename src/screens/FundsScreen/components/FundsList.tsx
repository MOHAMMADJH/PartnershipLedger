import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fund } from '../../../types';
import { COLORS } from '../../../constants';

interface FundsListProps {
  funds: Fund[];
  selectedFund: Fund | null;
  handleSelectFund: (fund: Fund) => void;
  handleAddFund: () => void;
  handleEditFund: (fund: Fund) => void;
  handleDeleteFund: (fund: Fund) => void;
  t: (key: string, options?: any) => string;
}

const FundsList: React.FC<FundsListProps> = ({
  funds,
  selectedFund,
  handleSelectFund,
  handleAddFund,
  handleEditFund,
  handleDeleteFund,
  t
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('funds.title')}</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddFund}>
          <Ionicons name="add-circle" size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.fundsList}>
        {funds.length === 0 ? (
          <Text style={styles.emptyText}>{t('funds.noFunds')}</Text>
        ) : (
          funds.map(fund => (
            <TouchableOpacity
              key={fund.id}
              style={[
                styles.fundItem,
                selectedFund?.id === fund.id && styles.selectedFundItem
              ]}
              onPress={() => handleSelectFund(fund)}
            >
              <View style={styles.fundItemContent}>
                <Text style={styles.fundName}>{fund.name}</Text>
                <Text style={styles.fundBalance}>
                  {t('common.currency', { amount: fund.balance.toFixed(2) })}
                </Text>
              </View>
              <View style={styles.fundActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditFund(fund)}
                >
                  <Ionicons name="create-outline" size={20} color={COLORS.DARK} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteFund(fund)}
                >
                  <Ionicons name="trash-outline" size={20} color={COLORS.DANGER} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '30%',
    backgroundColor: COLORS.WHITE,
    borderRadius: 10,
    margin: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  addButton: {
    padding: 5,
  },
  fundsList: {
    flex: 1,
  },
  fundItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    marginVertical: 5,
    backgroundColor: COLORS.LIGHT,
    borderRadius: 8,
  },
  selectedFundItem: {
    backgroundColor: COLORS.LIGHT_SUCCESS,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
  },
  fundItemContent: {
    flex: 1,
  },
  fundName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.DARK,
    marginBottom: 4,
  },
  fundBalance: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  fundActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 5,
    marginLeft: 5,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: COLORS.GRAY,
    fontStyle: 'italic',
  },
});

export default FundsList;

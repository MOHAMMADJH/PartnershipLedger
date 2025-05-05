import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fund, Transaction } from '../../../types';
import { COLORS } from '../../../constants';
import TransactionItem from './TransactionItem';

interface FundDetailsProps {
  selectedFund: Fund;
  filteredTransactions: Transaction[];
  handleAddTransaction: () => void;
  loading: boolean;
  t: (key: string, options?: any) => string;
}

const FundDetails: React.FC<FundDetailsProps> = ({
  selectedFund,
  filteredTransactions,
  handleAddTransaction,
  loading,
  t
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{selectedFund.name}</Text>
          <Text style={styles.balance}>
            {t('common.balance')}: {t('common.currency', { amount: selectedFund.balance.toFixed(2) })}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddTransaction}>
          <Ionicons name="add-circle" size={24} color={COLORS.PRIMARY} />
          <Text style={styles.addButtonText}>{t('transactions.add')}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>{t('transactions.title')}</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : filteredTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('transactions.noTransactions')}</Text>
        </View>
      ) : (
        <ScrollView style={styles.transactionsList}>
          {filteredTransactions.map((transaction) => (
            <TransactionItem 
              key={transaction.id} 
              transaction={transaction} 
              t={t} 
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderRadius: 10,
    margin: 10,
    padding: 15,
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
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 5,
  },
  balance: {
    fontSize: 16,
    color: COLORS.GRAY,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.LIGHT_SUCCESS,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: {
    marginLeft: 5,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: 10,
  },
  transactionsList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    color: COLORS.GRAY,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default FundDetails;

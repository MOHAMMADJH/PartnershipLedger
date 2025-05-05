import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../../../types';
import { COLORS } from '../../../constants';

interface TransactionItemProps {
  transaction: Transaction;
  t: (key: string, options?: any) => string;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, t }) => {
  // Helper function to format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Determine transaction icon and color based on type
  const getTransactionIcon = () => {
    switch (transaction.type) {
      case 'deposit':
        return { name: 'arrow-down' as const, color: COLORS.SUCCESS };
      case 'withdrawal':
        return { name: 'arrow-up' as const, color: COLORS.DANGER };
      case 'transfer':
        return { name: 'swap-horizontal' as const, color: COLORS.WARNING };
      default:
        return { name: 'cash-outline' as const, color: COLORS.GRAY };
    }
  };

  const icon = getTransactionIcon();

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: `${icon.color}20` }]}>
        <Ionicons name={icon.name} size={20} color={icon.color} />
      </View>
      
      <View style={styles.detailsContainer}>
        <View style={styles.topRow}>
          <Text style={styles.description} numberOfLines={1}>
            {transaction.description || t(`transactions.types.${transaction.type}`)}
          </Text>
          <Text style={[
            styles.amount,
            transaction.type === 'deposit' ? styles.positiveAmount : 
            transaction.type === 'withdrawal' ? styles.negativeAmount : styles.neutralAmount
          ]}>
            {transaction.type === 'deposit' ? '+' : transaction.type === 'withdrawal' ? '-' : ''}
            {t('common.currency', { amount: transaction.amount.toFixed(2) })}
          </Text>
        </View>
        
        <View style={styles.bottomRow}>
          <Text style={styles.date}>{formatDate(transaction.date)}</Text>
          <View style={styles.paymentMethod}>
            <Ionicons 
              name={transaction.paymentMethod === 'cash' ? 'cash-outline' : 'card-outline'} 
              size={14} 
              color={COLORS.GRAY}
            />
            <Text style={styles.paymentMethodText}>
              {t(`common.paymentMethods.${transaction.paymentMethod}`)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 6,
    backgroundColor: COLORS.LIGHT,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailsContainer: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  description: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.DARK,
    flex: 1,
    marginRight: 8,
  },
  amount: {
    fontSize: 15,
    fontWeight: '600',
  },
  positiveAmount: {
    color: COLORS.SUCCESS,
  },
  negativeAmount: {
    color: COLORS.DANGER,
  },
  neutralAmount: {
    color: COLORS.WARNING,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 13,
    color: COLORS.GRAY,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodText: {
    fontSize: 13,
    color: COLORS.GRAY,
    marginLeft: 4,
  },
});

export default TransactionItem;

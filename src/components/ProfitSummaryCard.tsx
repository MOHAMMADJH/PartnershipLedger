import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

interface ProfitSummaryCardProps {
  title: string;
  amount: number;
  icon: string;
  color?: string;
  isPositive?: boolean;
}

const ProfitSummaryCard: React.FC<ProfitSummaryCardProps> = ({
  title,
  amount,
  icon,
  color = COLORS.PRIMARY,
  isPositive = true,
}) => {
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={24} color={COLORS.WHITE} />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text
          style={[
            styles.amount,
            isPositive ? styles.positiveAmount : styles.negativeAmount,
          ]}
        >
          {isPositive ? '+' : '-'} {Math.abs(amount).toFixed(2)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    color: COLORS.GRAY,
    marginBottom: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  positiveAmount: {
    color: COLORS.SUCCESS,
  },
  negativeAmount: {
    color: COLORS.DANGER,
  },
});

export default ProfitSummaryCard;

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';
import { Partner } from '../types';

interface ProfitDistributionCardProps {
  partner: Partner;
  amount: number;
  percentage: number;
}

const ProfitDistributionCard: React.FC<ProfitDistributionCardProps> = ({
  partner,
  amount,
  percentage,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.partnerName}>{partner.name}</Text>
        <Text style={styles.percentage}>{percentage.toFixed(2)}%</Text>
      </View>
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            { width: `${percentage}%` },
          ]}
        />
      </View>
      <View style={styles.footer}>
        <Text style={styles.label}>Share Amount</Text>
        <Text style={styles.amount}>{amount.toFixed(2)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  percentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  progressContainer: {
    height: 8,
    backgroundColor: COLORS.LIGHT,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: COLORS.GRAY,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
  },
});

export default ProfitDistributionCard;

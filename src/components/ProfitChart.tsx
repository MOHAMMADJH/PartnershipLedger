import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { COLORS } from '../constants';

interface ProfitChartProps {
  type: 'line' | 'bar';
  title: string;
  data: {
    labels: string[];
    datasets: {
      data: number[];
      color?: (opacity: number) => string;
      strokeWidth?: number;
    }[];
  };
  height?: number;
  width?: number;
}

const ProfitChart: React.FC<ProfitChartProps> = ({
  type,
  title,
  data,
  height = 220,
  width = Dimensions.get('window').width - 40,
}) => {
  const chartConfig = {
    backgroundGradientFrom: COLORS.WHITE,
    backgroundGradientTo: COLORS.WHITE,
    decimalPlaces: 0,
    color: (opacity = 1) => COLORS.PRIMARY,
    labelColor: (opacity = 1) => COLORS.DARK,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: COLORS.PRIMARY,
    },
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        {type === 'line' ? (
          <LineChart
            data={data}
            width={width}
            height={height}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        ) : (
          <BarChart
            data={data}
            width={width}
            height={height}
            chartConfig={chartConfig}
            style={styles.chart}
            fromZero
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: 8,
  },
});

export default ProfitChart;

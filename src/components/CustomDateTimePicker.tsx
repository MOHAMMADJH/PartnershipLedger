import React, { useState } from 'react';
import { Platform, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/index';

// Importar DateTimePicker con manejo de errores
let DateTimePicker: any;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (error) {
  console.warn('DateTimePicker could not be loaded:', error);
  // Fallback component
  DateTimePicker = ({ onChange }: any) => {
    console.warn('DateTimePicker is not available');
    return null;
  };
}

interface CustomDateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  label?: string;
  placeholder?: string;
}

const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
  value,
  onChange,
  mode = 'date',
  label,
  placeholder,
}) => {
  const [show, setShow] = useState(false);

  const handleChange = (event: any, selectedDate?: Date) => {
    setShow(Platform.OS === 'ios');
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    if (mode === 'time') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (mode === 'datetime') {
      return date.toLocaleString();
    }
    return date.toLocaleDateString();
  };

  // Función para manejar la selección de fecha manualmente si el DateTimePicker no está disponible
  const handleManualDateSelection = () => {
    if (!DateTimePicker) {
      // Si DateTimePicker no está disponible, incrementamos la fecha en un día como ejemplo
      const newDate = new Date(value);
      newDate.setDate(newDate.getDate() + 1);
      onChange(newDate);
    } else {
      setShow(true);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity style={styles.button} onPress={handleManualDateSelection}>
        <Text style={styles.text}>{formatDate(value)}</Text>
        <Ionicons
          name={mode === 'time' ? 'time-outline' : 'calendar-outline'}
          size={20}
          color={COLORS.GRAY}
        />
      </TouchableOpacity>
      {show && DateTimePicker && (
        <DateTimePicker
          value={value}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: COLORS.DARK,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.LIGHT,
    borderRadius: 4,
    backgroundColor: COLORS.WHITE,
  },
  text: {
    fontSize: 16,
    color: COLORS.DARK,
  },
});

export default CustomDateTimePicker;

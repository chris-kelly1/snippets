import { Button } from "@/components/ui/button";
import { Colors, FontSizes, FontWeights } from '@/constants/theme';
import React from 'react';
import { Text } from 'react-native';

type FilterButtonProps = { 
  label: string;
  isActive?: boolean;
}

export const FilterButton = ({ 
  label, 
  isActive = false 
}: FilterButtonProps) => {
  return (
    <Button
      style={{
        backgroundColor: isActive ? Colors.button.active : Colors.button.inactive,
        paddingHorizontal: 16,
        paddingVertical: 0,
        borderRadius: 21,
        height: 34,
        justifyContent: 'center',
      }}
    >
      <Text style={{
        fontSize: FontSizes.sm,
        fontWeight: FontWeights.medium,
        lineHeight: 18,
        color: isActive ? Colors.text.primary : Colors.text.secondary
      }}>
        {label}
      </Text>
    </Button>
  );
}; 
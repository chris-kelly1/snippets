import { Button } from "@/components/ui/button";
import { Colors, FontSizes, FontWeights } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, View } from 'react-native';

type FilterButtonProps = { 
  label: string;
  isActive?: boolean;
}

export const FilterButton = ({ 
  label, 
  isActive = false 
}: FilterButtonProps) => {
  if (isActive) {
    return (
      <View style={{
        borderRadius: 21,
        height: 34,
        overflow: 'hidden',
      }}>
        <LinearGradient
          colors={['#0077B6', '#00B4D8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 0,
            borderRadius: 21,
            height: 34,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{
            fontSize: FontSizes.sm,
            fontWeight: FontWeights.medium,
            lineHeight: 18,
            color: Colors.text.primary
          }}>
            {label}
          </Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <Button
      style={{
        backgroundColor: Colors.button.inactive,
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
        color: Colors.text.secondary
      }}>
        {label}
      </Text>
    </Button>
  );
}; 
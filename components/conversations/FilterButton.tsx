import { Colors, FontSizes, FontWeights, Spacing } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

type FilterButtonProps = {
  label: string;
  isActive: boolean;
};

export const FilterButton = ({ label, isActive }: FilterButtonProps) => {
  return (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.activeFilterButton]}
    >
      <Text style={[styles.filterText, isActive && styles.activeFilterText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginRight: Spacing.sm,
    backgroundColor: "#f0f0f0",
  },
  activeFilterButton: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: "#666",
  },
  activeFilterText: {
    color: "#fff",
  },
});

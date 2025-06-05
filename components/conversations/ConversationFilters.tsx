import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { FilterButton } from './FilterButton';

type FilterType = 'All' | 'Recipient Online' | 'Unread' | 'Groups';

type ConversationFiltersProps = {
  activeFilter?: FilterType;
  filters?: FilterType[];
}

export const ConversationFilters = ({ 
  activeFilter = 'All',
  filters = ['All', 'Recipient Online', 'Unread', 'Groups']
}: ConversationFiltersProps) => {
  return (
    <View style={styles.filtersWrapper}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.filterContainer}
      >
        {filters.map((filter) => (
          <FilterButton 
            key={filter}
            label={filter} 
            isActive={filter === activeFilter} 
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  filtersWrapper: {
    height: 38,
    marginBottom: 16,
  },
  filterContainer: {
    paddingHorizontal: 15,
    gap: 8,
    height: 38,
    alignItems: 'center',
  },
}); 
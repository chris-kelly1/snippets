import { Colors } from "@/constants/theme";
import { User, getAllUsers, searchUsers } from "@/lib/users";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface NewChatModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (selectedUsers: User[], groupName: string) => void;
  currentUser?: User | null;
}

interface UserItemProps {
  user: User;
  onSelect: (user: User) => void;
  isSelected: boolean;
}

const UserItem = ({ user, onSelect, isSelected }: UserItemProps) => {
  return (
    <TouchableOpacity
      style={[styles.userItem, isSelected && styles.selectedUserItem]}
      onPress={() => onSelect(user)}
    >
      <Image
        source={{
          uri:
            user.profile_image ||
            `https://api.dicebear.com/7.x/avataaars/png?seed=${user.email}`,
        }}
        style={styles.userAvatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.display_name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>
      <Ionicons
        name={isSelected ? "checkmark-circle" : "chevron-forward"}
        size={20}
        color={isSelected ? Colors.primary : "#666"}
      />
    </TouchableOpacity>
  );
};

export function NewChatModal({
  visible,
  onClose,
  onSubmit,
  currentUser,
}: NewChatModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    if (visible) {
      loadUsers();
      setSelectedUsers([]);
      setGroupName("");
    }
  }, [visible]);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      loadUsers();
    }
  }, [searchQuery]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await getAllUsers();

      const filteredUsers = allUsers.filter((user) =>
        currentUser ? user.email !== currentUser.email : true
      );

      setUsers(filteredUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setSearching(true);
      const searchResults = await searchUsers(searchQuery);

      const filteredResults = searchResults.filter((user) =>
        currentUser ? user.email !== currentUser.email : true
      );

      setUsers(filteredResults);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUsers((prevSelected) =>
      prevSelected.find((selected) => selected.id === user.id)
        ? prevSelected.filter((selected) => selected.id !== user.id)
        : [...prevSelected, user]
    );
  };

  const handleCreateChat = () => {
    onSubmit(selectedUsers, groupName);
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery("");
    setUsers([]);
    setSelectedUsers([]);
    setGroupName("");
    onClose();
  };

  const renderUser = ({ item }: { item: User }) => (
    <UserItem
      user={item}
      onSelect={handleUserSelect}
      isSelected={selectedUsers.some((selected) => selected.id === item.id)}
    />
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.emptyText}>Loading users...</Text>
        </View>
      );
    }

    if (searchQuery.trim() && users.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={48} color="#666" />
          <Text style={styles.emptyText}>No users found</Text>
          <Text style={styles.emptySubtext}>Try a different search term</Text>
        </View>
      );
    }

    if (users.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="people" size={48} color="#666" />
          <Text style={styles.emptyText}>No other users available</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery.trim()
              ? "No users match your search"
              : "Other users will appear here when they join"}
          </Text>
        </View>
      );
    }

    return null;
  };

  const isCreateButtonEnabled =
    selectedUsers.length > 0 && groupName.trim() !== "";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Start a Group Chat</Text>
            <TouchableOpacity
              onPress={handleCreateChat}
              style={[
                styles.createButton,
                !isCreateButtonEnabled && styles.createButtonDisabled,
              ]}
              disabled={!isCreateButtonEnabled}
            >
              <Text style={styles.createButtonText}>Create Chat</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.groupNameInputContainer}>
            <TextInput
              style={styles.groupNameInput}
              placeholder="Group Name"
              placeholderTextColor="#666"
              value={groupName}
              onChangeText={setGroupName}
            />
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search users..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searching && (
                <ActivityIndicator size="small" color={Colors.primary} />
              )}
            </View>
          </View>

          <View style={styles.usersContainer}>
            {users.length > 0 ? (
              <FlatList
                data={users}
                renderItem={renderUser}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.usersList}
              />
            ) : (
              renderEmptyState()
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    minHeight: "60%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 16,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#282828",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
  },
  usersContainer: {
    flex: 1,
  },
  usersList: {
    padding: 16,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#282828",
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedUserItem: {
    backgroundColor: "rgba(74, 122, 255, 0.2)",
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  groupNameInputContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  groupNameInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#fff",
  },
  createButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    marginLeft: "auto",
  },
  createButtonDisabled: {
    backgroundColor: "#555",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface NewChatModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (emails: string[], groupName: string) => void;
}

export function NewChatModal({
  visible,
  onClose,
  onSubmit,
}: NewChatModalProps) {
  const [email, setEmail] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");

  const handleAddUser = () => {
    if (email.trim() && !emails.includes(email.trim())) {
      setEmails([...emails, email.trim()]);
      setEmail("");
    }
  };

  const handleRemoveUser = (emailToRemove: string) => {
    setEmails(emails.filter((e) => e !== emailToRemove));
  };

  const handleCreateChat = () => {
    if (emails.length > 0) {
      onSubmit(emails, groupName.trim());
      setEmails([]);
      setGroupName("");
      setEmail("");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>New Chat</Text>
          </View>

          <ScrollView style={styles.scrollView}>
            {emails.length > 0 && (
              <View style={styles.groupNameContainer}>
                <TextInput
                  style={styles.groupNameInput}
                  placeholder="Group Chat Name (Optional)"
                  placeholderTextColor="#666"
                  value={groupName}
                  onChangeText={setGroupName}
                />
              </View>
            )}

            <View style={styles.participantsContainer}>
              <Text style={styles.sectionTitle}>Participants</Text>
              {emails.map((email) => (
                <View key={email} style={styles.participantItem}>
                  <Text style={styles.participantEmail}>{email}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveUser(email)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close-circle" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Add participant by email"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <TouchableOpacity
              style={[
                styles.addButton,
                !email.trim() && styles.addButtonDisabled,
              ]}
              onPress={handleAddUser}
              disabled={!email.trim()}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {emails.length > 0 && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateChat}
            >
              <Text style={styles.createButtonText}>Create Chat</Text>
            </TouchableOpacity>
          )}
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
    maxHeight: "80%",
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
  scrollView: {
    maxHeight: 400,
  },
  groupNameContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  groupNameInput: {
    backgroundColor: "#282828",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 16,
  },
  participantsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#282828",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  participantEmail: {
    color: "#fff",
    fontSize: 16,
  },
  removeButton: {
    padding: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  input: {
    flex: 1,
    backgroundColor: "#282828",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 16,
  },
  addButton: {
    backgroundColor: "#95B3FF",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  createButton: {
    backgroundColor: "#95B3FF",
    margin: 16,
    padding: 16,
    borderRadius: 25,
    alignItems: "center",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});

// components/ui/button.tsx

import React from "react";
import {
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";

type Props = PressableProps & {
  title?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export const Button = ({
  title,
  children,
  style,
  textStyle,
  ...props
}: Props) => {
  return (
    <Pressable style={[styles.button, style]} {...props}>
      {title ? <Text style={[styles.text, textStyle]}>{title}</Text> : children}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#000",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

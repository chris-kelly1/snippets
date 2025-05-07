import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";

export default function RootLayout() {
  console.log("RootLayout rendering"); // Debug log

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="launch" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';

interface VoiceRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  onCancel?: () => void;
  maxDurationMs?: number;
  minDurationMs?: number;
}

export default function VoiceRecorder({ 
  onRecordingComplete, 
  onCancel,
  maxDurationMs = 180000, // 3 minutes max
  minDurationMs = 5000    // 5 seconds min
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  
  const recording = useRef<Audio.Recording | null>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permissions to record your voice.');
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
      });

      recording.current = newRecording;
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1000;
          if (newDuration >= maxDurationMs) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording.current) return;

      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }

      setIsRecording(false);
      await recording.current.stopAndUnloadAsync();
      
      const uri = recording.current.getURI();
      recording.current = null;

      if (uri) {
        setRecordingUri(uri);
        
        // Check minimum duration
        if (recordingDuration < minDurationMs) {
          Alert.alert(
            'Recording Too Short', 
            `Please record at least ${minDurationMs / 1000} seconds for better voice quality.`
          );
          return;
        }
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  const playRecording = async () => {
    if (!recordingUri) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Failed to play recording:', error);
      Alert.alert('Error', 'Failed to play recording.');
    }
  };

  const stopPlayback = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
    }
  };

  const confirmRecording = () => {
    if (recordingUri && recordingDuration >= minDurationMs) {
      onRecordingComplete(recordingUri, recordingDuration);
    }
  };

  const cancelRecording = () => {
    setRecordingUri(null);
    setRecordingDuration(0);
    onCancel?.();
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Record Your Voice</Text>
      <Text style={styles.subtitle}>15-30 seconds of clear speech</Text>

      <View style={styles.timerContainer}>
        <Text style={styles.timer}>{formatDuration(recordingDuration)}</Text>
        <Text style={styles.status}>
          {isRecording ? 'Recording...' : recordingUri ? 'Ready to use' : 'Tap to start'}
        </Text>
      </View>

      {!recordingUri ? (
        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordingActive]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Text style={styles.recordButtonText}>
            {isRecording ? 'Stop' : 'Record'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.playButton} onPress={isPlaying ? stopPlayback : playRecording}>
            <Text style={styles.playText}>{isPlaying ? 'Stop' : 'Play'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.retakeButton} onPress={() => {
            setRecordingUri(null);
            setRecordingDuration(0);
          }}>
            <Text style={styles.retakeText}>Retake</Text>
          </TouchableOpacity>
        </View>
      )}

      {recordingUri && (
        <View style={styles.finalActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={cancelRecording}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.useButton, recordingDuration < minDurationMs && styles.useButtonDisabled]}
            onPress={confirmRecording}
            disabled={recordingDuration < minDurationMs}
          >
            <Text style={[styles.useText, recordingDuration < minDurationMs && styles.useTextDisabled]}>
              Use Recording
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 32,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timer: {
    fontSize: 40,
    fontWeight: '300',
    color: '#fff',
    fontFamily: 'monospace',
  },
  status: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  recordButton: {
    backgroundColor: '#ff3333',
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  recordingActive: {
    backgroundColor: '#ff0000',
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  playButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  playText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  retakeButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#555',
  },
  retakeText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  finalActions: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#555',
  },
  cancelText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '500',
  },
  useButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  useButtonDisabled: {
    backgroundColor: '#333',
  },
  useText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  useTextDisabled: {
    color: '#666',
  },
});
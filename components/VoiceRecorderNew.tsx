import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useAudioRecorder, useAudioPlayer, RecordingPresets, AudioModule } from 'expo-audio';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';

interface VoiceRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  onCancel?: () => void;
  maxDurationMs?: number;
  minDurationMs?: number;
}

export default function VoiceRecorderNew({ 
  onRecordingComplete, 
  onCancel,
  maxDurationMs = 180000, // 3 minutes max
  minDurationMs = 5000    // 5 seconds min
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  
  // Refs for timer management
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const maxDurationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Audio recorder with high quality settings for voice
  const audioRecorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    numberOfChannels: 1, // Mono for voice recording
    extension: '.m4a',
    sampleRate: 44100,
    bitRate: 128000,
  });

  // Audio player for playback
  const audioPlayer = useAudioPlayer(recordingUri || undefined);

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await AudioModule.requestRecordingPermissionsAsync();
        setHasPermission(status === 'granted');
        
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required', 
            'Please grant microphone permissions to record your voice.'
          );
        }
      } catch (error) {
        console.error('Error requesting permissions:', error);
        setHasPermission(false);
      }
    })();
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (maxDurationTimeoutRef.current) {
        clearTimeout(maxDurationTimeoutRef.current);
      }
    };
  }, []);

  // Timer management functions
  const startTimer = () => {
    const startTime = Date.now();
    setRecordingStartTime(startTime);
    setRecordingDuration(0);
    
    // Update timer every 100ms for smooth updates
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setRecordingDuration(elapsed);
    }, 100);
    
    // Auto-stop at max duration
    maxDurationTimeoutRef.current = setTimeout(() => {
      stopRecording();
    }, maxDurationMs);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current);
      maxDurationTimeoutRef.current = null;
    }
  };

  const startRecording = async () => {
    if (!hasPermission) {
      Alert.alert('Error', 'Microphone permission not granted');
      return;
    }

    try {
      console.log('🎤 Starting voice recording...');
      
      // Reset state
      setRecordingUri(null);
      setIsRecording(true);

      // Prepare and start recording
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      
      // Start the timer
      startTimer();
      
      console.log('✅ Recording started successfully');
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      setIsRecording(false);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      console.log('⏹️ Stopping voice recording...');
      
      // Stop the timer first
      stopTimer();
      setIsRecording(false);
      
      await audioRecorder.stop();
      
      const uri = audioRecorder.uri;
      if (uri) {
        setRecordingUri(uri);
        console.log('✅ Recording saved to:', uri);
        console.log('⏱️ Recording duration:', recordingDuration, 'ms');
        
        // Check minimum duration
        if (recordingDuration < minDurationMs) {
          Alert.alert(
            'Recording Too Short', 
            `Please record at least ${minDurationMs / 1000} seconds for better voice quality.`
          );
          return;
        }
      } else {
        throw new Error('No recording URI available');
      }
    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
      stopTimer(); // Ensure timer is stopped on error
      setIsRecording(false);
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  const playRecording = async () => {
    if (!recordingUri) return;

    try {
      console.log('▶️ Playing recording...');
      setIsPlaying(true);
      audioPlayer.play();
    } catch (error) {
      console.error('❌ Failed to play recording:', error);
      setIsPlaying(false);
      Alert.alert('Error', 'Failed to play recording.');
    }
  };

  const stopPlayback = async () => {
    try {
      console.log('⏸️ Stopping playback...');
      audioPlayer.pause();
      setIsPlaying(false);
    } catch (error) {
      console.error('❌ Failed to stop playback:', error);
      setIsPlaying(false);
    }
  };

  const confirmRecording = () => {
    if (recordingUri && recordingDuration >= minDurationMs) {
      console.log('✅ Confirming recording:', recordingUri);
      onRecordingComplete(recordingUri, recordingDuration);
    }
  };

  const cancelRecording = () => {
    console.log('❌ Cancelling recording');
    setRecordingUri(null);
    setRecordingDuration(0);
    setIsRecording(false);
    setIsPlaying(false);
    onCancel?.();
  };

  const retakeRecording = () => {
    console.log('🔄 Retaking recording');
    stopTimer(); // Stop any running timer
    setRecordingUri(null);
    setRecordingDuration(0);
    setIsPlaying(false);
    setRecordingStartTime(null);
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Show permission error if needed
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Microphone Access Required</Text>
        <Text style={styles.subtitle}>
          Please enable microphone permissions in your device settings to record your voice.
        </Text>
        <TouchableOpacity style={styles.cancelButton} onPress={cancelRecording}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show loading if permissions not determined
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Requesting Permissions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Record Your Voice</Text>
      <Text style={styles.subtitle}>15-30 seconds of clear speech</Text>

      <View style={styles.timerContainer}>
        <Text style={styles.timer}>{formatDuration(recordingDuration)}</Text>
        <Text style={styles.status}>
          {isRecording 
            ? 'Recording...' 
            : recordingUri 
              ? 'Ready to use' 
              : 'Tap to start'
          }
        </Text>
      </View>

      {!recordingUri ? (
        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordingActive]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={!hasPermission}
        >
          <Text style={styles.recordButtonText}>
            {isRecording ? 'Stop' : 'Record'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.playButton} 
            onPress={isPlaying ? stopPlayback : playRecording}
          >
            <Text style={styles.playText}>{isPlaying ? 'Stop' : 'Play'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.retakeButton} onPress={retakeRecording}>
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
            style={[
              styles.useButton, 
              recordingDuration < minDurationMs && styles.useButtonDisabled
            ]}
            onPress={confirmRecording}
            disabled={recordingDuration < minDurationMs}
          >
            <Text style={[
              styles.useText, 
              recordingDuration < minDurationMs && styles.useTextDisabled
            ]}>
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
    textAlign: 'center',
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
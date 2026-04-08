import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, Key, ArrowLeft, GraduationCap, Info } from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';

export default function LoginOTPScreen() {
  const router = useRouter();
  const { sendOTP, loginWithOTP } = useAuthStore();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isOTPSent, setIsOTPSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Custom Confirmation Modal State
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    confirmStyle?: 'destructive' | 'primary';
    singleButton?: boolean;
  } | null>(null);

  const showConfirm = (config: {
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    confirmStyle?: 'destructive' | 'primary';
    singleButton?: boolean;
  }) => {
    setConfirmModalConfig(config);
    setConfirmModalVisible(true);
  };

  const showNotification = (title: string, message: string, style: 'primary' | 'destructive' = 'primary', onConfirm?: () => void) => {
    showConfirm({
      title,
      message,
      confirmText: 'OK',
      confirmStyle: style,
      onConfirm: onConfirm || (() => { }),
      singleButton: true
    });
  };

  const handleSendOTP = async () => {
    if (!email) {
      showNotification('Error', 'Please enter your email address', 'destructive');
      return;
    }

    setIsLoading(true);
    try {
      await sendOTP(email);
      setIsOTPSent(true);
      showNotification('Success', 'OTP has been sent to your email');
    } catch (error: any) {
      showNotification('Error', error.message, 'destructive');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      showNotification('Error', 'Please enter the 4-digit OTP', 'destructive');
      return;
    }

    setIsLoading(true);
    try {
      await loginWithOTP(email, otp);
      router.replace('/(tabs)');
    } catch (error: any) {
      showNotification('Error', error.message, 'destructive');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#1e293b" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <GraduationCap size={48} color="#6366f1" />
            </View>
            <Text style={styles.title}>OTP Login</Text>
            <Text style={styles.subtitle}>
              {!isOTPSent 
                ? 'Enter your email to receive a one-time password' 
                : 'Enter the 4-digit code sent to your email'}
            </Text>
          </View>

          <View style={styles.form}>
            {!isOTPSent ? (
              <>
                <View style={styles.inputContainer}>
                  <Mail size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor="#94a3b8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onSubmitEditing={handleSendOTP}
                    returnKeyType="send"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.disabledButton]}
                  onPress={handleSendOTP}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? 'Sending...' : 'Send OTP'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <Key size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="4-digit OTP"
                    placeholderTextColor="#94a3b8"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={4}
                    onSubmitEditing={handleVerifyOTP}
                    returnKeyType="done"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.disabledButton]}
                  onPress={handleVerifyOTP}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? 'Verifying...' : 'Login'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => setIsOTPSent(false)}
                  style={styles.resendButton}
                >
                  <Text style={styles.resendText}>Change Email</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Confirmation Modal */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <View style={styles.confirmIconContainer}>
              <Info size={32} color={confirmModalConfig?.confirmStyle === 'destructive' ? "#ef4444" : "#6366f1"} />
            </View>
            <Text style={styles.confirmTitle}>{confirmModalConfig?.title}</Text>
            <Text style={styles.confirmMessage}>{confirmModalConfig?.message}</Text>

            <View style={styles.confirmButtons}>
              {!confirmModalConfig?.singleButton && (
                <TouchableOpacity
                  style={styles.confirmButtonCancel}
                  onPress={() => setConfirmModalVisible(false)}
                >
                  <Text style={styles.confirmButtonCancelText}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.confirmButtonConfirm,
                  confirmModalConfig?.confirmStyle === 'destructive' && styles.confirmButtonDestructive,
                  confirmModalConfig?.singleButton && { flex: 1 }
                ]}
                onPress={() => {
                  setConfirmModalVisible(false);
                  confirmModalConfig?.onConfirm();
                }}
              >
                <Text style={styles.confirmButtonConfirmText}>
                  {confirmModalConfig?.confirmText || 'Confirm'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  confirmIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  confirmButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  confirmButtonConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  confirmButtonDestructive: {
    backgroundColor: '#ef4444',
  },
  confirmButtonConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

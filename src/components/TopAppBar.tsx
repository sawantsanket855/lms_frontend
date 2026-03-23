import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, ShieldCheck, LogOut, ChevronDown } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { useRouter } from 'expo-router';

export const TopAppBar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleLogout = async () => {
    setMenuVisible(false);
    await logout();
    router.replace('/(auth)/login');
  };

  const isIos = Platform.OS === 'ios';

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.leftSection}>
          <Text style={styles.appName}>PLSRD-LMS</Text>
        </View>
        <View style={styles.rightSection}>
          <TouchableOpacity 
            style={styles.userInfo} 
            onPress={() => setMenuVisible(true)}
            activeOpacity={0.7}
          >
            {isAdmin ? (
              <View style={styles.adminBadge}>
                <ShieldCheck size={14} color="#fff" />
                <Text style={styles.adminText}>Admin</Text>
                <ChevronDown size={14} color="#fff" />
              </View>
            ) : (
              <View style={styles.userBadge}>
                <User size={14} color="#6366f1" />
                <Text style={styles.userName}>{user?.name || 'User'}</Text>
                <ChevronDown size={14} color="#6366f1" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[
              styles.dropdownMenu,
              { top: isIos ? 100 : 60 }
            ]}>
              <View style={styles.menuHeader}>
                <Text style={styles.menuUser}>{user?.name || 'User'}</Text>
                <Text style={styles.menuEmail}>{user?.email}</Text>
              </View>
              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <LogOut size={18} color="#ef4444" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#6366f1',
    letterSpacing: 0.5,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  adminText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  userName: {
    color: '#1e293b',
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  dropdownMenu: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  menuHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 4,
  },
  menuUser: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  menuEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
});

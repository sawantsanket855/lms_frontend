import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Pencil,
  ShieldCheck,
  GraduationCap,
  Settings,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';

const INTERESTS = [
  'Programming',
  'Data Science',
  'Web Development',
  'Mobile Development',
  'Design',
  'Business',
  'Marketing',
  'Finance',
  'Leadership',
  'Communication',
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    user?.interests || []
  );
  const [isSaving, setIsSaving] = useState(false);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ name, bio, interests: selectedInterests });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          {!isEditing ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Pencil size={20} color="#6366f1" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setIsEditing(false);
                setName(user?.name || '');
                setBio(user?.profile?.bio || '');
                setSelectedInterests(user?.interests || []);
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          {isEditing ? (
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#94a3b8"
            />
          ) : (
            <Text style={styles.userName}>{user?.name}</Text>
          )}
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            {user?.role === 'admin' ? (
              <ShieldCheck size={14} color="#6366f1" />
            ) : (
              <GraduationCap size={14} color="#6366f1" />
            )}
            <Text style={styles.roleText}>
              {user?.role === 'admin' ? 'Administrator' : 'Student'}
            </Text>
          </View>
        </View>

        {/* Bio Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          {isEditing ? (
            <TextInput
              style={styles.bioInput}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
            />
          ) : (
            <Text style={styles.bioText}>
              {user?.profile?.bio || 'No bio added yet'}
            </Text>
          )}
        </View>

        {/* Interests Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          {isEditing ? (
            <View style={styles.interestsGrid}>
              {INTERESTS.map((interest) => (
                <TouchableOpacity
                  key={interest}
                  style={[
                    styles.interestChip,
                    selectedInterests.includes(interest) &&
                    styles.interestChipSelected,
                  ]}
                  onPress={() => toggleInterest(interest)}
                >
                  <Text
                    style={[
                      styles.interestText,
                      selectedInterests.includes(interest) &&
                      styles.interestTextSelected,
                    ]}
                  >
                    {interest}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.interestsGrid}>
              {user?.interests && user.interests.length > 0 ? (
                user.interests.map((interest) => (
                  <View key={interest} style={styles.interestTag}>
                    <Text style={styles.interestTagText}>{interest}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noInterests}>No interests selected</Text>
              )}
            </View>
          )}
        </View>

        {/* Save Button */}
        {isEditing && (
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Menu Items */}
        {!isEditing && (
          <View style={styles.menuSection}>
            {user?.role === 'admin' && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/admin')}
              >
                <View style={[styles.menuIcon, { backgroundColor: '#eef2ff' }]}>
                  <Settings size={22} color="#6366f1" />
                </View>
                <Text style={styles.menuText}>Admin Panel</Text>
                <ChevronRight size={20} color="#94a3b8" />
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: '#fef3c7' }]}>
                <Bell size={22} color="#f59e0b" />
              </View>
              <Text style={styles.menuText}>Notifications</Text>
              <ChevronRight size={20} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: '#dcfce7' }]}>
                <HelpCircle size={22} color="#22c55e" />
              </View>
              <Text style={styles.menuText}>Help & Support</Text>
              <ChevronRight size={20} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLogout]}
              onPress={handleLogout}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#fee2e2' }]}>
                <LogOut size={22} color="#ef4444" />
              </View>
              <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
              <ChevronRight size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>LMS Platform v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  nameInput: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
    paddingBottom: 4,
    marginBottom: 4,
    minWidth: 150,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  bioInput: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 22,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6366f1',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  interestChipSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  interestText: {
    fontSize: 13,
    color: '#64748b',
  },
  interestTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  interestTag: {
    backgroundColor: '#eef2ff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  interestTagText: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '500',
  },
  noInterests: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  menuSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  menuItemLogout: {
    marginTop: 8,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
  },
  logoutText: {
    color: '#ef4444',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
  },
});

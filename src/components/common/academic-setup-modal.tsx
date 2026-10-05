import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import {
  GraduationCap,
  User,
  BookOpen,
  Target,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  X,
  Layers,
  Award,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { studyStore, StudentProfile, EnrolledCourse } from '../../services/course-study-store';

interface AcademicSetupModalProps {
  visible: boolean;
  onClose?: () => void;
  onSuccess: (profile: StudentProfile) => void;
  canDismiss?: boolean;
}

const POPULAR_UNIVERSITIES = [
  'Federal University of Technology, Minna (FUTMINNA)',
  'University of Lagos (UNILAG)',
  'University of Ibadan (UI)',
  'Obafemi Awolowo University (OAU)',
  'Covenant University',
  'Federal University of Technology, Akure (FUTA)',
  'University of Nigeria, Nsukka (UNN)',
  'Ahmadu Bello University (ABU)',
];

const POPULAR_DEPARTMENTS = [
  'Computer Science',
  'Software Engineering',
  'Cyber Security Science',
  'Information Technology',
  'Electrical & Computer Engineering',
  'Mechanical Engineering',
  'Medicine & Surgery',
  'Law',
  'Economics & Finance',
];

const ACADEMIC_LEVELS = ['100 Level', '200 Level', '300 Level', '400 Level', '500 Level'];

const TARGET_GPAS = [
  '4.90 (First Class Honor)',
  '4.75 (First Class Track)',
  '4.50 (Distinction)',
  '4.00 (Upper Division)',
];

const showAppAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(`${title}\n\n${message}`);
    } else {
      console.warn(`[Alert] ${title}: ${message}`);
    }
  } else {
    Alert.alert(title, message);
  }
};

export function AcademicSetupModal({
  visible,
  onClose,
  onSuccess,
  canDismiss = false,
}: AcademicSetupModalProps) {
  const currentProfile = studyStore.getStudentProfile();

  const [fullName, setFullName] = useState(currentProfile?.fullName || 'Chioma Adebayo');
  const [university, setUniversity] = useState(
    currentProfile?.university || 'Federal University of Technology, Minna (FUTMINNA)'
  );
  const [department, setDepartment] = useState(currentProfile?.department || 'Computer Science');
  const [academicLevel, setAcademicLevel] = useState(currentProfile?.academicLevel || '300 Level');
  const [targetGpa, setTargetGpa] = useState(currentProfile?.targetGpa || '4.85');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Enrolled courses state
  const [courses, setCourses] = useState<EnrolledCourse[]>(
    currentProfile?.enrolledCourses && currentProfile.enrolledCourses.length > 0
      ? currentProfile.enrolledCourses
      : [
          { code: 'CSC 301', title: 'Operating Systems & Concurrency', creditUnits: 3 },
          { code: 'SEN 301', title: 'Software Engineering Architecture', creditUnits: 3 },
          { code: 'MTH 301', title: 'Numerical Methods & Analysis', creditUnits: 3 },
          { code: 'CSC 305', title: 'Database Systems & SQL', creditUnits: 3 },
        ]
  );

  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');

  const handleAddCourse = () => {
    setErrorMessage(null);
    if (!newCourseCode.trim() || !newCourseTitle.trim()) {
      showAppAlert('Incomplete Course', 'Please enter both the course code (e.g. CSC 301) and title.');
      return;
    }
    const cleanCode = newCourseCode.trim().toUpperCase();
    if (courses.some((c) => c.code.toUpperCase() === cleanCode)) {
      showAppAlert('Duplicate Course', `Course ${cleanCode} is already in your study deck.`);
      return;
    }
    setCourses([
      ...courses,
      { code: cleanCode, title: newCourseTitle.trim(), creditUnits: 3 },
    ]);
    setNewCourseCode('');
    setNewCourseTitle('');
  };

  const handleRemoveCourse = (code: string) => {
    setErrorMessage(null);
    if (courses.length <= 1) {
      showAppAlert('At Least One Course', 'Please maintain at least one course in your cram curriculum.');
      return;
    }
    setCourses(courses.filter((c) => c.code !== code));
  };

  const handleAutoSuggest = () => {
    setErrorMessage(null);
    if (department.includes('Software')) {
      setCourses([
        { code: 'SEN 301', title: 'Software Engineering Architecture', creditUnits: 3 },
        { code: 'SEN 303', title: 'Software Testing & Quality Assurance', creditUnits: 3 },
        { code: 'CSC 301', title: 'Operating Systems & Concurrency', creditUnits: 3 },
        { code: 'CSC 305', title: 'Database Systems & SQL', creditUnits: 3 },
      ]);
    } else if (department.includes('Cyber')) {
      setCourses([
        { code: 'CYB 301', title: 'Network Security & Cryptography', creditUnits: 3 },
        { code: 'CYB 303', title: 'Ethical Hacking & Vulnerability Analysis', creditUnits: 3 },
        { code: 'CSC 301', title: 'Operating Systems Architecture', creditUnits: 3 },
        { code: 'CSC 307', title: 'Data Communications', creditUnits: 3 },
      ]);
    } else if (department.includes('Law')) {
      setCourses([
        { code: 'PUL 301', title: 'Constitutional Law', creditUnits: 4 },
        { code: 'CIL 301', title: 'Commercial Transactions', creditUnits: 4 },
        { code: 'JUR 301', title: 'Jurisprudence & Legal Theory', creditUnits: 3 },
      ]);
    } else {
      setCourses([
        { code: 'CSC 301', title: 'Operating Systems & Concurrency', creditUnits: 3 },
        { code: 'SEN 301', title: 'Software Engineering Architecture', creditUnits: 3 },
        { code: 'MTH 301', title: 'Numerical Methods & Analysis', creditUnits: 3 },
        { code: 'CSC 305', title: 'Database Systems & SQL', creditUnits: 3 },
      ]);
    }
  };

  const handleSubmit = () => {
    setErrorMessage(null);

    const cleanName = fullName.trim() || 'Student Scholar';
    const cleanUni = university.trim() || 'Federal University of Technology, Minna (FUTMINNA)';
    const cleanDept = department.trim() || 'Computer Science';
    const activeCourses =
      courses.length > 0
        ? courses
        : [
            { code: 'CSC 301', title: 'Operating Systems & Concurrency', creditUnits: 3 },
            { code: 'SEN 301', title: 'Software Engineering Architecture', creditUnits: 3 },
            { code: 'MTH 301', title: 'Numerical Methods & Analysis', creditUnits: 3 },
            { code: 'CSC 305', title: 'Database Systems & SQL', creditUnits: 3 },
          ];

    const newProfile: StudentProfile = {
      fullName: cleanName,
      university: cleanUni,
      department: cleanDept,
      academicLevel: academicLevel || '300 Level',
      targetGpa: targetGpa.split(' ')[0] || targetGpa || '4.85',
      enrolledCourses: activeCourses,
      hasCompletedOnboarding: true,
    };

    studyStore.setStudentProfile(newProfile);
    onSuccess(newProfile);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => {
        if (canDismiss && onClose) onClose();
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-black/75 justify-end"
      >
        <BlurView intensity={35} tint="dark" pointerEvents="none" className="absolute inset-0" />

        <Animated.View
          entering={FadeInUp.duration(450).springify().damping(14)}
          className="bg-[#001524] rounded-t-3xl max-h-[92%] border-t border-white/15 overflow-hidden shadow-2xl"
        >
          {/* Header Bar */}
          <View className="px-5 pt-5 pb-4 border-b border-white/10 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5">
              <View className="w-9 h-9 rounded-xl bg-[#ffa200]/20 border border-[#ffa200]/40 items-center justify-center">
                <GraduationCap size={20} color="#ffa200" />
              </View>
              <View>
                <Text className="text-white text-base font-bold tracking-tight">
                  Academic Profile Setup
                </Text>
                <Text className="text-zinc-400 text-xs">
                  Eliminate generic data • Personalize your cram hub
                </Text>
              </View>
            </View>

            {canDismiss && onClose && (
              <TouchableOpacity
                onPress={onClose}
                className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
              >
                <X size={16} color="#e4e4e7" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            className="px-5 py-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 60 }}
          >
            {/* Field: Full Name */}
            <View className="mb-4">
              <Text className="text-xs font-bold uppercase tracking-wider text-[#ffa200] mb-1.5">
                Full Name
              </Text>
              <View className="flex-row items-center bg-white/5 border border-white/10 rounded-xl px-3.5 py-3">
                <User size={16} color="#a1a1aa" className="mr-2.5" />
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="e.g. Chioma Adebayo or Alex Johnson"
                  placeholderTextColor="#71717a"
                  className="flex-1 text-white text-sm font-medium ml-2"
                />
              </View>
            </View>

            {/* Field: University */}
            <View className="mb-4">
              <Text className="text-xs font-bold uppercase tracking-wider text-[#ffa200] mb-1.5">
                University / Institution
              </Text>
              <View className="flex-row items-center bg-white/5 border border-white/10 rounded-xl px-3.5 py-3 mb-2">
                <GraduationCap size={16} color="#a1a1aa" className="mr-2.5" />
                <TextInput
                  value={university}
                  onChangeText={setUniversity}
                  placeholder="Enter your university or college name"
                  placeholderTextColor="#71717a"
                  className="flex-1 text-white text-sm font-medium ml-2"
                />
              </View>
              {/* Quick Institution Pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5 py-1">
                {POPULAR_UNIVERSITIES.slice(0, 5).map((uni) => (
                  <TouchableOpacity
                    key={uni}
                    onPress={() => setUniversity(uni)}
                    className={`px-3 py-1.5 rounded-full border mr-1.5 ${
                      university === uni
                        ? 'bg-[#ffa200]/25 border-[#ffa200]'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-semibold ${
                        university === uni ? 'text-[#ffa200]' : 'text-zinc-400'
                      }`}
                    >
                      {uni.includes('(') ? uni.split('(')[1].replace(')', '') : uni.slice(0, 14)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Field: Department */}
            <View className="mb-4">
              <Text className="text-xs font-bold uppercase tracking-wider text-[#ffa200] mb-1.5">
                Department / Field of Study
              </Text>
              <View className="flex-row items-center bg-white/5 border border-white/10 rounded-xl px-3.5 py-3 mb-2">
                <BookOpen size={16} color="#a1a1aa" className="mr-2.5" />
                <TextInput
                  value={department}
                  onChangeText={setDepartment}
                  placeholder="e.g. Computer Science, Software Engineering"
                  placeholderTextColor="#71717a"
                  className="flex-1 text-white text-sm font-medium ml-2"
                />
              </View>
              {/* Quick Department Pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5 py-1">
                {POPULAR_DEPARTMENTS.slice(0, 5).map((dept) => (
                  <TouchableOpacity
                    key={dept}
                    onPress={() => setDepartment(dept)}
                    className={`px-3 py-1.5 rounded-full border mr-1.5 ${
                      department === dept
                        ? 'bg-[#ffa200]/25 border-[#ffa200]'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-semibold ${
                        department === dept ? 'text-[#ffa200]' : 'text-zinc-400'
                      }`}
                    >
                      {dept}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Field: Academic Level & Target GPA Row */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-xs font-bold uppercase tracking-wider text-[#ffa200] mb-1.5">
                  Academic Level
                </Text>
                <View className="bg-white/5 border border-white/10 rounded-xl p-1.5">
                  {ACADEMIC_LEVELS.slice(0, 3).map((lvl) => (
                    <TouchableOpacity
                      key={lvl}
                      onPress={() => setAcademicLevel(lvl)}
                      className={`py-2 px-2.5 rounded-lg mb-1 flex-row items-center justify-between ${
                        academicLevel === lvl ? 'bg-[#ffa200]/20 border border-[#ffa200]/30' : ''
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          academicLevel === lvl ? 'text-[#ffa200]' : 'text-zinc-300'
                        }`}
                      >
                        {lvl}
                      </Text>
                      {academicLevel === lvl && <CheckCircle2 size={14} color="#ffa200" />}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="flex-1">
                <Text className="text-xs font-bold uppercase tracking-wider text-[#ffa200] mb-1.5">
                  Target GPA
                </Text>
                <View className="bg-white/5 border border-white/10 rounded-xl p-1.5">
                  {TARGET_GPAS.slice(0, 3).map((gpa) => {
                    const isSelected = targetGpa.startsWith(gpa.slice(0, 4));
                    return (
                      <TouchableOpacity
                        key={gpa}
                        onPress={() => setTargetGpa(gpa.slice(0, 4))}
                        className={`py-2 px-2.5 rounded-lg mb-1 flex-row items-center justify-between ${
                          isSelected ? 'bg-emerald-500/20 border border-emerald-500/30' : ''
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            isSelected ? 'text-emerald-300' : 'text-zinc-300'
                          }`}
                        >
                          {gpa.split(' ')[0]}
                        </Text>
                        {isSelected && <Award size={14} color="#34d399" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Field: Enrolled Courses */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-bold uppercase tracking-wider text-[#ffa200]">
                  Your Semester Courses ({courses.length})
                </Text>
                <TouchableOpacity
                  onPress={handleAutoSuggest}
                  className="flex-row items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full border border-white/15"
                >
                  <Sparkles size={11} color="#38bdf8" />
                  <Text className="text-[10px] font-bold text-sky-300">
                    Auto-Suggest
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Active Courses List */}
              <View className="gap-2 mb-3">
                {courses.map((course, idx) => (
                  <View
                    key={course.code + idx}
                    className="flex-row items-center justify-between bg-white/5 border border-white/10 p-3 rounded-xl"
                  >
                    <View className="flex-row items-center gap-2.5 flex-1">
                      <View className="w-8 h-8 rounded-lg bg-[#ffa200]/20 items-center justify-center">
                        <Layers size={14} color="#ffa200" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white text-xs font-bold">
                          {course.code}
                        </Text>
                        <Text className="text-zinc-400 text-[11px] truncate" numberOfLines={1}>
                          {course.title}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleRemoveCourse(course.code)}
                      className="p-1.5 rounded-lg bg-red-500/10 ml-2"
                    >
                      <Trash2 size={14} color="#f87171" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Add New Course Input */}
              <View className="bg-white/5 border border-white/10 p-3 rounded-xl">
                <Text className="text-zinc-300 text-xs font-semibold mb-2">
                  + Add Custom Course
                </Text>
                <View className="flex-row gap-2 mb-2">
                  <TextInput
                    value={newCourseCode}
                    onChangeText={setNewCourseCode}
                    placeholder="Code (e.g. MTH 301)"
                    placeholderTextColor="#71717a"
                    className="w-1/3 bg-black/30 border border-white/10 rounded-lg px-2.5 py-2 text-white text-xs font-bold"
                  />
                  <TextInput
                    value={newCourseTitle}
                    onChangeText={setNewCourseTitle}
                    placeholder="Title (e.g. Numerical Analysis)"
                    placeholderTextColor="#71717a"
                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-2.5 py-2 text-white text-xs"
                  />
                </View>
                <TouchableOpacity
                  onPress={handleAddCourse}
                  className="bg-white/15 py-2 rounded-lg items-center flex-row justify-center gap-1.5"
                >
                  <Plus size={14} color="#ffffff" />
                  <Text className="text-white text-xs font-bold">Add to My Study Deck</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Validation / Notice Message if any */}
            {errorMessage ? (
              <View className="mb-4 bg-red-500/15 border border-red-500/30 p-3 rounded-xl flex-row items-center gap-2">
                <Text className="text-red-300 text-xs font-semibold flex-1">
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {/* Launch CTA */}
            <TouchableOpacity
              onPress={handleSubmit}
              activeOpacity={0.85}
              role="button"
              accessibilityRole="button"
              style={{ cursor: 'pointer' } as any}
              className="w-full bg-[#ffa200] py-4 rounded-2xl flex-row items-center justify-center gap-2 shadow-lg shadow-[#ffa200]/25"
            >
              <Sparkles size={18} color="#001524" />
              <Text className="text-[#001524] font-black text-sm uppercase tracking-wider">
                Launch My Personal Cram Hub
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

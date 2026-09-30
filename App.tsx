import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';

// ==========================================
// 1. معلومات الإصدار والبناء (App Version & Build)
// ==========================================
export const APP_CONFIG = {
  version: "1.0.1",
  buildNumber: 2,
  appName: "نظام تقييم الأداء الشامل 360",
  lastUpdated: "2026-09-30"
};

// ==========================================
// 2. الأنواع والواجهات (TypeScript Interfaces)
// ==========================================
export interface Employee {
  id: string; // الرقم الوظيفي
  name: string;
  jobTitle: string;
  jobGrade: string;
  department: string;
  administration: string;
  formType: 'administrative' | 'technical';
  password?: string;
}

export interface EvaluationQuestion {
  id: string;
  text: string;
  category: string;
  weight: number;
}

export interface EvaluationForm {
  id: string;
  title: string;
  type: 'self' | 'peer' | 'manager' | 'subordinate';
  questions: EvaluationQuestion[];
}

export interface EvaluationResult {
  id: string;
  evaluatorId: string;
  evaluatorName: string;
  targetId: string;
  targetName: string;
  type: 'self' | 'peer' | 'manager' | 'subordinate';
  date: string;
  scores: { [questionId: string]: number };
  totalScore: number;
  notes?: string;
}

// ==========================================
// 3. البيانات الأولية الافتراضية (Default Data)
// ==========================================
const DEFAULT_EMPLOYEES: Employee[] = [
  { id: "101", name: "ميثاق عبده علي", jobTitle: "مسؤول الخدمات والإدارة", jobGrade: "10", department: "الخدمات الإدارية", administration: "الإدارة العامة", formType: "administrative", password: "000" },
  { id: "102", name: "أحمد علي سالم", jobTitle: "أخصائي إدارة أسطول", jobGrade: "08", department: "الخدمات الإدارية", administration: "إدارة اللوجستيات", formType: "administrative", password: "000" },
  { id: "103", name: "سعيد محمد أحمد", jobTitle: "مهندس صيانة تشغيلية", jobGrade: "09", department: "الصيانة", administration: "الإدارة الفنية", formType: "technical", password: "000" },
  { id: "104", name: "فؤاد عبد الله", jobTitle: "مشرف جودة وصيانة", jobGrade: "07", department: "الصيانة", administration: "الإدارة الفنية", formType: "technical", password: "000" },
  { id: "105", name: "خالد مرتضى سيف", jobTitle: "محاسب تكاليف", jobGrade: "08", department: "الحسابات", administration: "الإدارة المالية", formType: "administrative", password: "000" },
  { id: "106", name: "مختار عبده علي", jobTitle: "سائق أسطول ممتاز", jobGrade: "05", department: "الحركة والأسطول", administration: "إدارة اللوجستيات", formType: "technical", password: "000" },
];

const DEFAULT_QUESTIONS: EvaluationQuestion[] = [
  { id: "q1", text: "الالتزام بمواعيد العمل والدقة في تنفيذ المهام الموكلة", category: "الانضباط والإنتاجية", weight: 20 },
  { id: "q2", text: "التعاون مع أعضاء الفريق والعمل الجماعي بفعالية", category: "العلاقات والعمل الجماعي", weight: 20 },
  { id: "q3", text: "قدرة حل المشكلات والتصرف في المواقف الطارئة", category: "الكفاءة والمهارة", weight: 20 },
  { id: "q4", text: "المبادرة والتطوير الذاتي واقتراح حلول ملموسة", category: "الإبداع والتطوير", weight: 20 },
  { id: "q5", text: "التواصل الفعال والمحافظة على بيئة عمل إيجابية", category: "التواصل والقيادة", weight: 20 },
];

// ==========================================
// 4. المكون الرئيسي للتطبيق (App Component)
// ==========================================
export default function App() {
  // حالات تسجيل الدخول والمستخدم الحالي
  const [userRole, setUserRole] = useState<'guest' | 'user' | 'admin'>('guest');
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginMode, setLoginMode] = useState<'user' | 'admin'>('user');

  // قاعدة بيانات التطبيق (في الذاكرة)
  const [employees, setEmployees] = useState<Employee[]>(DEFAULT_EMPLOYEES);
  const [evaluations, setEvaluations] = useState<EvaluationResult[]>([]);
  const [customForms, setCustomForms] = useState<EvaluationForm[]>([]);

  // الشاشات والنوافذ المنبثقة
  const [activeTab, setActiveTab] = useState<'dashboard' | 'db_import' | 'encoding' | 'change_pass' | 'reports'>('dashboard');
  const [evalModalVisible, setEvalModalVisible] = useState(false);
  const [evalType, setEvalType] = useState<'self' | 'peer' | 'manager' | 'subordinate'>('self');
  const [targetEmployee, setTargetEmployee] = useState<Employee | null>(null);
  
  // شاشة تغيير كلمة المرور
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // استمارة التقييم الحالية
  const [evalScores, setEvalScores] = useState<{ [key: string]: number }>({});
  const [evalNotes, setEvalNotes] = useState('');

  // الزملاء الأربعة العشوائيين للتقييم
  const [peerList, setPeerList] = useState<Employee[]>([]);

  // اختيار الزملاء العشوائيين عند تسجيل الدخول أو اختيار تقييم زميل
  useEffect(() => {
    if (currentUser) {
      const others = employees.filter(e => e.id !== currentUser.id);
      const shuffled = [...others].sort(() => 0.5 - Math.random());
      setPeerList(shuffled.slice(0, 4));
    }
  }, [currentUser, employees]);

  // دالة تسجيل الدخول
  const handleLogin = () => {
    if (!usernameInput || !passwordInput) {
      Alert.alert("تنبيه", "يرجى إدخال اسم المستخدم / الرقم الوظيفي وكلمة المرور.");
      return;
    }

    if (loginMode === 'admin') {
      if (usernameInput === 'ميثاق' && passwordInput === '000') {
        setUserRole('admin');
        setCurrentUser({
          id: "000",
          name: "المسؤول ميثاق",
          jobTitle: "مدير النظام",
          jobGrade: "VIP",
          department: "الإدارة العامة",
          administration: "إدارة النظام",
          formType: "administrative"
        });
        setActiveTab('reports');
        Alert.alert("مرحباً بك", "تم تسجيل الدخول بنجاح كمسؤول للنظام.");
      } else {
        Alert.alert("خطأ", "اسم المسؤول أو كلمة المرور غير صحيحة.");
      }
    } else {
      const found = employees.find(e => e.id === usernameInput);
      if (found) {
        const userPass = found.password || "000";
        if (passwordInput === userPass) {
          setUserRole('user');
          setCurrentUser(found);
          setActiveTab('dashboard');
          Alert.alert("أهلاً بك", `مرحباً بك الموظف: ${found.name}`);
        } else {
          Alert.alert("خطأ", "كلمة المرور غير صحيحة (كلمة المرور الافتراضية هي 000).");
        }
      } else {
        Alert.alert("خطأ", "الرقم الوظيفي غير موجود في قاعدة بيانات الموظفين.");
      }
    }
  };

  // دالة تسجيل الخروج
  const handleLogout = () => {
    setUserRole('guest');
    setCurrentUser(null);
    setUsernameInput('');
    setPasswordInput('');
  };

  // دالة تغيير كلمة المرور للمستخدم
  const handleChangePassword = () => {
    if (!newPassword || newPassword.length < 3) {
      Alert.alert("تنبيه", "يرجى إدخال كلمة مرور صالحة لا تقل عن 3 أرقام.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("خطأ", "كلمتا المرور غير متطابقتين.");
      return;
    }
    if (currentUser) {
      const updated = employees.map(e => e.id === currentUser.id ? { ...e, password: newPassword } : e);
      setEmployees(updated);
      setCurrentUser({ ...currentUser, password: newPassword });
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert("نجاح", "تم تعديل كلمة المرور بنجاح!");
    }
  };

  // دالة محاكاة استيراد قاعدة بيانات الموظفين
  const handleImportDatabase = () => {
    Alert.alert(
      "استيراد قاعدة البيانات",
      "تم استيراد تحديثات قاعدة البيانات وتحديث قائمة الموظفين والأقسام بنجاح! (عدد الموظفين المحملين: " + employees.length + ")",
      [{ text: "تم" }]
    );
  };

  // دالة فتح تقييم
  const startEvaluation = (type: 'self' | 'peer' | 'manager' | 'subordinate', target?: Employee) => {
    setEvalType(type);
    if (type === 'self') {
      setTargetEmployee(currentUser);
    } else {
      setTargetEmployee(target || null);
    }
    setEvalScores({});
    setEvalNotes('');
    setEvalModalVisible(true);
  };

  // تقديم التقييم
  const submitEvaluation = () => {
    if (!targetEmployee || !currentUser) return;
    
    // حساب المجموع
    let sum = 0;
    DEFAULT_QUESTIONS.forEach(q => {
      sum += (evalScores[q.id] || 0);
    });
    const totalScore = Math.round((sum / (DEFAULT_QUESTIONS.length * 5)) * 100);

    const newResult: EvaluationResult = {
      id: Date.now().toString(),
      evaluatorId: currentUser.id,
      evaluatorName: currentUser.name,
      targetId: targetEmployee.id,
      targetName: targetEmployee.name,
      type: evalType,
      date: new Date().toISOString().split('T')[0],
      scores: evalScores,
      totalScore: totalScore,
      notes: evalNotes
    };

    setEvaluations([...evaluations, newResult]);
    setEvalModalVisible(false);
    Alert.alert("تم بنجاح", `تم تسجيل التقييم للزميل/الموظف (${targetEmployee.name}) بنجاح بنسبة: ${totalScore}%`);
  };

  // ==========================================
  // 5. واجهة تسجيل الدخول (Login Screen)
  // ==========================================
  if (userRole === 'guest') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a365d" />
        <View style={styles.headerBanner}>
          <Text style={styles.headerTitle}>{APP_CONFIG.appName}</Text>
          <Text style={styles.headerSubtitle}>الإصدار v{APP_CONFIG.version} (البناء: {APP_CONFIG.buildNumber})</Text>
        </View>

        <ScrollView contentContainerStyle={styles.loginContainer}>
          <View style={styles.loginBox}>
            <Text style={styles.loginTitle}>تسجيل الدخول للنظام</Text>
            
            {/* مفتاح التبديل بين حساب الموظف والمسؤول */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleBtn, loginMode === 'user' && styles.toggleActive]}
                onPress={() => setLoginMode('user')}
              >
                <Text style={[styles.toggleText, loginMode === 'user' && styles.toggleTextActive]}>حساب موظف</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, loginMode === 'admin' && styles.toggleActive]}
                onPress={() => setLoginMode('admin')}
              >
                <Text style={[styles.toggleText, loginMode === 'admin' && styles.toggleTextActive]}>حساب المسؤول</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>
              {loginMode === 'admin' ? "اسم المسؤول:" : "الرقم الوظيفي (اسم المستخدم):"}
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={loginMode === 'admin' ? "أدخل اسم المسؤول (ميثاق)" : "أدخل الرقم الوظيفي (مثال: 101)"}
              value={usernameInput}
              onChangeText={setUsernameInput}
              keyboardType={loginMode === 'user' ? "numeric" : "default"}
            />

            <Text style={styles.inputLabel}>كلمة المرور:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="أدخل كلمة المرور (الافتراضية: 000)"
              secureTextEntry
              value={passwordInput}
              onChangeText={setPasswordInput}
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
              <Text style={styles.primaryButtonText}>دخول إلى النظام</Text>
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>💡 تعليمات سريعة:</Text>
              <Text style={styles.infoSubText}>• حساب المسؤول: اسم المستخدم (ميثاق)، كلمة المرور (000)</Text>
              <Text style={styles.infoSubText}>• حساب الموظف: الرقم الوظيفي (مثال: 101)، كلمة المرور الافتراضية (000)</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ==========================================
  // 6. واجهة المستخدم والمسؤول الرئيسية
  // ==========================================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a365d" />
      
      {/* شريط الإحاطة العلوي */}
      <View style={styles.topBar}>
        <View style={{ alignItems: 'flex-start' }}>
          <Text style={styles.topBarUser}>{currentUser?.name}</Text>
          <Text style={styles.topBarRole}>{userRole === 'admin' ? "مدير النظام" : `موظف - ${currentUser?.jobTitle}`}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>خروج</Text>
        </TouchableOpacity>
      </View>

      {/* شريط التبويب العلوي */}
      <View style={styles.tabBar}>
        {userRole === 'user' && (
          <>
            <TouchableOpacity style={[styles.tabItem, activeTab === 'dashboard' && styles.tabItemActive]} onPress={() => setActiveTab('dashboard')}>
              <Text style={[styles.tabText, activeTab === 'dashboard' && styles.tabTextActive]}>التقييمات</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabItem, activeTab === 'db_import' && styles.tabItemActive]} onPress={() => setActiveTab('db_import')}>
              <Text style={[styles.tabText, activeTab === 'db_import' && styles.tabTextActive]}>استيراد البيانات</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabItem, activeTab === 'encoding' && styles.tabItemActive]} onPress={() => setActiveTab('encoding')}>
              <Text style={[styles.tabText, activeTab === 'encoding' && styles.tabTextActive]}>ترنيز الاستمارات</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabItem, activeTab === 'change_pass' && styles.tabItemActive]} onPress={() => setActiveTab('change_pass')}>
              <Text style={[styles.tabText, activeTab === 'change_pass' && styles.tabTextActive]}>كلمة المرور</Text>
            </TouchableOpacity>
          </>
        )}

        {userRole === 'admin' && (
          <>
            <TouchableOpacity style={[styles.tabItem, activeTab === 'reports' && styles.tabItemActive]} onPress={() => setActiveTab('reports')}>
              <Text style={[styles.tabText, activeTab === 'reports' && styles.tabTextActive]}>تقارير التقييمات</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabItem, activeTab === 'db_import' && styles.tabItemActive]} onPress={() => setActiveTab('db_import')}>
              <Text style={[styles.tabText, activeTab === 'db_import' && styles.tabTextActive]}>قاعدة البيانات</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabItem, activeTab === 'encoding' && styles.tabItemActive]} onPress={() => setActiveTab('encoding')}>
              <Text style={[styles.tabText, activeTab === 'encoding' && styles.tabTextActive]}>تكويد الاستمارات</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* محتوى الشاشات */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        
        {/* === شاشة التقييمات للمستخدم === */}
        {userRole === 'user' && activeTab === 'dashboard' && (
          <View>
            <Text style={styles.sectionTitle}>📌 استمارات وأيقونات تقييم الأداء 360 درجة</Text>
            
            {/* الأيقونات الأربع الرئيسية */}
            <View style={styles.gridContainer}>
              <TouchableOpacity style={[styles.cardIcon, { backgroundColor: '#2b6cb0' }]} onPress={() => startEvaluation('self')}>
                <Text style={styles.cardIconEmoji}>👤</Text>
                <Text style={styles.cardIconTitle}>تقييم ذاتي</Text>
                <Text style={styles.cardIconSub}>تقييم أداء نفسك مباشرة</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.cardIcon, { backgroundColor: '#2c7a7b' }]} onPress={() => {
                if (peerList.length > 0) {
                  startEvaluation('peer', peerList[0]);
                } else {
                  Alert.alert("تنبيه", "لا يوجد زملاء متاحين للتقييم حالياً.");
                }
              }}>
                <Text style={styles.cardIconEmoji}>👥</Text>
                <Text style={styles.cardIconTitle}>تقييم زميل</Text>
                <Text style={styles.cardIconSub}>تقييم الزملاء المتاحين</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.cardIcon, { backgroundColor: '#c05621' }]} onPress={() => startEvaluation('manager', employees[0])}>
                <Text style={styles.cardIconEmoji}>👔</Text>
                <Text style={styles.cardIconTitle}>تقييم الرئيس</Text>
                <Text style={styles.cardIconSub}>تقييم رئيسك المباشر</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.cardIcon, { backgroundColor: '#6b46c1' }]} onPress={() => startEvaluation('subordinate', employees[3])}>
                <Text style={styles.cardIconEmoji}>🎖️</Text>
                <Text style={styles.cardIconTitle}>تقييم المرؤوس</Text>
                <Text style={styles.cardIconSub}>تقييم الموظفين المرؤوسين</Text>
              </TouchableOpacity>
            </View>

            {/* قسم الزملاء الأربعة العشوائيين */}
            <View style={styles.peerSection}>
              <Text style={styles.peerTitle}>🎯 قائمة (4) زملاء تم اختيارهم عشوائياً لتقييمهم:</Text>
              {peerList.map((peer, idx) => (
                <View key={peer.id} style={styles.peerCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.peerName}>{idx + 1}. {peer.name}</Text>
                    <Text style={styles.peerSub}>المسمى: {peer.jobTitle} | الرقم: {peer.id}</Text>
                  </View>
                  <TouchableOpacity style={styles.peerBtn} onPress={() => startEvaluation('peer', peer)}>
                    <Text style={styles.peerBtnText}>تقييم الان</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* === شاشة استيراد قاعدة بيانات الموظفين === */}
        {activeTab === 'db_import' && (
          <View style={styles.cardBox}>
            <Text style={styles.sectionTitle}>📂 استيراد وإدارة قاعدة بيانات الموظفين</Text>
            <Text style={styles.cardDesc}>
              تسمح هذه الخاصية برفع واستيراد بيانات الموظفين (الرقم الوظيفي، الاسم، الدرجة، القسم، الإدارة) من ملفات خارجية مثل Excel أو CSV.
            </Text>
            
            <TouchableOpacity style={styles.primaryButton} onPress={handleImportDatabase}>
              <Text style={styles.primaryButtonText}>📥 استيراد قاعدة البيانات الآن</Text>
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>📋 قائمة الموظفين الحالية المسجلة ({employees.length}):</Text>
            {employees.map(e => (
              <View key={e.id} style={styles.empRow}>
                <Text style={styles.empTextBold}>[{e.id}] {e.name}</Text>
                <Text style={styles.empTextSub}>{e.jobTitle} - {e.department} ({e.administration})</Text>
              </View>
            ))}
          </View>
        )}

        {/* === شاشة تكويد وترميز استمارات التقييم === */}
        {activeTab === 'encoding' && (
          <View style={styles.cardBox}>
            <Text style={styles.sectionTitle}>⚙️ تكويد وترميز استمارات التقييم</Text>
            <Text style={styles.cardDesc}>
              يمكنك استيراد استمارات جديدة من ملفات (Excel, Word, PDF) أو إنشاء استمارات وتقسيم أسئلة مخصصة داخل التطبيق مباشرة.
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 }}>
              <TouchableOpacity style={[styles.secondaryBtn, { flex: 0.48 }]} onPress={() => Alert.alert("استيراد", "تم اختيار استيراد استمارة من ملف Word/Excel/PDF")}>
                <Text style={styles.secondaryBtnText}>📁 استيراد ملف</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.secondaryBtn, { flex: 0.48, backgroundColor: '#2b6cb0' }]} onPress={() => Alert.alert("إنشاء", "فتح نموذج تصميم استمارة جديدة")}>
                <Text style={[styles.secondaryBtnText, { color: '#fff' }]}>➕ إنشاء استمارة</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 15 }]}>📜 الاستمارات المكوّدة المتاحة حالياً:</Text>
            <View style={styles.formItem}>
              <Text style={styles.formTitle}>1. استمارة التقييم الإداري 360 (افتراضية)</Text>
              <Text style={styles.formSub}>تتضمن 5 محاور قياسية للتقييم الذاتي والزملاء.</Text>
            </View>
            <View style={styles.formItem}>
              <Text style={styles.formTitle}>2. استمارة التقييم الفني والميداني</Text>
              <Text style={styles.formSub}>مخصصة للوظائف الفنية والأسطول والصيانة.</Text>
            </View>
          </View>
        )}

        {/* === شاشة تقارير التقييمات للمسؤول === */}
        {activeTab === 'reports' && (
          <View style={styles.cardBox}>
            <Text style={styles.sectionTitle}>📊 تقارير تقييمات الأداء الشاملة</Text>
            <Text style={styles.cardDesc}>
              يمكن للمسؤول الاطلاع على نتائج التقييمات لجميع الموظفين وتصدير التقرير كملفات Excel أو PDF.
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, marginVertical: 10 }}>
              <TouchableOpacity style={[styles.primaryButton, { flex: 1, backgroundColor: '#276749' }]} onPress={() => Alert.alert("تصدير Excel", "تم تصدير تقرير التقييمات بصيغة Excel بنجاح!")}>
                <Text style={styles.primaryButtonText}>📊 تصدير Excel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, { flex: 1, backgroundColor: '#9b2c2c' }]} onPress={() => Alert.alert("تصدير PDF", "تم تصدير التقرير بصيغة PDF بنجاح!")}>
                <Text style={styles.primaryButtonText}>📄 تصدير PDF</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 15 }]}>📝 سجل التقييمات الأخيرة المسجلة ({evaluations.length}):</Text>
            {evaluations.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#718096', marginVertical: 20 }}>لا توجد تقييمات مسجلة حتى الآن. قم بإجراء تقييم لتظهر النتائج هنا.</Text>
            ) : (
              evaluations.map((item) => (
                <View key={item.id} style={styles.reportCard}>
                  <Text style={styles.reportTitle}>المقيّم: {item.evaluatorName} ➔ المقيَّم: {item.targetName}</Text>
                  <Text style={styles.reportSub}>النوع: {item.type} | التاريخ: {item.date}</Text>
                  <Text style={styles.reportScore}>النتيجة الإجمالية: {item.totalScore}%</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* === شاشة تغيير كلمة المرور للموظف === */}
        {userRole === 'user' && activeTab === 'change_pass' && (
          <View style={styles.cardBox}>
            <Text style={styles.sectionTitle}>🔐 تعديل كلمة المرور الشخصية</Text>
            <Text style={styles.cardDesc}>يمكنك تغيير كلمة المرور الخاصة بك من كلمة المرور الافتراضية (000) إلى كلمة مرور جديدة.</Text>

            <Text style={styles.inputLabel}>كلمة المرور الجديدة:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="أدخل كلمة المرور الجديدة"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <Text style={styles.inputLabel}>تأكيد كلمة المرور الجديدة:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="أعد إدخال كلمة المرور"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleChangePassword}>
              <Text style={styles.primaryButtonText}>حفظ كلمة المرور الجديدة</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* ==========================================
          7. النافذة المنبثقة لإجراء التقييم (Modal)
         ========================================== */}
      <Modal visible={evalModalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f7fafc' }}>
          <View style={styles.topBar}>
            <Text style={styles.topBarUser}>استمارة التقييم - ({evalType})</Text>
            <TouchableOpacity onPress={() => setEvalModalVisible(false)} style={styles.logoutBtn}>
              <Text style={styles.logoutBtnText}>إغلاق</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 15 }}>
            {targetEmployee && (
              <View style={styles.targetInfoBox}>
                <Text style={styles.targetInfoTitle}>الموظف المستهدف بالتقييم: {targetEmployee.name}</Text>
                <Text style={styles.targetInfoSub}>المسمى الوظيفي: {targetEmployee.jobTitle} | الرقم الوظيفي: {targetEmployee.id}</Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>يرجى تقييم البنود التالية من 1 إلى 5:</Text>
            {DEFAULT_QUESTIONS.map((q, index) => (
              <View key={q.id} style={styles.questionCard}>
                <Text style={styles.questionText}>{index + 1}. {q.text}</Text>
                <Text style={styles.questionCategory}>المحور: {q.category}</Text>
                
                <View style={styles.ratingRow}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.ratingBtn,
                        evalScores[q.id] === num && styles.ratingBtnSelected
                      ]}
                      onPress={() => setEvalScores({ ...evalScores, [q.id]: num })}
                    >
                      <Text style={[
                        styles.ratingBtnText,
                        evalScores[q.id] === num && styles.ratingBtnTextSelected
                      ]}>{num}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            <Text style={styles.inputLabel}>ملاحظات وتوصيات إضافية (اختياري):</Text>
            <TextInput
              style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
              multiline
              placeholder="اكتب أي ملاحظات إيجابية أو نقاط للتحسين..."
              value={evalNotes}
              onChangeText={setEvalNotes}
            />

            <TouchableOpacity style={[styles.primaryButton, { marginVertical: 20 }]} onPress={submitEvaluation}>
              <Text style={styles.primaryButtonText}>إرسال واعتماد التقييم</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* شريط معلومات الإصدار السفلي */}
      <View style={styles.footerBar}>
        <Text style={styles.footerText}>{APP_CONFIG.appName} | الإصدار v{APP_CONFIG.version} (Build {APP_CONFIG.buildNumber})</Text>
      </View>
    </SafeAreaView>
  );
}

// ==========================================
// 8. التنسيقات والأنماط (Styles)
// ==========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  headerBanner: {
    backgroundColor: '#1a365d',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#cbd5e0',
    fontSize: 12,
    marginTop: 4,
  },
  loginContainer: {
    padding: 20,
    justifyContent: 'center',
  },
  loginBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 15,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#edf2f7',
    borderRadius: 8,
    padding: 4,
    marginBottom: 15,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleActive: {
    backgroundColor: '#2b6cb0',
  },
  toggleText: {
    fontSize: 14,
    color: '#4a5568',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a5568',
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'right',
  },
  textInput: {
    backgroundColor: '#edf2f7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2d3748',
    textAlign: 'right',
    borderWidth: 1,
    borderColor: '#cbd5e0',
  },
  primaryButton: {
    backgroundColor: '#2b6cb0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  infoBox: {
    marginTop: 20,
    backgroundColor: '#ebf8ff',
    padding: 12,
    borderRadius: 8,
    borderRightWidth: 4,
    borderRightColor: '#3182ce',
  },
  infoText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2b6cb0',
  },
  infoSubText: {
    fontSize: 12,
    color: '#4a5568',
    marginTop: 3,
    textAlign: 'right',
  },
  topBar: {
    backgroundColor: '#1a365d',
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarUser: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  topBarRole: {
    color: '#cbd5e0',
    fontSize: 12,
  },
  logoutBtn: {
    backgroundColor: '#e53e3e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row-reverse',
    backgroundColor: '#2d3748',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabItemActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#3182ce',
    backgroundColor: '#1a202c',
  },
  tabText: {
    color: '#a0aec0',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  contentContainer: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 12,
    textAlign: 'right',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardIcon: {
    width: '48%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
  },
  cardIconEmoji: {
    fontSize: 28,
  },
  cardIconTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 5,
  },
  cardIconSub: {
    color: '#e2e8f0',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  peerSection: {
    marginTop: 15,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 10,
    elevation: 1,
  },
  peerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 10,
    textAlign: 'right',
  },
  peerCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
  },
  peerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'right',
  },
  peerSub: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'right',
  },
  peerBtn: {
    backgroundColor: '#319795',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  peerBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBox: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    elevation: 2,
  },
  cardDesc: {
    fontSize: 13,
    color: '#4a5568',
    lineHeight: 18,
    textAlign: 'right',
    marginBottom: 10,
  },
  empRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
  },
  empTextBold: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'right',
  },
  empTextSub: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'right',
  },
  secondaryBtn: {
    backgroundColor: '#edf2f7',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e0',
  },
  secondaryBtnText: {
    color: '#2d3748',
    fontSize: 13,
    fontWeight: 'bold',
  },
  formItem: {
    backgroundColor: '#f7fafc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderRightWidth: 3,
    borderRightColor: '#3182ce',
  },
  formTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'right',
  },
  formSub: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'right',
  },
  reportCard: {
    backgroundColor: '#f7fafc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderRightWidth: 3,
    borderRightColor: '#38a169',
  },
  reportTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'right',
  },
  reportSub: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'right',
  },
  reportScore: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#276749',
    textAlign: 'right',
    marginTop: 4,
  },
  targetInfoBox: {
    backgroundColor: '#ebf8ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  targetInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2b6cb0',
    textAlign: 'right',
  },
  targetInfoSub: {
    fontSize: 12,
    color: '#4a5568',
    textAlign: 'right',
    marginTop: 2,
  },
  questionCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 1,
  },
  questionText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'right',
  },
  questionCategory: {
    fontSize: 11,
    color: '#718096',
    textAlign: 'right',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 5,
  },
  ratingBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#edf2f7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e0',
  },
  ratingBtnSelected: {
    backgroundColor: '#3182ce',
    borderColor: '#2b6cb0',
  },
  ratingBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a5568',
  },
  ratingBtnTextSelected: {
    color: '#ffffff',
  },
  footerBar: {
    backgroundColor: '#1a202c',
    paddingVertical: 6,
    alignItems: 'center',
  },
  footerText: {
    color: '#a0aec0',
    fontSize: 10,
  },
});

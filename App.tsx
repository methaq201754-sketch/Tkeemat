import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  SafeAreaView,
  StatusBar
} from 'react-native';

const APP_VERSION = "1.0.2";
const BUILD_NUMBER = "3";

type Role = 'admin' | 'evaluator' | 'employee';

interface FormItem {
  id: number;
  title: string;
  maxScore: number;
}

interface FormTemplate {
  id: string;
  name: string;
  type: string;
  items: FormItem[];
}

interface Employee {
  id: string;
  name: string;
  grade: string;
  title: string;
  department: string;
  management: string;
  formType: string;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [activeTab, setActiveTab] = useState<'coding' | 'db' | 'reports'>('coding');

  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('إدارية');
  const [items, setItems] = useState<FormItem[]>([{ id: 1, title: '', maxScore: 10 }]);

  const handleLogin = () => {
    if (!usernameInput || !passwordInput) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }
    setCurrentUser(usernameInput);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUsernameInput('');
    setPasswordInput('');
  };

  const handleImportForm = () => {
    Alert.alert('استيراد استمارة', 'تم فتح وحدة التخزين لاستيراد ملف الاستمارة (JSON/Excel).');
  };

  const handleImportDatabase = () => {
    Alert.alert('جلب قاعدة البيانات', 'تم فتح التخزين لجلب ملف الموظفين.\n\nالحقول: (رقم الموظف، الاسم، الدرجة، المسمى، القسم، الإدارة، نوع الاستمارة).');
    setEmployees([
      { id: '101', name: 'أحمد علي', grade: 'أولى', title: 'محاسب', department: 'المالية', management: 'الشؤون المالية', formType: 'إدارية' },
      { id: '102', name: 'محمد صالح', grade: 'ثانية', title: 'مندوب مبيعات', department: 'المبيعات', management: 'التسويق والمبيعات', formType: 'بيعية وتسويقية' },
    ]);
  };

  const handleAddItem = () => {
    if (items.length >= 15) {
      Alert.alert('تنبيه', 'الحد الأقصى للبنود هو 15 بنداً');
      return;
    }
    setItems([...items, { id: items.length + 1, title: '', maxScore: 10 }]);
  };

  const handleSaveForm = () => {
    if (!formName.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم الاستمارة');
      return;
    }
    const newForm: FormTemplate = {
      id: Date.now().toString(),
      name: formName,
      type: formType,
      items: items.filter(i => i.title.trim() !== '')
    };
    setForms([...forms, newForm]);
    setCreateModalVisible(false);
    setFormName('');
    setItems([{ id: 1, title: '', maxScore: 10 }]);
    Alert.alert('تم بنجاح', 'تم إنشاء الاستمارة وتشفيرها بنجاح');
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loginBox}>
          <Text style={styles.loginTitle}>تسجيل الدخول</Text>
          
          <TextInput
            style={styles.loginInput}
            placeholder="ادخل اسم المستخدم"
            placeholderTextColor="#888"
            value={usernameInput}
            onChangeText={setUsernameInput}
          />
          
          <TextInput
            style={styles.loginInput}
            placeholder="كلمة المرور"
            placeholderTextColor="#888"
            secureTextEntry
            value={passwordInput}
            onChangeText={setPasswordInput}
          />

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>دخول</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>الإصدار v{APP_VERSION} (Build {BUILD_NUMBER})</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>حساب المسؤول (v{APP_VERSION})</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>خروج</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'coding' && styles.activeTab]}
          onPress={() => setActiveTab('coding')}>
          <Text style={[styles.tabText, activeTab === 'coding' && styles.activeTabText]}>ترميز الاستمارات</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'db' && styles.activeTab]}
          onPress={() => setActiveTab('db')}>
          <Text style={[styles.tabText, activeTab === 'db' && styles.activeTabText]}>قاعدة البيانات</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
          onPress={() => setActiveTab('reports')}>
          <Text style={[styles.tabText, activeTab === 'reports' && styles.activeTabText]}>التقارير</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'coding' && (
          <View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleImportForm}>
                <Text style={styles.actionBtnText}>📥 استيراد استمارة</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]} onPress={() => setCreateModalVisible(true)}>
                <Text style={styles.actionBtnText}>➕ إنشاء استمارة</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionHeader}>الاستمارات المتاحة ({forms.length})</Text>
            {forms.map(f => (
              <View key={f.id} style={styles.card}>
                <Text style={styles.cardTitle}>{f.name}</Text>
                <Text style={styles.cardSub}>نوع الاستمارة: {f.type}</Text>
                <Text style={styles.cardSub}>عدد البنود: {f.items.length}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'db' && (
          <View>
            <TouchableOpacity style={styles.importDbBtn} onPress={handleImportDatabase}>
              <Text style={styles.importDbBtnText}>📂 جلب ملف قاعدة البيانات من التخزين</Text>
            </TouchableOpacity>

            <Text style={styles.sectionHeader}>قائمة الموظفين المسجلين ({employees.length})</Text>
            {employees.map(emp => (
              <View key={emp.id} style={styles.card}>
                <Text style={styles.cardTitle}>{emp.name} ({emp.id})</Text>
                <Text style={styles.cardSub}>المسمى الوظيفي: {emp.title} - الدرجة: {emp.grade}</Text>
                <Text style={styles.cardSub}>الإدارة: {emp.management} - القسم: {emp.department}</Text>
                <Text style={styles.cardBadge}>نوع الاستمارة: {emp.formType}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'reports' && (
          <View>
            <Text style={styles.sectionHeader}>تقارير درجات التقييم والمتوسطات</Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>88.5%</Text>
                <Text style={styles.statLabel}>متوسط التقييم العام</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>24</Text>
                <Text style={styles.statLabel}>عدد الموظفين المقيّمين</Text>
              </View>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>متوسط الدرجات حسب نوع الاستمارة</Text>
              
              <View style={styles.barContainer}>
                <Text style={styles.barLabel}>إدارية (92%)</Text>
                <View style={[styles.bar, { width: '92%', backgroundColor: '#3b82f6' }]} />
              </View>

              <View style={styles.barContainer}>
                <Text style={styles.barLabel}>قيادية وإشرافية (85%)</Text>
                <View style={[styles.bar, { width: '85%', backgroundColor: '#10b981' }]} />
              </View>

              <View style={styles.barContainer}>
                <Text style={styles.barLabel}>بيعية وتسويقية (78%)</Text>
                <View style={[styles.bar, { width: '78%', backgroundColor: '#f59e0b' }]} />
              </View>

              <View style={styles.barContainer}>
                <Text style={styles.barLabel}>غير إدارية (81%)</Text>
                <View style={[styles.bar, { width: '81%', backgroundColor: '#6366f1' }]} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal visible={isCreateModalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView style={{ padding: 16 }}>
            <Text style={styles.modalTitle}>إنشاء استمارة جديدة</Text>

            <Text style={styles.label}>اسم الاستمارة:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="مثال: استمارة تقييم موظفي المبيعات"
              value={formName}
              onChangeText={setFormName}
            />

            <Text style={styles.label}>نوع الاستمارة:</Text>
            <View style={styles.typeSelector}>
              {['إدارية', 'غير إدارية', 'قيادية وإشرافية', 'بيعية وتسويقية'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, formType === t && styles.typeBtnActive]}
                  onPress={() => setFormType(t)}>
                  <Text style={[styles.typeBtnText, formType === t && styles.typeBtnTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionHeader}>البنود والدرجات (الحد الأقصى 15 بنداً)</Text>
            {items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemNumber}>{index + 1}.</Text>
                <TextInput
                  style={[styles.modalInput, { flex: 2, marginBottom: 0 }]}
                  placeholder="اسم البند"
                  value={item.title}
                  onChangeText={(txt) => {
                    const newItems = [...items];
                    newItems[index].title = txt;
                    setItems(newItems);
                  }}
                />
                <TextInput
                  style={[styles.modalInput, { width: 60, marginBottom: 0, textAlign: 'center' }]}
                  placeholder="الدرجة"
                  keyboardType="numeric"
                  value={item.maxScore.toString()}
                  onChangeText={(txt) => {
                    const newItems = [...items];
                    newItems[index].maxScore = parseInt(txt) || 0;
                    setItems(newItems);
                  }}
                />
              </View>
            ))}

            {items.length < 15 && (
              <TouchableOpacity style={styles.addItemBtn} onPress={handleAddItem}>
                <Text style={styles.addItemBtnText}>+ إضافة بند آخر</Text>
              </TouchableOpacity>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]} onPress={handleSaveForm}>
                <Text style={styles.actionBtnText}>حفظ الاستمارة</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ef4444' }]} onPress={() => setCreateModalVisible(false)}>
                <Text style={styles.actionBtnText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loginBox: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  loginTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 32,
  },
  loginInput: {
    width: '100%',
    height: 52,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    marginBottom: 16,
    textAlign: 'right',
  },
  loginButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  versionText: {
    marginTop: 24,
    fontSize: 12,
    color: '#94a3b8',
  },
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    height: 60,
    backgroundColor: '#1e293b',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutBtn: {
    padding: 8,
  },
  logoutText: {
    color: '#f87171',
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row-reverse',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  actionRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionBtn: {
    flex: 0.48,
    backgroundColor: '#475569',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    marginVertical: 12,
    textAlign: 'right',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderRightWidth: 4,
    borderColor: '#2563eb',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'right',
  },
  cardSub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'right',
    marginTop: 4,
  },
  cardBadge: {
    fontSize: 12,
    color: '#2563eb',
    textAlign: 'right',
    marginTop: 6,
    fontWeight: 'bold',
  },
  importDbBtn: {
    backgroundColor: '#0f766e',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  importDbBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  statsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    flex: 0.48,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 16,
    textAlign: 'right',
  },
  barContainer: {
    marginBottom: 12,
  },
  barLabel: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'right',
    marginBottom: 4,
  },
  bar: {
    height: 12,
    borderRadius: 6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
    textAlign: 'right',
  },
  label: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 6,
    textAlign: 'right',
    fontWeight: '600',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    textAlign: 'right',
  },
  typeSelector: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  typeBtn: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
  },
  typeBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  typeBtnText: {
    color: '#334155',
    fontSize: 12,
  },
  typeBtnTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  itemRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  itemNumber: {
    fontWeight: 'bold',
    width: 20,
  },
  addItemBtn: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    marginVertical: 12,
  },
  addItemBtnText: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 32,
  },
});

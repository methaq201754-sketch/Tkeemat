import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert
} from 'react-native';

// --- البيانات والاستمارات مدمجة بالكامل ---
interface Employee {
  id: string;
  name: string;
  jobTitle: string;
  jobGrade: string;
  department: string;
  administration: string;
  formType: 'administrative' | 'technical';
}

interface Criterion {
  id: string;
  title: string;
  description: string;
}

interface EvaluationForm {
  title: string;
  criteria: Criterion[];
}

const EMPLOYEES: Employee[] = [
  {
    id: "101",
    name: "ميثاق عبده علي",
    jobTitle: "أخصائي خدمات إدارية ومسؤول أسطول",
    jobGrade: "الدرجة الأولى",
    department: "إدارة الخدمات الإدارية",
    administration: "الإدارة العامة",
    formType: "administrative"
  },
  {
    id: "102",
    name: "أحمد محمود علي",
    jobTitle: "مشرف صيانة ومعدات",
    jobGrade: "الدرجة الثانية",
    department: "إدارة الصيانة",
    administration: "إدارة العمليات",
    formType: "technical"
  },
  {
    id: "103",
    name: "سارة محمد أحمد",
    jobTitle: "محلل بيانات وحسابات",
    jobGrade: "الدرجة الثالثة",
    department: "الإدارة المالية",
    administration: "المالية والتخطيط",
    formType: "administrative"
  }
];

const EVALUATION_ROLES = [
  { id: 'self', label: 'تقييم ذاتي' },
  { id: 'manager', label: 'تقييم الرئيس المباشر' },
  { id: 'subordinate', label: 'تقييم المرؤوسين' },
  { id: 'peer', label: 'تقييم الزملاء' }
];

const EVALUATION_FORMS: Record<string, EvaluationForm> = {
  administrative: {
    title: "استمارة تقييم الوظائف الإدارية",
    criteria: [
      { id: "c1", title: "الانضباط بالدوام والمسؤولية", description: "مدى الالتزام بمواعيد العمل الرسمية وتحمل المسؤوليات الموكلة." },
      { id: "c2", title: "جودة المخرجات والتقارير", description: "دقة وجودة إعداد التقارير والمستندات الإدارية." },
      { id: "c3", title: "التواصل والعمل الجماعي", description: "القدرة على التواصل الفعال مع الزملاء والإدارات المختلفة." },
      { id: "c4", title: "التطوير والمبادرة", description: "السعي لتقديم حلول جديدة وتطوير بيئة العمل." }
    ]
  },
  technical: {
    title: "استمارة تقييم الوظائف الفنية والتشغيلية",
    criteria: [
      { id: "c1", title: "الكفاءة الفنية والتشغيلية", description: "مدى الإتقان والدقة في تنفيذ المهام الفنية والصيانة." },
      { id: "c2", title: "الالتزام بمعايير السلامة", description: "تطبيق إجراءات السلامة المهنية والمحافظة على المعدات." },
      { id: "c3", title: "السرعة في الاستجابة والأداء", description: "إنجاز البلاغات والمهام الفنية في الوقت المحدد." },
      { id: "c4", title: "حل المشكلات الميدانية", description: "القدرة على تشخيص الأعطال التعامل معها بفعالية." }
    ]
  }
};

// --- مكون شاشة التقييم ---
function EvaluationScreen({
  employee,
  currentEvaluatorRole,
  onSaveEvaluation
}: {
  employee: Employee;
  currentEvaluatorRole: string;
  onSaveEvaluation: (evalData: any) => void;
}) {
  const activeForm = EVALUATION_FORMS[employee.formType] || EVALUATION_FORMS.administrative;
  const [scores, setScores] = useState<Record<string, number>>({});

  const handleScoreChange = (criterionId: string, scoreValue: number) => {
    setScores(prev => ({
      ...prev,
      [criterionId]: scoreValue
    }));
  };

  const calculateCurrentFormPercentage = () => {
    const totalCriteria = activeForm.criteria.length;
    const maxPossibleScore = totalCriteria * 5;
    const currentSum = Object.values(scores).reduce((acc, curr) => acc + curr, 0);
    if (currentSum === 0) return "0.0";
    return ((currentSum / maxPossibleScore) * 100).toFixed(1);
  };

  const handleSave = () => {
    const answeredCount = Object.keys(scores).length;
    if (answeredCount < activeForm.criteria.length) {
      Alert.alert("تنبيه", "يرجى تقييم جميع المعايير قبل الحفظ.");
      return;
    }

    const percentage = calculateCurrentFormPercentage();
    onSaveEvaluation({
      employeeId: employee.id,
      role: currentEvaluatorRole,
      scores: scores,
      percentage: parseFloat(percentage),
      date: new Date().toISOString()
    });

    Alert.alert("نجاح", "تم حفظ التقييم بنجاح!");
  };

  return (
    <ScrollView style={styles.evalContainer}>
      <View style={styles.headerCard}>
        <Text style={styles.employeeName}>{employee.name}</Text>
        <Text style={styles.employeeMeta}>{employee.jobTitle} - {employee.jobGrade}</Text>
        <Text style={styles.employeeMeta}>{employee.department} | {employee.administration}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{activeForm.title}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>معايير التقييم (اختر من 1 إلى 5):</Text>
      {activeForm.criteria.map((criterion, index) => (
        <View key={criterion.id} style={styles.criterionCard}>
          <Text style={styles.criterionTitle}>{index + 1}. {criterion.title}</Text>
          <Text style={styles.criterionDesc}>{criterion.description}</Text>

          <View style={styles.scoreRow}>
            {[1, 2, 3, 4, 5].map((val) => {
              const isSelected = scores[criterion.id] === val;
              return (
                <TouchableOpacity
                  key={val}
                  style={[styles.scoreButton, isSelected && styles.scoreButtonActive]}
                  onPress={() => handleScoreChange(criterion.id, val)}
                >
                  <Text style={[styles.scoreText, isSelected && styles.scoreTextActive]}>
                    {val}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>درجة الاستمارة الحالية:</Text>
        <Text style={styles.percentageText}>{calculateCurrentFormPercentage()}%</Text>
        
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>حفظ التقييم</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// --- المكون الرئيسي للمشروع ---
export default function App() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [currentRole, setCurrentRole] = useState<string>('self');
  const [evaluationsRecord, setEvaluationsRecord] = useState<Record<string, Record<string, number>>>({});

  const handleSaveEvaluation = (evalData: { employeeId: string; role: string; percentage: number }) => {
    setEvaluationsRecord(prev => {
      const empEvals = prev[evalData.employeeId] || {};
      return {
        ...prev,
        [evalData.employeeId]: {
          ...empEvals,
          [evalData.role]: evalData.percentage
        }
      };
    });
    setSelectedEmployee(null);
  };

  const calculateOverallAverage = (employeeId: string) => {
    const empEvals = evaluationsRecord[employeeId];
    if (!empEvals) return null;
    const scores = Object.values(empEvals);
    if (scores.length === 0) return null;
    const sum = scores.reduce((acc, curr) => acc + curr, 0);
    return (sum / scores.length).toFixed(1);
  };

  if (selectedEmployee) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f4f6f9' }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setSelectedEmployee(null)} style={styles.backButton}>
            <Text style={styles.backButtonText}>← العودة للقائمة</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>إجراء تقييم أداء</Text>
        </View>

        <View style={styles.roleSelectorContainer}>
          <Text style={styles.roleSelectorLabel}>اختر صفة المُقَيِّم الآن:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roleScroll}>
            {EVALUATION_ROLES.map(role => (
              <TouchableOpacity
                key={role.id}
                style={[styles.roleChip, currentRole === role.id && styles.roleChipActive]}
                onPress={() => setCurrentRole(role.id)}
              >
                <Text style={[styles.roleChipText, currentRole === role.id && styles.roleChipTextActive]}>
                  {role.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <EvaluationScreen
          employee={selectedEmployee}
          currentEvaluatorRole={currentRole}
          onSaveEvaluation={handleSaveEvaluation}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />
      
      <View style={styles.header}>
        <Text style={styles.appTitle}>نظام تقييمات الأداء 360°</Text>
        <Text style={styles.appSubtitle}>سجل الموظفين ومتابعة متوسط التقييم السنوي</Text>
      </View>

      <FlatList
        data={EMPLOYEES}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const overallAvg = calculateOverallAverage(item.id);
          const empRecord = evaluationsRecord[item.id] || {};
          const completedRolesCount = Object.keys(empRecord).length;

          return (
            <View style={styles.employeeCard}>
              <View style={styles.empInfo}>
                <Text style={styles.empName}>{item.name}</Text>
                <Text style={styles.empDetails}>رقم الموظف: {item.id} | {item.jobTitle}</Text>
                <Text style={styles.empSubDetails}>{item.department} - {item.administration}</Text>
              </View>

              <View style={styles.statusRow}>
                <View style={styles.badgeBox}>
                  <Text style={styles.badgeLabel}>التقييمات المكتملة:</Text>
                  <Text style={styles.badgeVal}>{completedRolesCount} من 4</Text>
                </View>

                {overallAvg !== null ? (
                  <View style={styles.avgBox}>
                    <Text style={styles.avgLabel}>المتوسط العام</Text>
                    <Text style={styles.avgValue}>{overallAvg}%</Text>
                  </View>
                ) : (
                  <View style={[styles.avgBox, { backgroundColor: '#f1f5f9' }]}>
                    <Text style={[styles.avgLabel, { color: '#64748b' }]}>لم يُقيَّم بعد</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.evalButton}
                onPress={() => setSelectedEmployee(item)}
              >
                <Text style={styles.evalButtonText}>بدء / استكمال التقييم</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  header: { backgroundColor: '#1e293b', padding: 20, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  appTitle: { fontSize: 22, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
  appSubtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 4 },
  listContainer: { padding: 15 },
  employeeCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 14, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  empInfo: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10, marginBottom: 10 },
  empName: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', textAlign: 'right' },
  empDetails: { fontSize: 13, color: '#475569', textAlign: 'right', marginTop: 3 },
  empSubDetails: { fontSize: 12, color: '#94a3b8', textAlign: 'right', marginTop: 2 },
  statusRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  badgeBox: { alignItems: 'flex-start' },
  badgeLabel: { fontSize: 11, color: '#64748b' },
  badgeVal: { fontSize: 13, fontWeight: 'bold', color: '#2563eb', marginTop: 2 },
  avgBox: { backgroundColor: '#dcfce7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  avgLabel: { fontSize: 11, color: '#166534', fontWeight: 'bold' },
  avgValue: { fontSize: 18, fontWeight: 'bold', color: '#15803d' },
  evalButton: { backgroundColor: '#0f172a', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  evalButtonText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  topBar: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#1e293b' },
  topBarTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  backButton: { padding: 5 },
  backButtonText: { color: '#38bdf8', fontSize: 14, fontWeight: 'bold' },
  roleSelectorContainer: { backgroundColor: '#ffffff', paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  roleSelectorLabel: { fontSize: 13, fontWeight: 'bold', color: '#334155', marginBottom: 8, textAlign: 'right' },
  roleScroll: { flexDirection: 'row-reverse' },
  roleChip: { backgroundColor: '#f1f5f9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginLeft: 8, borderWidth: 1, borderColor: '#cbd5e1' },
  roleChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  roleChipText: { fontSize: 12, color: '#475569', fontWeight: 'bold' },
  roleChipTextActive: { color: '#ffffff' },
  evalContainer: { flex: 1, backgroundColor: '#f4f6f9', padding: 15 },
  headerCard: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 15 },
  employeeName: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', textAlign: 'right' },
  employeeMeta: { color: '#94a3b8', fontSize: 14, textAlign: 'right', marginTop: 4 },
  badge: { backgroundColor: '#334155', padding: 6, borderRadius: 6, marginTop: 10, alignSelf: 'flex-start' },
  badgeText: { color: '#38bdf8', fontSize: 12, fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#334155', marginBottom: 10, textAlign: 'right' },
  criterionCard: { backgroundColor: '#ffffff', padding: 14, borderRadius: 10, marginBottom: 12 },
  criterionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', textAlign: 'right' },
  criterionDesc: { fontSize: 12, color: '#64748b', textAlign: 'right', marginVertical: 6 },
  scoreRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 8 },
  scoreButton: { width: 45, height: 45, borderRadius: 23, borderWidth: 1, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  scoreButtonActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  scoreText: { fontSize: 16, fontWeight: 'bold', color: '#475569' },
  scoreTextActive: { color: '#ffffff' },
  summaryCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, alignItems: 'center', marginVertical: 15, marginBottom: 40 },
  summaryText: { fontSize: 16, color: '#475569', fontWeight: 'bold' },
  percentageText: { fontSize: 32, fontWeight: 'bold', color: '#16a34a', marginVertical: 8 },
  saveButton: { backgroundColor: '#2563eb', width: '100%', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});

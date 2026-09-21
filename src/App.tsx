import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Trophy,
  Target,
  Plus,
  BookOpen,
  SlidersHorizontal,
  X,
  PenTool,
  BarChart3,
  Edit3,
  TrendingUp,
  ShieldCheck,
  Calculator,
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { PastPaperRecord, SheetsConfig, MockExamRecord } from './types';
import { UNIVERSITIES } from './data/universities';
import {
  createExamTrackerSpreadsheet,
  appendRecordToSpreadsheet,
  syncAllRecordsToSpreadsheet,
} from './services/sheetsService';

import { SheetsIntegrationBanner } from './components/SheetsIntegrationBanner';
import { TargetStatusSidebar } from './components/TargetStatusSidebar';
import { WeaknessAdviceSidebar } from './components/WeaknessAdviceSidebar';
import { RecordsList } from './components/RecordsList';
import { RecordFormModal } from './components/RecordFormModal';
import { BenchmarkTable } from './components/BenchmarkTable';
import { TargetScoreSimulator } from './components/TargetScoreSimulator';
import { MockExamView } from './components/MockExamView';
import { MockExamModal } from './components/MockExamModal';
import { GrowthAnalyticsDashboard } from './components/GrowthAnalyticsDashboard';
import { BackupRestoreModal } from './components/BackupRestoreModal';

const STORAGE_KEY_RECORDS = 'exam_strategy_dashboard_records_v3';
const STORAGE_KEY_SHEETS = 'exam_strategy_dashboard_sheets_v2';
const STORAGE_KEY_MOCKS = 'exam_strategy_dashboard_mocks_v2';

/**
 * Automatically sanitizes past paper records, ensuring that secondary-only records
 * (e.g. Kobe 375 or 350 max score) do not have spurious common test scores allocated
 * and that secondary subject scores sum up precisely to record.totalScore.
 */
function sanitizePastPaperRecords(records: PastPaperRecord[]): PastPaperRecord[] {
  return records.map((r) => {
    const isSecOnly = r.isSecondaryOnly || r.totalMaxScore <= 400;
    if (!isSecOnly) return r;

    const commonItem = r.subjectScores.find((s) =>
      s.subjectName.includes('共通テスト') ||
      s.subjectName.includes('センター') ||
      s.subjectName.includes('共テ')
    );

    const secSubs = r.subjectScores.filter(
      (s) =>
        !s.subjectName.includes('共通テスト') &&
        !s.subjectName.includes('センター') &&
        !s.subjectName.includes('共テ')
    );

    const currentSecSum = secSubs.reduce((sum, s) => sum + s.score, 0);

    // If secondary subjects don't equal totalScore (e.g. 144 vs 190)
    if (r.totalScore > 0 && currentSecSum !== r.totalScore && secSubs.length > 0) {
      let runningSum = 0;
      const updatedSecSubs = secSubs.map((s, idx) => {
        if (idx === secSubs.length - 1) {
          return { ...s, score: r.totalScore - runningSum };
        }
        const val = currentSecSum > 0
          ? Math.round((s.score / currentSecSum) * r.totalScore)
          : Math.round(r.totalScore / secSubs.length);
        runningSum += val;
        return { ...s, score: val };
      });

      return {
        ...r,
        isSecondaryOnly: true,
        subjectScores: commonItem
          ? [...updatedSecSubs, { ...commonItem, score: 0 }]
          : updatedSecSubs,
      };
    }

    if (commonItem && commonItem.score > 0) {
      return {
        ...r,
        isSecondaryOnly: true,
        subjectScores: r.subjectScores.map((s) =>
          s.subjectName === commonItem.subjectName ? { ...s, score: 0 } : s
        ),
      };
    }

    return { ...r, isSecondaryOnly: true };
  });
}

export function App() {
  // State: Past Paper Records - default empty (no automatic pre-filled records)
  const [records, setRecords] = useState<PastPaperRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return sanitizePastPaperRecords(parsed);
        }
      } catch (e) {
        console.error('Failed to parse saved records', e);
      }
    }
    return []; // 空欄・未入力の状態でスタート
  });

  // State: Google Sheets Configuration
  const [sheetsConfig, setSheetsConfig] = useState<SheetsConfig | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SHEETS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved sheets config', e);
      }
    }
    // v3: ChatGPT とダッシュボードで共有する Google Sheets Hub を既定接続先にする
    return {
      spreadsheetId: '1NNpNVFUyW238YRZPdV6PiskfyXs6D5Ja_jGJDENlCrE',
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1NNpNVFUyW238YRZPdV6PiskfyXs6D5Ja_jGJDENlCrE/edit',
      sheetTitle: 'Exam Strategy Hub｜過去問・模試データ',
    };
  });

  // State: Mock Exams (模試ナビ連携)
  const [mockExams, setMockExams] = useState<MockExamRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MOCKS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved mock exams', e);
      }
    }
    return [];
  });

  // Main active tab: Past papers vs Mock exams vs Growth Analytics
  const [mainActiveTab, setMainActiveTab] = useState<'past_papers' | 'mock_exams' | 'analytics'>('past_papers');

  // Editing states
  const [editingPastPaperRecord, setEditingPastPaperRecord] = useState<PastPaperRecord | null>(null);
  const [editingMockRecord, setEditingMockRecord] = useState<MockExamRecord | null>(null);
  const [isMockModalOpen, setIsMockModalOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);

  // Selected school and filters
  const [selectedUnivId, setSelectedUnivId] = useState<string>('kobe');
  const [selectedUnivFilter, setSelectedUnivFilter] = useState<string>('all');

  // Modal / Tab States for High Density views (open by default if no records exist)
  const [isRecordFormOpen, setIsRecordFormOpen] = useState<boolean>(records.length === 0);
  const [activeSecondaryModal, setActiveSecondaryModal] = useState<'none' | 'benchmarks' | 'simulator'>('none');
  const [loadedSimulatorRecord, setLoadedSimulatorRecord] = useState<PastPaperRecord | null>(null);
  const [mobileActiveView, setMobileActiveView] = useState<'records' | 'strategy'>('records');

  // Loading states
  const [isCreatingSheets, setIsCreatingSheets] = useState<boolean>(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState<boolean>(false);
  const [isSavingRecord, setIsSavingRecord] = useState<boolean>(false);

  // Notifications
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showNotice = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Persist records
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
  }, [records]);

  // Persist mock exams
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MOCKS, JSON.stringify(mockExams));
  }, [mockExams]);

  // Persist sheets config
  useEffect(() => {
    if (sheetsConfig) {
      localStorage.setItem(STORAGE_KEY_SHEETS, JSON.stringify(sheetsConfig));
    } else {
      localStorage.removeItem(STORAGE_KEY_SHEETS);
    }
  }, [sheetsConfig]);

  // Calculate Days to Examination
  const calculateDaysTo = (targetMonth: number, targetDay: number) => {
    const now = new Date();
    let targetYear = now.getFullYear();
    if (now.getMonth() > targetMonth - 1 || (now.getMonth() === targetMonth - 1 && now.getDate() > targetDay)) {
      targetYear += 1;
    }
    const targetDate = new Date(targetYear, targetMonth - 1, targetDay);
    const diffTime = targetDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysToKyote = calculateDaysTo(1, 18); // 共通テスト (1月中旬)
  const daysToExam = calculateDaysTo(2, 25);  // 2次・個別入試 (2月下旬)

  // Handlers for Google Sheets
  const handleCreateSpreadsheet = async () => {
    setIsCreatingSheets(true);
    try {
      const result = await createExamTrackerSpreadsheet(UNIVERSITIES, records);
      const config: SheetsConfig = {
        spreadsheetId: result.spreadsheetId,
        spreadsheetUrl: result.spreadsheetUrl,
        sheetTitle: '志望校過去問演習・合格分析シート',
        lastSyncedAt: new Date().toISOString(),
      };
      setSheetsConfig(config);
      showNotice('Google スプレッドシートを新規作成し、全データを初期配置しました！', 'success');
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || 'スプレッドシートの作成に失敗しました。';
      showNotice(msg.includes('origin') ? 'Google側でこのVercel URLが未許可です。v3.1ではFirebase画面へ飛ばず、安全に停止しました。' : msg, 'error');
    } finally {
      setIsCreatingSheets(false);
    }
  };

  const handleSyncAllRecords = async () => {
    if (!sheetsConfig) return;
    setIsSyncingSheets(true);
    try {
      await syncAllRecordsToSpreadsheet(sheetsConfig.spreadsheetId, records, UNIVERSITIES);
      setRecords((prev) => prev.map((r) => ({ ...r, syncedToSheets: true })));
      setSheetsConfig((prev) =>
        prev
          ? {
              ...prev,
              lastSyncedAt: new Date().toISOString(),
            }
          : null
      );
      showNotice('スプレッドシートへの全同期が完了しました。', 'success');
    } catch (err: any) {
      console.error(err);
      const msg = err.message || '';
      if (msg.includes('見つかりません') || msg.includes('404') || msg.includes('deleted')) {
        showNotice('スプレッドシートが見つかりません。削除された可能性があるため「新しく作り直す」から再作成してください。', 'error');
      } else {
        showNotice(msg || '同期中にエラーが発生しました。', 'error');
      }
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleResetSheetsConfig = () => {
    setSheetsConfig(null);
    showNotice('スプレッドシート連携を初期化しました。「スプレッドシートを新規作成」からいつでも再作成できます。', 'info');
  };

  // Add new record
  const handleAddRecord = async (
    recordData: Omit<PastPaperRecord, 'id' | 'syncedToSheets'>
  ) => {
    const newRecord: PastPaperRecord = {
      ...recordData,
      id: `rec-${Date.now()}`,
      syncedToSheets: false,
    };

    if (newRecord.isPassed) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
      showNotice(
        `合格最低点をクリアしました！(+${newRecord.scoreDiff.toFixed(1)}点)`,
        'success'
      );
    } else {
      showNotice('演習記録を保存しました。弱点を分析して次回に繋げましょう！', 'info');
    }

    setRecords((prev) => [newRecord, ...prev]);

    // Auto-sync if connected
    if (sheetsConfig) {
      const university = UNIVERSITIES.find((u) => u.id === newRecord.universityId);
      if (university) {
        setIsSavingRecord(true);
        try {
          await appendRecordToSpreadsheet(sheetsConfig.spreadsheetId, newRecord, university);
          setRecords((prev) =>
            prev.map((r) => (r.id === newRecord.id ? { ...r, syncedToSheets: true } : r))
          );
        } catch (e) {
          console.error('Auto sync to spreadsheet failed:', e);
        } finally {
          setIsSavingRecord(false);
        }
      }
    }
  };

  const handleUpdateRecord = (updatedRecord: PastPaperRecord) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
    );
    setEditingPastPaperRecord(null);
    showNotice(`${updatedRecord.year}年度の演習記録を更新しました。`, 'success');
  };

  const handleSaveMockExam = (mockRecord: MockExamRecord) => {
    setMockExams((prev) => {
      const exists = prev.some((m) => m.id === mockRecord.id);
      if (exists) {
        return prev.map((m) => (m.id === mockRecord.id ? mockRecord : m));
      }
      return [mockRecord, ...prev];
    });
    setEditingMockRecord(null);
    setIsMockModalOpen(false);
    showNotice(`模試「${mockRecord.title}」の成績を保存しました！`, 'success');
  };

  const handleDeleteMockExam = (id: string) => {
    if (window.confirm('この模試成績記録を削除しますか？')) {
      setMockExams((prev) => prev.filter((m) => m.id !== id));
      showNotice('模試成績を削除しました。', 'info');
    }
  };

  const handleDeleteRecord = (id: string) => {
    if (window.confirm('この過去問演習記録を削除しますか？')) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
      showNotice('演習記録を削除しました。', 'info');
    }
  };

  const handleClearAllRecords = () => {
    if (window.confirm('登録されているすべての演習記録を削除し、完全に空欄にしますか？\n（この操作は元に戻せません）')) {
      setRecords([]);
      localStorage.removeItem(STORAGE_KEY_RECORDS);
      localStorage.removeItem('kobe_doshisha_kandai_records_v1');
      showNotice('すべての演習記録を消去し、空欄にリセットしました。', 'info');
    }
  };

  const handleRestoreData = (newRecords: PastPaperRecord[], newMockExams?: MockExamRecord[]) => {
    if (newRecords && newRecords.length > 0) {
      const sanitized = sanitizePastPaperRecords(newRecords);
      setRecords((prev) => {
        // Merge without duplicate IDs or date+year+univ collision
        const existingIds = new Set(prev.map((r) => r.id));
        const toAdd = sanitized.filter((r) => !existingIds.has(r.id));
        return [...toAdd, ...prev];
      });
    }

    if (newMockExams && newMockExams.length > 0) {
      setMockExams((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const toAdd = newMockExams.filter((m) => !existingIds.has(m.id));
        return [...toAdd, ...prev];
      });
    }
  };

  const handleExportCSV = () => {
    const headers = [
      '記録日',
      '志望校',
      '年度',
      '回数',
      '入試方式',
      '合計得点',
      '満点',
      '得点率(%)',
      '合格最低点',
      '合否判定',
      '差分(点)',
      '失点要因・反省分析',
      '次回改善策',
    ];

    const rows = records.map((r) => {
      const u = UNIVERSITIES.find((univ) => univ.id === r.universityId);
      const univName = u ? u.shortName : r.universityId;
      const pct = ((r.totalScore / r.totalMaxScore) * 100).toFixed(1);
      return [
        `"${r.date}"`,
        `"${univName}"`,
        `"${r.year}年"`,
        `"${r.attemptNumber}回"`,
        `"${r.examType}"`,
        r.totalScore,
        r.totalMaxScore,
        `"${pct}%"`,
        r.passingBenchmark,
        `"${r.isPassed ? '合格ライン到達' : '最低点未満'}"`,
        r.scoreDiff,
        `"${(r.mistakeAnalysis || '').replace(/"/g, '""')}"`,
        `"${(r.nextActionPlan || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `志望校過去問演習記録_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice('CSVファイルをダウンロードしました。', 'success');
  };

  return (
    <div className="min-h-screen lg:h-screen w-full bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Toast Notification */}
      {notification && (
        <div
          id="app-toast-notification"
          className={`fixed top-3 right-4 z-50 px-3.5 py-2 rounded-lg shadow-lg border text-xs font-bold flex items-center gap-2 transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-700'
              : notification.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          {notification.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5" />}
          {notification.type === 'error' && <AlertCircle className="w-3.5 h-3.5" />}
          {notification.type === 'info' && <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* High Density Header */}
      <header className="bg-indigo-900 text-white p-3 md:px-5 md:py-3 flex justify-between items-center shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded shrink-0">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold leading-none tracking-tight">
              志望校過去問分析ダッシュボード
            </h1>
            <p className="text-xs text-indigo-200 mt-1">
              神戸大(営) / 同志社(商) / 関大(商) 攻略ポータル
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 text-sm">
          {/* Action buttons for Reference Tables */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => setActiveSecondaryModal(activeSecondaryModal === 'benchmarks' ? 'none' : 'benchmarks')}
              className={`px-2.5 py-1 text-xs font-bold rounded border transition-colors flex items-center gap-1 cursor-pointer ${
                activeSecondaryModal === 'benchmarks'
                  ? 'bg-white text-indigo-950 border-white shadow-2xs'
                  : 'bg-indigo-800/80 text-indigo-100 hover:bg-indigo-700 border-indigo-700'
              }`}
            >
              <Trophy className="w-3 h-3 text-amber-400" />
              合格最低点表
            </button>

            <button
              onClick={() => setActiveSecondaryModal(activeSecondaryModal === 'simulator' ? 'none' : 'simulator')}
              title="二次試験の点数から共通テストの必要点を逆算 ＆ 科目配点シミュレータ"
              className={`px-2.5 py-1 text-xs font-bold rounded border transition-colors flex items-center gap-1 cursor-pointer ${
                activeSecondaryModal === 'simulator'
                  ? 'bg-white text-indigo-950 border-white shadow-2xs'
                  : 'bg-indigo-800/80 text-indigo-100 hover:bg-indigo-700 border-indigo-700'
              }`}
            >
              <Calculator className="w-3 h-3 text-emerald-400" />
              二次→共テ逆算・配点
            </button>

            <button
              onClick={() => setIsBackupModalOpen(true)}
              title="データが消えないようにバックアップ保存・Googleスプレッドシートから復元"
              className="px-2.5 py-1 text-xs font-bold rounded border bg-emerald-600/90 hover:bg-emerald-500 text-white border-emerald-500 shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              データ保護・復元
            </button>
          </div>

          <div className="text-right">
            <p className="text-indigo-300 text-[10px] uppercase tracking-wider">共通テストまで</p>
            <p className="font-mono font-bold text-base sm:text-xl leading-none">{daysToKyote}日</p>
          </div>
          <div className="text-right">
            <p className="text-indigo-300 text-[10px] uppercase tracking-wider">二次・個別試験まで</p>
            <p className="font-mono font-bold text-base sm:text-xl leading-none">{daysToExam}日</p>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-indigo-300 text-[10px] uppercase tracking-wider">演習回数</p>
            <p className="font-mono font-bold text-base sm:text-xl leading-none">{records.length}回</p>
          </div>
        </div>
      </header>

      {/* Mobile Top Navigation Tabs (visible only on mobile) */}
      <div className="lg:hidden bg-indigo-950 px-2 py-1.5 flex items-center gap-1.5 border-t border-indigo-800 shrink-0 sticky top-0 z-30 shadow-xs">
        <button
          type="button"
          onClick={() => setMobileActiveView('records')}
          className={`flex-1 py-1.5 px-2 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileActiveView === 'records'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-indigo-900/60 text-indigo-200 hover:bg-indigo-900'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          演習入力・記録一覧
        </button>
        <button
          type="button"
          onClick={() => setMobileActiveView('strategy')}
          className={`flex-1 py-1.5 px-2 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileActiveView === 'strategy'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-indigo-900/60 text-indigo-200 hover:bg-indigo-900'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          志望校目標・分析
        </button>
      </div>

      {/* Main High Density Layout */}
      <main className="flex-1 flex flex-col lg:flex-row p-2.5 sm:p-3 gap-3 min-h-0 overflow-y-auto lg:overflow-hidden">
        {/* Left Sidebar (Desktop: always visible, Mobile: toggled by tab) */}
        <aside
          className={`w-full lg:w-72 xl:w-80 flex-col gap-3 shrink-0 lg:overflow-y-auto ${
            mobileActiveView === 'strategy' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Target Status Card */}
          <TargetStatusSidebar
            universities={UNIVERSITIES}
            records={records}
            selectedUnivId={selectedUnivId}
            onSelectUniv={(id) => {
              setSelectedUnivId(id);
              setSelectedUnivFilter(id);
            }}
          />

          {/* Weakness & AI Advice Card */}
          <WeaknessAdviceSidebar
            universities={UNIVERSITIES}
            records={records}
            selectedUnivId={selectedUnivId}
            onOpenCalculator={() => setActiveSecondaryModal('simulator')}
          />

          {/* Mobile buttons for modal tools */}
          <div className="grid grid-cols-2 gap-2 md:hidden">
            <button
              onClick={() => setActiveSecondaryModal('benchmarks')}
              className="px-2 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded shadow-2xs flex items-center justify-center gap-1"
            >
              <Trophy className="w-3 h-3 text-amber-500" />
              合格最低点表
            </button>
            <button
              onClick={() => setActiveSecondaryModal('simulator')}
              className="px-2 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded shadow-2xs flex items-center justify-center gap-1"
            >
              <Calculator className="w-3 h-3 text-indigo-600" />
              二次→共テ逆算
            </button>
          </div>
        </aside>

        {/* Right Section (Desktop: always visible, Mobile: toggled by tab) */}
        <section
          className={`flex-1 flex-col gap-3 min-w-0 lg:overflow-hidden ${
            mobileActiveView === 'records' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Main Mode Switcher: 過去問演習 vs 模試ナビ */}
          <div className="bg-slate-100 p-1 rounded-lg flex items-center justify-between shrink-0 shadow-2xs">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setMainActiveTab('past_papers')}
                className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition-all cursor-pointer ${
                  mainActiveTab === 'past_papers'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                過去問演習ログ ({records.length})
              </button>
              <button
                type="button"
                onClick={() => setMainActiveTab('mock_exams')}
                className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition-all cursor-pointer ${
                  mainActiveTab === 'mock_exams'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                模試ナビ（全統模試など） ({mockExams.length})
              </button>
              <button
                type="button"
                onClick={() => setMainActiveTab('analytics')}
                className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition-all cursor-pointer ${
                  mainActiveTab === 'analytics'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                推移グラフ・成長実感
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 pr-2 text-[10px] text-slate-500">
              {mainActiveTab === 'past_papers' ? (
                <span>神戸大・同志社・関大 過去問演習記録</span>
              ) : mainActiveTab === 'mock_exams' ? (
                <span className="text-emerald-700 font-semibold">全統マーク・全統記述・オープン 偏差値/判定管理</span>
              ) : (
                <span className="text-indigo-700 font-semibold">過去問得点率 ＆ 模試偏差値 上昇トレンド可視化</span>
              )}
            </div>
          </div>

          {mainActiveTab === 'past_papers' ? (
            <>
              {/* Google Sheets Sync Banner */}
              <SheetsIntegrationBanner
                sheetsConfig={sheetsConfig}
                onCreateSpreadsheet={handleCreateSpreadsheet}
                onSyncAllRecords={handleSyncAllRecords}
                onResetSheetsConfig={handleResetSheetsConfig}
                onOpenBackupModal={() => setIsBackupModalOpen(true)}
                isCreating={isCreatingSheets}
                isSyncing={isSyncingSheets}
              />

              {/* Quick Record Add Form (Collapsible High Density) */}
              <RecordFormModal
                universities={UNIVERSITIES}
                selectedUnivId={selectedUnivId}
                onSelectUnivId={setSelectedUnivId}
                onAddRecord={handleAddRecord}
                onUpdateRecord={handleUpdateRecord}
                editingRecord={editingPastPaperRecord}
                onCancelEdit={() => setEditingPastPaperRecord(null)}
                isSaving={isSavingRecord}
                isOpen={isRecordFormOpen}
                onToggleOpen={() => setIsRecordFormOpen(!isRecordFormOpen)}
                onOpenCalculator={() => setActiveSecondaryModal('simulator')}
              />

              {/* High Density Records Table */}
              <RecordsList
                records={records}
                universities={UNIVERSITIES}
                selectedUnivFilter={selectedUnivFilter}
                onFilterChange={setSelectedUnivFilter}
                onDeleteRecord={handleDeleteRecord}
                onEditRecord={(record) => {
                  setEditingPastPaperRecord(record);
                  setIsRecordFormOpen(true);
                  // Scroll to form if needed
                  document.getElementById('record-form-container')?.scrollIntoView({ behavior: 'smooth' });
                }}
                onClearAllRecords={handleClearAllRecords}
                onOpenRecordForm={() => {
                  setEditingPastPaperRecord(null);
                  setIsRecordFormOpen(true);
                }}
                onExportCSV={handleExportCSV}
                spreadsheetUrl={sheetsConfig?.spreadsheetUrl}
                onOpenReverseCalculator={(record) => {
                  setLoadedSimulatorRecord(record);
                  setActiveSecondaryModal('simulator');
                }}
                onManualSync={(id) => {
                  const r = records.find((rec) => rec.id === id);
                  if (r && sheetsConfig) {
                    const u = UNIVERSITIES.find((univ) => univ.id === r.universityId);
                    if (u) {
                      appendRecordToSpreadsheet(sheetsConfig.spreadsheetId, r, u)
                        .then(() => showNotice('スプレッドシートへ追記しました', 'success'))
                        .catch(() => showNotice('追記に失敗しました', 'error'));
                    }
                  }
                }}
              />
            </>
          ) : mainActiveTab === 'mock_exams' ? (
            /* Mock Exams (模試ナビ) View */
            <MockExamView
              mockExams={mockExams}
              onAddMockExam={() => {
                setEditingMockRecord(null);
                setIsMockModalOpen(true);
              }}
              onEditMockExam={(m) => {
                setEditingMockRecord(m);
                setIsMockModalOpen(true);
              }}
              onDeleteMockExam={handleDeleteMockExam}
            />
          ) : (
            /* Growth Analytics Chart View (Recharts) */
            <GrowthAnalyticsDashboard
              pastRecords={records}
              mockExams={mockExams}
              universities={UNIVERSITIES}
            />
          )}
        </section>
      </main>

      {/* Modal: Benchmark Table */}
      {activeSecondaryModal === 'benchmarks' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="p-3 px-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                志望校別 合格最低点・配点マスター
              </h3>
              <button
                onClick={() => setActiveSecondaryModal('none')}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <BenchmarkTable
                universities={UNIVERSITIES}
                selectedUnivId={selectedUnivId}
                onSelectUnivId={setSelectedUnivId}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal: Target Score Simulator & Secondary to Common Test Calculator */}
      {activeSecondaryModal === 'simulator' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="p-3 px-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-indigo-600" />
                二次試験得点からの共テ必要点逆算 ＆ 配点シミュレーター
              </h3>
              <button
                onClick={() => {
                  setActiveSecondaryModal('none');
                  setLoadedSimulatorRecord(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <TargetScoreSimulator
                universities={UNIVERSITIES}
                records={records}
                initialRecord={loadedSimulatorRecord}
                onClearLoadedRecord={() => setLoadedSimulatorRecord(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal: Mock Exam Entry & Editing (模試ナビ) */}
      <MockExamModal
        isOpen={isMockModalOpen}
        onClose={() => {
          setIsMockModalOpen(false);
          setEditingMockRecord(null);
        }}
        onSave={handleSaveMockExam}
        editingRecord={editingMockRecord}
      />

      {/* Modal: Backup & Restore (データ保護・復元) */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        records={records}
        mockExams={mockExams}
        sheetsConfig={sheetsConfig}
        universities={UNIVERSITIES}
        onRestoreData={handleRestoreData}
        onNotice={showNotice}
      />

      {/* High Density Footer */}
      <footer className="bg-white border-t border-slate-200 px-4 flex justify-between items-center shrink-0 h-9 text-[11px] text-slate-500">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-700">受験過去問分析ポータル</span>
          <span>神戸大(営) / 同志社(商) / 関大(商)</span>
          <span className="hidden md:inline text-slate-400">|</span>
          <span className="hidden md:inline">
            Google Sheets™ 同期対応
          </span>
        </div>
        <div className="flex items-center gap-4">
          {sheetsConfig?.lastSyncedAt && (
            <span className="text-[10px] text-slate-400 font-mono">
              最終同期: {new Date(sheetsConfig.lastSyncedAt).toLocaleTimeString('ja-JP')}
            </span>
          )}
          <button
            onClick={handleExportCSV}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
          >
            CSV保存
          </button>
        </div>
      </footer>
    </div>
  );
}
export default App;

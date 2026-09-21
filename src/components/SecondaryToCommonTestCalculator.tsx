import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  Target,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Award,
  BookOpen,
  TrendingUp,
  Sliders,
  HelpCircle,
  Calendar,
  Layers,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { UniversityConfig, PastPaperRecord, ExamRegime, YearlyExamScheme } from '../types';
import { getExamRegime, getYearlyExamScheme } from '../data/universities';

interface Props {
  universities: UniversityConfig[];
  records?: PastPaperRecord[];
  initialRecord?: PastPaperRecord | null;
  onClearLoadedRecord?: () => void;
}

export const SecondaryToCommonTestCalculator: React.FC<Props> = ({
  universities,
  records = [],
  initialRecord = null,
  onClearLoadedRecord,
}) => {
  const [selectedUnivId, setSelectedUnivId] = useState<string>(initialRecord?.universityId || 'kobe');
  const [selectedRegime, setSelectedRegime] = useState<ExamRegime>(
    initialRecord ? (initialRecord.examRegime || getExamRegime(initialRecord.year)) : 'new_curriculum'
  );
  const [selectedYear, setSelectedYear] = useState<number>(initialRecord?.year || 2026);
  const [safetyMargin, setSafetyMargin] = useState<number>(10); // 安全マージン加算 (+0〜+30点)
  const [inputMode, setInputMode] = useState<'subjects' | 'total'>('subjects');
  const [showComparisonGuide, setShowComparisonGuide] = useState<boolean>(false);
  const [loadedRecordId, setLoadedRecordId] = useState<string | null>(initialRecord?.id || null);

  const currentUniv = universities.find((u) => u.id === selectedUnivId) || universities[0];

  // Get active exam scheme for chosen university and year
  const activeScheme: YearlyExamScheme = useMemo(() => {
    // 1. Try finding scheme by matching university and selectedYear
    const schemeByYear = getYearlyExamScheme(currentUniv.id, selectedYear);
    if (schemeByYear && schemeByYear.regime === selectedRegime) {
      return schemeByYear;
    }
    // 2. Find scheme by selectedRegime
    const schemeByRegime = currentUniv.yearlySchemes?.find((s) => s.regime === selectedRegime);
    if (schemeByRegime) return schemeByRegime;

    // 3. Fallback to default
    return (
      currentUniv.yearlySchemes?.[0] || {
        id: 'fallback',
        regime: 'new_curriculum',
        regimeLabel: '新課程 共通テスト（2025〜）',
        yearRangeLabel: '2025年〜現在',
        applicableYears: [2026, 2025],
        totalMaxScore: currentUniv.totalMaxScore,
        commonMaxScore: 400,
        commonRawMaxScore: 1000,
        secondaryMaxScore: 375,
        secondarySubjects: [
          { name: '英語', maxScore: 125, defaultScore: 78 },
          { name: '数学', maxScore: 125, defaultScore: 75 },
          { name: '国語', maxScore: 125, defaultScore: 75 },
        ],
        commonSubjects: [
          { name: '英語', rawMax: 200, weightMax: 75 },
          { name: '数学', rawMax: 200, weightMax: 75 },
          { name: '国語', rawMax: 200, weightMax: 75 },
          { name: '地歴・公民', rawMax: 100, weightMax: 100 },
          { name: '理科基礎', rawMax: 100, weightMax: 50 },
          { name: '情報Ⅰ', rawMax: 100, weightMax: 25 },
        ],
        individualPriorityCutoffScore: 226.6,
        notes: '',
      }
    );
  }, [currentUniv, selectedYear, selectedRegime]);

  // Filter passing scores applicable to the chosen regime
  const applicablePassingScores = useMemo(() => {
    return currentUniv.passingScores.filter((ps) => {
      const r = ps.regime || getExamRegime(ps.year);
      return r === selectedRegime;
    });
  }, [currentUniv, selectedRegime]);

  // Synchronize selectedYear when regime changes if the current year is not in that regime
  useEffect(() => {
    if (applicablePassingScores.length > 0) {
      const yearMatches = applicablePassingScores.some((p) => p.year === selectedYear);
      if (!yearMatches) {
        setSelectedYear(applicablePassingScores[0].year);
      }
    }
  }, [applicablePassingScores, selectedYear]);

  // Match passing score benchmark
  const matchedBenchmark = useMemo(() => {
    const match = currentUniv.passingScores.find((p) => p.year === selectedYear);
    if (match) return match;
    if (applicablePassingScores.length > 0) return applicablePassingScores[0];
    return currentUniv.passingScores[0];
  }, [currentUniv, selectedYear, applicablePassingScores]);

  const baseTargetScore = matchedBenchmark.score;
  const targetTotalMaxScore = matchedBenchmark.totalMaxScore || activeScheme.totalMaxScore;
  const finalTargetScore = Math.round((baseTargetScore + safetyMargin) * 10) / 10;

  // Secondary subject scores state
  const [subjectScores, setSubjectScores] = useState<{ [key: string]: number }>({});
  const [customSecondaryTotal, setCustomSecondaryTotal] = useState<number>(228);

  // Initialize or reset scores whenever activeScheme changes
  useEffect(() => {
    const initial: { [key: string]: number } = {};
    let total = 0;
    activeScheme.secondarySubjects.forEach((sub) => {
      initial[sub.name] = sub.defaultScore ?? Math.round(sub.maxScore * 0.6);
      total += initial[sub.name];
    });
    setSubjectScores(initial);
    setCustomSecondaryTotal(total);
  }, [activeScheme]);

  // Calculated secondary exam total
  const secondaryTotal = useMemo(() => {
    if (inputMode === 'total') {
      return customSecondaryTotal;
    }
    return activeScheme.secondarySubjects.reduce((sum, sub) => sum + (subjectScores[sub.name] || 0), 0);
  }, [inputMode, customSecondaryTotal, subjectScores, activeScheme]);

  const secondaryPercentage =
    activeScheme.secondaryMaxScore > 0
      ? Math.round((secondaryTotal / activeScheme.secondaryMaxScore) * 1000) / 10
      : 0;

  // Needed Common Test / Center Test Weighted Score
  const neededCommonWeighted = Math.max(0, Math.round((finalTargetScore - secondaryTotal) * 10) / 10);

  // Needed Common Test / Center Test Percentage
  const neededCommonPercentage =
    activeScheme.commonMaxScore > 0
      ? Math.round((neededCommonWeighted / activeScheme.commonMaxScore) * 1000) / 10
      : 0;

  // Needed Raw Score Equivalent
  const neededCommonRaw = Math.round((neededCommonPercentage / 100) * activeScheme.commonRawMaxScore);

  // Check if secondary score clears Kobe individual priority (個別優先枠)
  const individualPriorityCutoff =
    matchedBenchmark.regime === 'new_curriculum' || selectedRegime === 'new_curriculum'
      ? 226.6 // 2025実績
      : selectedYear === 2024
      ? 233.9
      : selectedYear === 2023
      ? 218.4
      : selectedYear === 2020
      ? 223.7
      : activeScheme.individualPriorityCutoffScore || 220.0;

  const clearsIndividualPriority =
    currentUniv.id === 'kobe' && secondaryTotal >= individualPriorityCutoff;

  // Evaluation Status & Message
  const evaluation = useMemo(() => {
    const isCenter = selectedRegime === 'center_test';
    const testName = isCenter ? 'センター試験' : '共通テスト';

    if (secondaryTotal >= finalTargetScore) {
      return {
        label: '二次得点のみで合格目標到達！',
        badge: '超安全圏',
        color: 'text-emerald-800 bg-emerald-50/90 border-emerald-300',
        barColor: 'bg-emerald-500',
        message: `二次試験の得点（${secondaryTotal}点）だけで合格目標（${finalTargetScore}点）を上回っています。${testName}は失点を抑えるだけで確実に合格ラインを突破できます。`,
      };
    }
    if (neededCommonWeighted > activeScheme.commonMaxScore) {
      const deficit = Math.round((neededCommonWeighted - activeScheme.commonMaxScore) * 10) / 10;
      return {
        label: `${testName}満点でも不足`,
        badge: '二次得点アップ必須',
        color: 'text-rose-800 bg-rose-50/90 border-rose-300',
        barColor: 'bg-rose-500',
        message: `${testName}で満点（${activeScheme.commonMaxScore}点）を取ってもあと ${deficit}点 不足します。二次試験の目標を最低＋${deficit}点以上引き上げる必要があります。`,
      };
    }
    if (neededCommonPercentage <= 72.0) {
      return {
        label: `${testName}負担軽め（極めて優位）`,
        badge: 'A判定圏',
        color: 'text-emerald-800 bg-emerald-50/90 border-emerald-300',
        barColor: 'bg-emerald-500',
        message: `${testName}で ${neededCommonPercentage}%（${neededCommonWeighted}点）取れれば合格目標に到達。二次の大きなリードにより、本番の心理的プレッシャーを大幅に減らせます。`,
      };
    }
    if (neededCommonPercentage <= 80.0) {
      return {
        label: `${testName}標準合格ボーダー（王道展開）`,
        badge: 'B判定 (合格目標圏)',
        color: 'text-indigo-800 bg-indigo-50/90 border-indigo-300',
        barColor: 'bg-indigo-500',
        message: `${testName}で ${neededCommonPercentage}%（${neededCommonWeighted}点 / 素点約${neededCommonRaw}点）をマークできれば合格最低点を突破できます。地歴や英語で確実に稼ぎましょう。`,
      };
    }
    if (neededCommonPercentage <= 86.0) {
      return {
        label: `${testName}高得点勝負（要集中対策）`,
        badge: 'C判定 (8割超必須)',
        color: 'text-amber-900 bg-amber-50/90 border-amber-300',
        barColor: 'bg-amber-500',
        message: `${testName}で ${neededCommonPercentage}%（${neededCommonWeighted}点 / 素点約${neededCommonRaw}点）の高得点が必要です。${testName}演習の精度を高めるとともに、二次記述もあと10〜15点の上積みを狙いましょう。`,
      };
    }
    return {
      label: `${testName}超高得点（86%超）が必要`,
      badge: 'D判定 (要大幅改善)',
      color: 'text-rose-900 bg-rose-50/90 border-rose-300',
      barColor: 'bg-rose-500',
      message: `${testName}で ${neededCommonPercentage}%（${neededCommonWeighted}点 / 素点約${neededCommonRaw}点）の非常に高い得点率が求められます。二次試験の点数をあと20点以上引き上げる戦略を強く推奨します。`,
    };
  }, [
    secondaryTotal,
    finalTargetScore,
    neededCommonWeighted,
    activeScheme,
    neededCommonPercentage,
    neededCommonRaw,
    selectedRegime,
  ]);

  // Load from past records
  const relevantRecords = records.filter((r) => r.universityId === currentUniv.id);

  const applyRecord = (targetRecord: PastPaperRecord) => {
    setSelectedUnivId(targetRecord.universityId);
    setSelectedYear(targetRecord.year);
    const reg = targetRecord.examRegime || getExamRegime(targetRecord.year);
    setSelectedRegime(reg);
    setLoadedRecordId(targetRecord.id);

    const univ = universities.find((u) => u.id === targetRecord.universityId);
    const scheme =
      getYearlyExamScheme(targetRecord.universityId, targetRecord.year) ||
      univ?.yearlySchemes?.find((s) => s.regime === reg) ||
      univ?.yearlySchemes?.[0];

    if (scheme) {
      const loadedScores: { [key: string]: number } = {};
      let total = 0;
      scheme.secondarySubjects.forEach((ps) => {
        const match = targetRecord.subjectScores.find(
          (sub) =>
            sub.subjectName.includes(ps.name) &&
            !sub.subjectName.includes('共通テスト') &&
            !sub.subjectName.includes('センター')
        );
        if (match) {
          const val = Math.min(ps.maxScore, match.score);
          loadedScores[ps.name] = val;
          total += val;
        } else {
          loadedScores[ps.name] = ps.defaultScore || Math.round(ps.maxScore * 0.6);
          total += loadedScores[ps.name];
        }
      });

      // If this was a secondary-only record (e.g. 375 max score) and total differs from targetRecord.totalScore (e.g. 190 vs 144)
      const isSecOnly = targetRecord.isSecondaryOnly || targetRecord.totalMaxScore <= 400;
      if (isSecOnly && targetRecord.totalScore > 0 && total !== targetRecord.totalScore && total > 0) {
        const ratio = targetRecord.totalScore / total;
        let running = 0;
        const keys = Object.keys(loadedScores);
        keys.forEach((k, idx) => {
          if (idx === keys.length - 1) {
            loadedScores[k] = targetRecord.totalScore - running;
          } else {
            loadedScores[k] = Math.round(loadedScores[k] * ratio);
            running += loadedScores[k];
          }
        });
        total = targetRecord.totalScore;
      }

      setSubjectScores(loadedScores);
      setCustomSecondaryTotal(total);
    }
  };

  // Sync when initialRecord is provided
  useEffect(() => {
    if (initialRecord) {
      applyRecord(initialRecord);
    }
  }, [initialRecord]);

  const loadedRecord = useMemo(() => {
    if (!loadedRecordId) return null;
    return records.find((r) => r.id === loadedRecordId) || null;
  }, [loadedRecordId, records]);

  const loadedRecordUniv = useMemo(() => {
    if (!loadedRecord) return null;
    return universities.find((u) => u.id === loadedRecord.universityId) || null;
  }, [loadedRecord, universities]);

  const actualCommonInLoadedRecord = useMemo(() => {
    if (!loadedRecord) return null;
    const item = loadedRecord.subjectScores.find(
      (s) =>
        s.subjectName.includes('共通テスト') ||
        s.subjectName.includes('センター') ||
        s.subjectName.includes('共テ')
    );
    return item && item.score > 0 ? item.score : null;
  }, [loadedRecord]);

  const handleApplyRecentRecord = () => {
    if (relevantRecords.length === 0) return;
    applyRecord(relevantRecords[0]);
  };

  const handleApplyAverageRecord = () => {
    if (relevantRecords.length === 0) return;

    setLoadedRecordId(null);
    const averages: { [key: string]: number } = {};
    let total = 0;

    activeScheme.secondarySubjects.forEach((ps) => {
      let sum = 0;
      let count = 0;
      relevantRecords.forEach((r) => {
        const match = r.subjectScores.find(
          (sub) => sub.subjectName.includes(ps.name) && !sub.subjectName.includes('共通テスト') && !sub.subjectName.includes('センター')
        );
        if (match) {
          sum += match.score;
          count += 1;
        }
      });
      const avg = count > 0 ? Math.min(ps.maxScore, Math.round(sum / count)) : (ps.defaultScore || 70);
      averages[ps.name] = avg;
      total += avg;
    });

    setSubjectScores(averages);
    setCustomSecondaryTotal(total);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden" id="secondary-to-common-calc">
      {/* Top Header */}
      <div className="p-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-400/30">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight">二次試験得点 → 共通テスト/センター必要点 逆算計算機</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/25 text-emerald-300 border border-emerald-400/30">
                新課程・旧共テ・センター対応
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              「二次試験で何点取れたら、共通テスト・センターは何点（何％）で合格最低点に届くか」を年度・配点制度の違いに合わせて正確に逆算します
            </p>
          </div>
        </div>

        {/* University Selector */}
        <div className="flex items-center gap-1.5 self-start md:self-center">
          {universities.map((u) => (
            <button
              key={u.id}
              onClick={() => {
                setSelectedUnivId(u.id);
                // Reset regime to new_curriculum if available
                setSelectedRegime('new_curriculum');
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedUnivId === u.id
                  ? 'bg-indigo-600 text-white shadow-xs ring-1 ring-white/20'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
              }`}
            >
              {u.shortName}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Record Quick Loader Dropdown */}
        {records.length > 0 && (
          <div className="p-2.5 bg-gradient-to-r from-indigo-50/90 to-slate-50 border border-indigo-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-600 text-white rounded-lg shrink-0">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  過去の演習記録から数値をロードして逆算
                  {loadedRecordId && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                      適用中
                    </span>
                  )}
                </span>
                <span className="text-[10.5px] text-slate-500 hidden sm:inline">
                  保存済みの演習記録を選択すると、その時の二次得点と年度を自動反映して必要共テ得点を逆算します
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={loadedRecordId || ''}
                onChange={(e) => {
                  const rId = e.target.value;
                  if (!rId) {
                    setLoadedRecordId(null);
                    return;
                  }
                  const rec = records.find((r) => r.id === rId);
                  if (rec) {
                    applyRecord(rec);
                  }
                }}
                className="bg-white border border-indigo-300 rounded-lg px-2.5 py-1 text-xs font-bold text-indigo-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono shadow-2xs cursor-pointer max-w-[260px] truncate"
              >
                <option value="">-- 演習記録から選ぶ ({records.length}件) --</option>
                {records.map((r) => {
                  const u = universities.find((univ) => univ.id === r.universityId);
                  const secScores = r.subjectScores.filter(
                    (s) => !s.subjectName.includes('共通テスト') && !s.subjectName.includes('センター')
                  );
                  const secSum = secScores.reduce((acc, curr) => acc + curr.score, 0);
                  return (
                    <option key={r.id} value={r.id}>
                      {u?.shortName || r.universityId} {r.year}年 (第{r.attemptNumber}回) - 二次計{secSum}点
                    </option>
                  );
                })}
              </select>

              {loadedRecordId && (
                <button
                  type="button"
                  onClick={() => {
                    setLoadedRecordId(null);
                    if (onClearLoadedRecord) onClearLoadedRecord();
                  }}
                  className="px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  解除
                </button>
              )}
            </div>
          </div>
        )}

        {/* Active Loaded Record Detailed Banner */}
        {loadedRecord && (
          <div className="p-3 bg-emerald-50/90 border border-emerald-300 rounded-xl text-xs text-emerald-950 space-y-1.5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  演習記録『{loadedRecordUniv?.shortName || loadedRecord.universityId} {loadedRecord.year}年度 第{loadedRecord.attemptNumber}回 ({loadedRecord.date}演習)』の得点を分析中
                </span>
              </div>
              <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-white/80 border border-emerald-200 text-emerald-800">
                二次合計: {secondaryTotal} / {activeScheme.secondaryMaxScore}点 ({secondaryPercentage}%)
              </span>
            </div>

            <div className="text-[11px] text-emerald-900/90 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>
                🎯 {loadedRecord.year}年合格最低点: <strong>{matchedBenchmark.score}点</strong>
              </span>
              <span>
                ➔ 必要共テ得点: <strong className="text-emerald-950 underline">{neededCommonWeighted} / {activeScheme.commonMaxScore}点 ({neededCommonPercentage}%)</strong>
              </span>
              {actualCommonInLoadedRecord !== null && (
                <span className="font-medium">
                  • 実際の演習共テ点: <strong>{actualCommonInLoadedRecord}点</strong> (
                  {actualCommonInLoadedRecord >= neededCommonWeighted ? (
                    <strong className="text-emerald-800">必要点を +{(actualCommonInLoadedRecord - neededCommonWeighted).toFixed(1)}点 上回り合格安全圏！</strong>
                  ) : (
                    <strong className="text-rose-700">必要点まであと {(neededCommonWeighted - actualCommonInLoadedRecord).toFixed(1)}点</strong>
                  )}
                  )
                </span>
              )}
            </div>
          </div>
        )}

        {/* Regime Tabs: 新課程 vs 旧課程共テ vs センター試験 */}
        <div className="bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5 px-1">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              【試験制度・時代の選択】年度ごとの配点・試験方式の切り替え
            </span>
            <button
              onClick={() => setShowComparisonGuide(!showComparisonGuide)}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 self-end sm:self-auto cursor-pointer"
            >
              <Info className="w-3 h-3" />
              {showComparisonGuide ? '配点・試験制度の違いを閉じる' : '新課程・旧共テ・センターの違いを見る'}
              {showComparisonGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            {/* Tab 1: New Curriculum */}
            <button
              onClick={() => setSelectedRegime('new_curriculum')}
              className={`p-2.5 rounded-lg text-left transition-all border cursor-pointer ${
                selectedRegime === 'new_curriculum'
                  ? 'bg-white border-indigo-500 shadow-xs ring-2 ring-indigo-500/20'
                  : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                  新課程 共通テスト
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                  2025年〜現在
                </span>
              </div>
              <div className="text-[10px] text-slate-600 font-medium">
                {currentUniv.id === 'kobe'
                  ? '共テ400点(情報25含む) + 二次375点 = 775点満点'
                  : '個別比重＋新課程共通テスト(情報Ⅰ選択可能)'}
              </div>
            </button>

            {/* Tab 2: Old Common Test */}
            <button
              onClick={() => setSelectedRegime('old_common_test')}
              className={`p-2.5 rounded-lg text-left transition-all border cursor-pointer ${
                selectedRegime === 'old_common_test'
                  ? 'bg-white border-indigo-500 shadow-xs ring-2 ring-indigo-500/20'
                  : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                  旧課程 共通テスト
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                  2021〜2024年
                </span>
              </div>
              <div className="text-[10px] text-slate-600 font-medium">
                {currentUniv.id === 'kobe'
                  ? '共テ375点(情報なし) + 二次350点 = 725点満点'
                  : '旧課程共通テスト利用・併用型'}
              </div>
            </button>

            {/* Tab 3: Center Test */}
            <button
              onClick={() => setSelectedRegime('center_test')}
              className={`p-2.5 rounded-lg text-left transition-all border cursor-pointer ${
                selectedRegime === 'center_test'
                  ? 'bg-white border-indigo-500 shadow-xs ring-2 ring-indigo-500/20'
                  : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                  センター試験時代
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                  〜2020年以前
                </span>
              </div>
              <div className="text-[10px] text-slate-600 font-medium">
                {currentUniv.id === 'kobe'
                  ? 'センター375点(筆記+リス換算) + 二次350点 = 725点'
                  : 'センター併用・個別3教科型'}
              </div>
            </button>
          </div>

          {/* Collapsible Comparison Explanation Guide */}
          {showComparisonGuide && (
            <div className="mt-2.5 p-3 bg-white rounded-lg border border-indigo-200 text-xs text-slate-700 space-y-2 animate-fadeIn">
              <div className="font-bold text-indigo-950 flex items-center gap-1 border-b border-slate-100 pb-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                【重要】年度・試験制度による配点と満点の違い一覧
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-1.5">試験時代</th>
                      <th className="p-1.5">総合満点</th>
                      <th className="p-1.5">共通テスト/センター配点</th>
                      <th className="p-1.5">二次試験/個別配点</th>
                      <th className="p-1.5">主要な変更点・特徴</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/60">
                      <td className="p-1.5 font-bold text-emerald-800">新課程（2025〜）</td>
                      <td className="p-1.5 font-mono font-bold">775点</td>
                      <td className="p-1.5 font-mono">400点（素点1000点）</td>
                      <td className="p-1.5 font-mono">375点（英125/数125/国125）</td>
                      <td className="p-1.5 text-[10px] text-slate-600">
                        情報Ⅰ(25点)新設。二次は英語150→125点、数・国が100→125点に変更され3教科均等化。
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/60">
                      <td className="p-1.5 font-bold text-blue-800">旧課程共テ（2021〜2024）</td>
                      <td className="p-1.5 font-mono font-bold">725点</td>
                      <td className="p-1.5 font-mono">375点（素点900点）</td>
                      <td className="p-1.5 font-mono">350点（英150/数100/国100）</td>
                      <td className="p-1.5 text-[10px] text-slate-600">
                        情報なし。二次試験は英語150点傾斜配点（数学・国語は各100点）。英語の得点力が最重要。
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/60">
                      <td className="p-1.5 font-bold text-amber-800">センター（〜2020）</td>
                      <td className="p-1.5 font-mono font-bold">725点</td>
                      <td className="p-1.5 font-mono">375点（素点900点）</td>
                      <td className="p-1.5 font-mono">350点（英150/数100/国100）</td>
                      <td className="p-1.5 text-[10px] text-slate-600">
                        二次試験は英語150点、数・国各100点。センター英語は筆記(200点)+リス(50点)計250点を75点圧縮換算。
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded">
                💡 <strong>満点の違いにご注意ください:</strong> 神戸大学の場合、2024年以前の過去問を解く際は「総合725点満点・二次350点満点」となります。当計算機では選択した時代に合わせて満点と合格最低点が自動調整されます。
              </p>
            </div>
          )}
        </div>

        {/* Step 1: Target Benchmark & Margin Setting */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <div>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                【目標設定】{currentUniv.name} {currentUniv.faculty}
              </span>
              <p className="text-[11px] text-slate-500">{activeScheme.notes}</p>
            </div>

            {/* Year Selector */}
            <div className="flex items-center gap-1 self-start sm:self-auto">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[10px] text-slate-600 font-bold">基準年度:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-white border border-slate-300 text-slate-800 rounded px-2 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {applicablePassingScores.map((b) => (
                  <option key={b.year} value={b.year}>
                    {b.year}年度 ({b.score}点 / {b.totalMaxScore || activeScheme.totalMaxScore}点満点)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-slate-200 text-xs">
            <div className="bg-white p-2.5 rounded border border-slate-200 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold">
                {selectedYear}年度 総合合格最低点（基準）
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {baseTargetScore}点{' '}
                <span className="text-[10px] text-slate-500 font-sans">
                  / {targetTotalMaxScore}点満点 (
                  {((baseTargetScore / targetTotalMaxScore) * 100).toFixed(1)}%)
                </span>
              </span>
            </div>

            <div className="bg-white p-2.5 rounded border border-slate-200 flex flex-col justify-between">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 mb-1">
                <span>安全マージン加算</span>
                <span className="text-indigo-600 font-mono font-bold">+{safetyMargin}点</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="5"
                value={safetyMargin}
                onChange={(e) => setSafetyMargin(Number(e.target.value))}
                className="w-full h-1 bg-slate-200 rounded accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="bg-indigo-50/70 p-2.5 rounded border border-indigo-200 flex flex-col justify-between">
              <span className="text-[10px] text-indigo-900 font-bold">逆算目標 総合スコア</span>
              <span className="font-mono font-black text-indigo-700 text-sm">
                {finalTargetScore}点{' '}
                <span className="text-[10px] font-semibold text-indigo-600 font-sans">
                  ({((finalTargetScore / targetTotalMaxScore) * 100).toFixed(1)}%)
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Step 2: Secondary Exam Score Input */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                【二次試験得点】予想・演習スコアを入力
              </span>
              <span className="text-[10px] bg-indigo-100 text-indigo-900 font-bold px-1.5 py-0.5 rounded">
                満点 {activeScheme.secondaryMaxScore}点
              </span>
              {selectedRegime !== 'new_curriculum' && currentUniv.id === 'kobe' && (
                <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                  旧配点: 国語100点満点
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {relevantRecords.length > 0 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleApplyRecentRecord}
                    title="直近の演習記録から二次の得点を読み込み"
                    className="px-2 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3 h-3 text-indigo-600" />
                    直近演習を反映
                  </button>
                  <button
                    onClick={handleApplyAverageRecord}
                    title="過去問演習の平均点を読み込み"
                    className="px-2 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                    平均点を反映
                  </button>
                </div>
              )}

              <div className="bg-white p-0.5 rounded border border-slate-300 flex">
                <button
                  onClick={() => setInputMode('subjects')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                    inputMode === 'subjects' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  科目別
                </button>
                <button
                  onClick={() => setInputMode('total')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                    inputMode === 'total' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  合計スライダー
                </button>
              </div>
            </div>
          </div>

          {inputMode === 'subjects' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {activeScheme.secondarySubjects.map((sub) => {
                const currentScore = subjectScores[sub.name] ?? sub.defaultScore ?? 70;
                return (
                  <div key={sub.name} className="bg-white p-2.5 rounded border border-slate-200">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-bold text-slate-800">
                        {sub.name}{' '}
                        <span className="text-[10px] font-normal text-slate-400">/{sub.maxScore}点</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max={sub.maxScore}
                          value={currentScore}
                          onChange={(e) => {
                            const val = Math.min(sub.maxScore, Math.max(0, Number(e.target.value) || 0));
                            setSubjectScores((prev) => ({ ...prev, [sub.name]: val }));
                          }}
                          className="w-14 text-right font-mono font-bold text-xs bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-indigo-700"
                        />
                        <span className="text-[10px] text-slate-500">点</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={sub.maxScore}
                      step="1"
                      value={currentScore}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSubjectScores((prev) => ({ ...prev, [sub.name]: val }));
                      }}
                      className="w-full h-1 bg-slate-200 rounded accent-indigo-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono">
                      <span>0点</span>
                      <span>{Math.round((currentScore / sub.maxScore) * 100)}%</span>
                      <span>{sub.maxScore}点</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-3 rounded border border-slate-200">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold text-slate-700">二次試験 合計得点スライダー</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max={activeScheme.secondaryMaxScore}
                    value={customSecondaryTotal}
                    onChange={(e) => {
                      const val = Math.min(activeScheme.secondaryMaxScore, Math.max(0, Number(e.target.value) || 0));
                      setCustomSecondaryTotal(val);
                    }}
                    className="w-16 text-right font-mono font-black text-sm bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-indigo-700"
                  />
                  <span className="text-xs text-slate-500 font-bold">/ {activeScheme.secondaryMaxScore}点</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max={activeScheme.secondaryMaxScore}
                step="1"
                value={customSecondaryTotal}
                onChange={(e) => setCustomSecondaryTotal(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>0点</span>
                <span>
                  得点率 {secondaryPercentage}% (
                  {secondaryTotal >= individualPriorityCutoff ? '個別優先圏' : '標準'})
                </span>
                <span>{activeScheme.secondaryMaxScore}点</span>
              </div>
            </div>
          )}

          {/* Secondary Exam Summary Ribbon */}
          <div className="mt-2.5 pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-bold">現在の二次試験合計:</span>
              <span className="font-mono font-black text-indigo-700 text-sm">{secondaryTotal}点</span>
              <span className="text-[11px] text-slate-500 font-medium">
                ({secondaryPercentage}% / {activeScheme.secondaryMaxScore}点満点)
              </span>
            </div>

            {/* Kobe Specific: Individual Priority Warning/Success */}
            {currentUniv.id === 'kobe' && (
              <div className="flex items-center gap-1.5">
                {clearsIndividualPriority ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded">
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    神戸大【個別優先枠（目安{individualPriorityCutoff}点）】到達！
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    個別優先枠（{individualPriorityCutoff}点）まで あと {(individualPriorityCutoff - secondaryTotal).toFixed(1)}点
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Calculation Result (The Core Output) */}
        <div className={`p-4 rounded-xl border-2 transition-all ${evaluation.color}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/80 shadow-2xs">
                逆算結果（{selectedRegime === 'center_test' ? 'センター試験' : '共通テスト'}）
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-900">{evaluation.label}</h3>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white shadow-2xs border border-current">
              {evaluation.badge}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/90 p-3 rounded-lg border border-slate-200/80 mb-3">
            {/* Box 1: Required Weighted Score */}
            <div className="p-2 bg-slate-50 rounded border border-slate-200 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">
                必要な{selectedRegime === 'center_test' ? 'センター' : '共テ'}換算点
              </span>
              <div>
                <span className="text-2xl font-black font-mono text-indigo-700 leading-none">
                  {neededCommonWeighted}
                </span>
                <span className="text-xs text-slate-500 font-bold ml-1 font-sans">
                  / {activeScheme.commonMaxScore}点
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1">
                大学独自換算後の必要スコア
              </span>
            </div>

            {/* Box 2: Required Percentage */}
            <div className="p-2 bg-slate-50 rounded border border-slate-200 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">
                必要な{selectedRegime === 'center_test' ? 'センター' : '共テ'}得点率
              </span>
              <div>
                <span className="text-2xl font-black font-mono text-emerald-700 leading-none">
                  {neededCommonPercentage}%
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1">
                全科目平均の目標得点率
              </span>
            </div>

            {/* Box 3: Raw Score Equivalent */}
            <div className="p-2 bg-slate-50 rounded border border-slate-200 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">
                素点換算の目安
              </span>
              <div>
                <span className="text-2xl font-black font-mono text-slate-800 leading-none">
                  約 {neededCommonRaw}
                </span>
                <span className="text-xs text-slate-500 font-bold ml-1 font-sans">
                  / {activeScheme.commonRawMaxScore}点
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1">
                {selectedRegime === 'new_curriculum' ? '1000点満点(情報込)' : '900点満点(情報なし)'}
              </span>
            </div>
          </div>

          {/* Progress Bar of Total Breakdown */}
          <div className="space-y-1 mb-2">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-700">
                二次獲得 ({secondaryTotal}点) ＋ {selectedRegime === 'center_test' ? 'センター' : '共テ'}必要 ({neededCommonWeighted}点) ＝ 目標 ({finalTargetScore}点)
              </span>
              <span className="font-mono text-slate-600">
                二次比率 {Math.round((secondaryTotal / finalTargetScore) * 100)}% : {selectedRegime === 'center_test' ? 'センター' : '共テ'}比率 {Math.round((neededCommonWeighted / finalTargetScore) * 100)}%
              </span>
            </div>

            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
              <div
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (secondaryTotal / targetTotalMaxScore) * 100)}%` }}
                title={`二次試験得点: ${secondaryTotal}点`}
              />
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${Math.min(100 - (secondaryTotal / targetTotalMaxScore) * 100, (neededCommonWeighted / targetTotalMaxScore) * 100)}%` }}
                title={`必要な換算点: ${neededCommonWeighted}点`}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" /> 二次試験 {secondaryTotal}点
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> 必要な換算 {neededCommonWeighted}点
              </span>
              <span>総合 {targetTotalMaxScore}点満点</span>
            </div>
          </div>

          <p className="text-xs leading-relaxed font-medium mt-2">{evaluation.message}</p>

          {currentUniv.id === 'kobe' && (
            <div className="mt-2.5 p-2 bg-white/80 border border-current/20 rounded text-[11px] text-slate-800 leading-relaxed">
              <span className="font-bold text-indigo-950 block mb-0.5">
                🏛️ 神戸大学経営学部【3段階選抜方式】についての補足
              </span>
              <span>
                神戸大経営では、まず<strong>第1段階（個別学力検査優先枠・二次上位約30%）</strong>で選考され、二次得点が個別優先ライン（約{individualPriorityCutoff}点 / {activeScheme.secondaryMaxScore}点）に届けば共通テスト得点問わず合格となります。
                上記の逆算結果は、<strong>第3段階（総合選抜：共テ＋二次合計 {finalTargetScore}点突破）</strong>を狙う場合に必要となる共通テスト得点です。
              </span>
            </div>
          )}
        </div>

        {/* Step 4: Recommended Subject Target Allocation */}
        {activeScheme.commonSubjects && activeScheme.commonSubjects.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-800">
                  {selectedRegime === 'center_test' ? 'センター試験' : '共通テスト'} 科目別ターゲット配分プラン（{neededCommonPercentage}%達成モデル）
                </h4>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                目標換算計: {neededCommonWeighted}点 / {activeScheme.commonMaxScore}点
              </span>
            </div>

            <div className="overflow-x-auto rounded border border-slate-200 bg-white">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-1.5 px-2.5">科目名</th>
                    <th className="py-1.5 px-2 text-right">素点満点</th>
                    <th className="py-1.5 px-2 text-right">大学換算配点</th>
                    <th className="py-1.5 px-2 text-right">目標素点目安</th>
                    <th className="py-1.5 px-2 text-right">換算目標得点</th>
                    <th className="py-1.5 px-2.5">制度ごとの対策アドバイス</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {activeScheme.commonSubjects.map((sub, idx) => {
                    const ratio = Math.min(1, Math.max(0.4, neededCommonPercentage / 100));
                    // Subject specific difficulty adjustments
                    const subjectModifier = sub.name.includes('地歴')
                      ? 1.05
                      : sub.name.includes('情報')
                      ? 1.02
                      : sub.name.includes('国語')
                      ? 0.95
                      : 1.0;

                    const effectiveRatio = Math.min(0.98, Math.max(0.45, ratio * subjectModifier));
                    const rawTarget = Math.round(sub.rawMax * effectiveRatio);
                    const weightTarget = Math.round(sub.weightMax * effectiveRatio * 10) / 10;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="py-1.5 px-2.5 font-bold text-slate-900">
                          {sub.name}
                          {sub.conversionDesc && (
                            <span className="block text-[9px] font-normal text-slate-400">
                              {sub.conversionDesc}
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono text-slate-500">{sub.rawMax}点</td>
                        <td className="py-1.5 px-2 text-right font-mono text-slate-700 font-bold">{sub.weightMax}点</td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold text-emerald-700">
                          {rawTarget}点 ({Math.round(effectiveRatio * 100)}%)
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold text-indigo-700">
                          {weightTarget}点
                        </td>
                        <td className="py-1.5 px-2.5 text-[10px] text-slate-500">
                          {sub.name.includes('地歴')
                            ? '神戸大では100点等倍（1倍）換算のため最大の稼ぎどころ。85点以上狙い。'
                            : sub.name.includes('情報')
                            ? '新課程配点25点。基本的な知識・プログラミング読解で確実に8割確保。'
                            : sub.name.includes('英語') && selectedRegime === 'center_test'
                            ? 'センター英語は筆記(200)+リス(50)の計250点を75点に圧縮。文法・発音の失点を抑える。'
                            : sub.name.includes('英語')
                            ? '読解スピード重視。リーディングとリスニングで8割安定を目指す。'
                            : sub.name.includes('数学')
                            ? '各大問の誘導に乗り大崩れを防ぐ。'
                            : '手堅く8割前後を狙い、大崩れを避ける。'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

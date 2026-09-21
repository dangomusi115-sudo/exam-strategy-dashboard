import React, { useState, useEffect, useMemo } from 'react';
import {
  PlusCircle,
  Edit3,
  X,
  CheckCircle2,
  AlertCircle,
  Award,
  ChevronDown,
  ChevronUp,
  Calculator,
  ArrowRight,
  Info,
  Calendar,
  Scale,
  Sparkles,
} from 'lucide-react';
import { UniversityConfig, PastPaperRecord, ExamRegime } from '../types';
import {
  getExamRegime,
  getYearlyDefaultSubjects,
  getYearlyTotalMaxScore,
} from '../data/universities';
import { calculateMedianAdjustment } from '../utils/scoreAdjustment';

interface Props {
  universities: UniversityConfig[];
  selectedUnivId: string;
  onSelectUnivId: (id: string) => void;
  onAddRecord: (record: Omit<PastPaperRecord, 'id'>) => void;
  onUpdateRecord: (record: PastPaperRecord) => void;
  editingRecord: PastPaperRecord | null;
  onCancelEdit: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  onOpenCalculator?: () => void;
}

export const RecordFormModal: React.FC<Props> = ({
  universities,
  selectedUnivId,
  onSelectUnivId,
  onAddRecord,
  onUpdateRecord,
  editingRecord,
  onCancelEdit,
  isOpen,
  onToggleOpen,
  onOpenCalculator,
}) => {
  const currentUniv = universities.find((u) => u.id === selectedUnivId) || universities[0];

  const [year, setYear] = useState<number>(2026);
  const [attemptNumber, setAttemptNumber] = useState<number>(1);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [examType, setExamType] = useState<string>(
    currentUniv.id === 'kobe'
      ? '前期日程（共テ＋二次）'
      : currentUniv.id === 'doshisha'
      ? '学部個別日程'
      : '一般入試（3教科型）'
  );

  // Initialize scores as empty
  const [scores, setScores] = useState<{ [subjectName: string]: string }>({});
  const [timeSpent, setTimeSpent] = useState<string>('');
  const [mistakeAnalysis, setMistakeAnalysis] = useState<string>('');
  const [nextActionPlan, setNextActionPlan] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  // Selective Math Score Adjustment state (Doshisha / Kansai)
  const [isMathAdjustedApplied, setIsMathAdjustedApplied] = useState<boolean>(false);
  const [mathRawScore, setMathRawScore] = useState<number | null>(null);
  const [mathMedian, setMathMedian] = useState<number>(currentUniv.id === 'kansai' ? 44 : 55);

  // Update median default when university changes
  useEffect(() => {
    if (currentUniv.id === 'kansai') {
      setMathMedian(44);
    } else if (currentUniv.id === 'doshisha') {
      setMathMedian(55);
    }
  }, [currentUniv.id]);

  // Load editing record data into form state if editingRecord changes
  useEffect(() => {
    if (editingRecord) {
      onSelectUnivId(editingRecord.universityId);
      setYear(editingRecord.year);
      setAttemptNumber(editingRecord.attemptNumber);
      setDate(editingRecord.date);
      setExamType(editingRecord.examType);

      const loadedScores: { [key: string]: string } = {};
      editingRecord.subjectScores.forEach((sub) => {
        if (sub.score !== undefined && sub.score !== null) {
          loadedScores[sub.subjectName] = String(sub.score);
          if (sub.subjectName.includes('選択') || sub.subjectName.includes('数学')) {
            loadedScores['文系数学 (選択150点)'] = String(sub.score);
            loadedScores['文系数学 (選択100点)'] = String(sub.score);
            loadedScores['選択科目 (地歴・公民/数学)'] = String(sub.score);
          }
        }
      });
      setScores(loadedScores);

      if (editingRecord.mathScoreAdjustmentApplied) {
        setIsMathAdjustedApplied(true);
        setMathRawScore(editingRecord.mathRawScore ?? null);
        setMathMedian(editingRecord.mathMedianUsed ?? (editingRecord.universityId === 'kansai' ? 44 : 55));
      } else {
        setIsMathAdjustedApplied(false);
        setMathRawScore(null);
      }

      setTimeSpent(editingRecord.timeSpentMinutes ? String(editingRecord.timeSpentMinutes) : '');
      setMistakeAnalysis(editingRecord.mistakeAnalysis || '');
      setNextActionPlan(editingRecord.nextActionPlan || '');
      setValidationError('');
    }
  }, [editingRecord]);

  // Determine current exam regime and dynamic subjects based on selected year
  const activeRegime: ExamRegime = useMemo(() => getExamRegime(Number(year)), [year]);
  const activeSubjects = useMemo(() => getYearlyDefaultSubjects(currentUniv.id, Number(year)), [
    currentUniv.id,
    year,
  ]);
  const activeTotalMaxScore = useMemo(() => getYearlyTotalMaxScore(currentUniv.id, Number(year)), [
    currentUniv.id,
    year,
  ]);

  // Kobe specific benchmarks for secondary exam only
  // 2025+: 375 max score (cutoffs around 226.6)
  // 2021-2024: 350 max score (233.9 in 2024, 218.4 in 2023, 213.7 in 2022, 190.2 in 2021)
  // 2020-: 350 max score (223.7 in 2020)
  const KOBE_SECONDARY_BENCHMARKS: { [year: number]: number } = {
    2026: 228.0,
    2025: 226.6,
    2024: 233.9,
    2023: 218.4,
    2022: 213.7,
    2021: 190.2,
    2020: 223.7,
    2019: 220.0,
    2018: 225.0,
  };

  // Find target benchmark
  const matchedBenchmarkRecord = currentUniv.passingScores.find((p) => p.year === Number(year));
  const matchedBenchmark = matchedBenchmarkRecord?.score ?? currentUniv.passingScores[0].score;

  // Check if user is entering only secondary exam subjects for Kobe (common test / center test not filled)
  const commonOrCenterKeys = Object.keys(scores).filter(
    (k) => k.includes('共通テスト') || k.includes('センター')
  );
  const isCommonOrCenterFilled = commonOrCenterKeys.some(
    (k) => scores[k] && scores[k].trim() !== ''
  );

  const isKobeSecondaryOnly =
    currentUniv.id === 'kobe' &&
    !isCommonOrCenterFilled &&
    Boolean(scores['二次 英語'] || scores['二次 数学'] || scores['二次 国語']);

  const secondaryMaxForYear = Number(year) >= 2025 ? 375 : 350;

  const effectiveBenchmark = isKobeSecondaryOnly
    ? KOBE_SECONDARY_BENCHMARKS[Number(year)] ?? (Number(year) >= 2025 ? 226.6 : 220.0)
    : matchedBenchmark;

  // Calculate total score only for entered subjects
  const enteredSubjectNames = activeSubjects.filter(
    (sub) => scores[sub.name] !== undefined && scores[sub.name].trim() !== ''
  );
  const hasAnyScore = enteredSubjectNames.length > 0;

  const totalScore = enteredSubjectNames.reduce((acc, sub) => {
    return acc + (Number(scores[sub.name]) || 0);
  }, 0);

  const effectiveMaxScore = isKobeSecondaryOnly ? secondaryMaxForYear : activeTotalMaxScore;
  const diff = totalScore - effectiveBenchmark;
  const isPassed = diff >= 0;

  // Calculate secondary exam subtotal for Kobe
  const kobeSecondaryScore =
    (Number(scores['二次 英語']) || 0) +
    (Number(scores['二次 数学']) || 0) +
    (Number(scores['二次 国語']) || 0);
  const hasKobeSecondaryEntered =
    Boolean(scores['二次 英語'] || scores['二次 数学'] || scores['二次 国語']);

  const handleScoreChange = (subjectName: string, val: string) => {
    setValidationError('');
    setScores((prev) => ({
      ...prev,
      [subjectName]: val,
    }));
    // If user modifies math score directly after applying adjustment, reset the flag
    if (
      isMathAdjustedApplied &&
      (subjectName.includes('数学') || subjectName.includes('選択'))
    ) {
      setIsMathAdjustedApplied(false);
      setMathRawScore(null);
    }
  };

  // Dynamic calculation for selective math adjustment (Doshisha / Kansai)
  const isPrivateUnivWithAdjustment = currentUniv.id === 'doshisha' || currentUniv.id === 'kansai';
  const mathSubject = activeSubjects.find(
    (s) => s.name.includes('数学') || s.name.includes('選択')
  );
  const rawMathInputVal = mathSubject && scores[mathSubject.name] !== undefined && scores[mathSubject.name].trim() !== ''
    ? Number(scores[mathSubject.name])
    : null;

  const currentMathRawToCalculate = isMathAdjustedApplied && mathRawScore !== null
    ? mathRawScore
    : rawMathInputVal ?? (currentUniv.id === 'doshisha' ? 90 : 60);

  const mathAdjustmentCalc = useMemo(() => {
    if (!mathSubject) return null;
    return calculateMedianAdjustment(
      currentMathRawToCalculate,
      mathSubject.maxScore,
      mathMedian
    );
  }, [mathSubject, currentMathRawToCalculate, mathMedian]);

  const handleApplyMathAdjustment = () => {
    if (!mathSubject || !mathAdjustmentCalc) return;
    const baseRaw = rawMathInputVal ?? currentMathRawToCalculate;
    setMathRawScore(baseRaw);
    setIsMathAdjustedApplied(true);
    setScores((prev) => ({
      ...prev,
      [mathSubject.name]: String(mathAdjustmentCalc.adjustedScore),
    }));
  };

  const handleRevertToMathRaw = () => {
    if (!mathSubject || mathRawScore === null) return;
    setIsMathAdjustedApplied(false);
    setScores((prev) => ({
      ...prev,
      [mathSubject.name]: String(mathRawScore),
    }));
    setMathRawScore(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasAnyScore) {
      setValidationError('少なくとも1科目の得点を入力してください。');
      return;
    }

    const subjectScores = activeSubjects.map((sub) => {
      const isThisMath = sub.name.includes('数学') || sub.name.includes('選択');
      const val = scores[sub.name] && scores[sub.name].trim() !== '' ? Number(scores[sub.name]) : 0;
      if (isThisMath && isPrivateUnivWithAdjustment && mathAdjustmentCalc) {
        return {
          subjectName: sub.name,
          score: val,
          maxScore: sub.maxScore,
          rawScore: isMathAdjustedApplied && mathRawScore !== null ? mathRawScore : val,
          adjustedScore: isMathAdjustedApplied ? val : mathAdjustmentCalc.adjustedScore,
          adjustmentInfo: isMathAdjustedApplied
            ? `中央値${mathMedian}点換算 (${mathAdjustmentCalc.diff >= 0 ? `+${mathAdjustmentCalc.diff}` : mathAdjustmentCalc.diff}点)`
            : `素点記録 (推計調整後: ${mathAdjustmentCalc.adjustedScore}点)`,
        };
      }
      return {
        subjectName: sub.name,
        score: val,
        maxScore: sub.maxScore,
      };
    });

    const recordPayload = {
      universityId: currentUniv.id,
      year: Number(year),
      examRegime: activeRegime,
      date,
      attemptNumber: Number(attemptNumber),
      examType,
      subjectScores,
      totalScore,
      totalMaxScore: effectiveMaxScore,
      passingBenchmark: effectiveBenchmark,
      overallPassingBenchmark: matchedBenchmark,
      individualPriorityBenchmark: isKobeSecondaryOnly ? effectiveBenchmark : undefined,
      isSecondaryOnly: isKobeSecondaryOnly,
      mathScoreAdjustmentApplied: isPrivateUnivWithAdjustment ? isMathAdjustedApplied : undefined,
      mathRawScore: isPrivateUnivWithAdjustment
        ? (isMathAdjustedApplied && mathRawScore !== null ? mathRawScore : (mathSubject ? Number(scores[mathSubject.name]) : undefined))
        : undefined,
      mathAdjustedScore: isPrivateUnivWithAdjustment
        ? (isMathAdjustedApplied ? (mathSubject ? Number(scores[mathSubject.name]) : undefined) : mathAdjustmentCalc?.adjustedScore)
        : undefined,
      mathMedianUsed: isPrivateUnivWithAdjustment ? mathMedian : undefined,
      isPassed,
      scoreDiff: diff,
      timeSpentMinutes: timeSpent ? Number(timeSpent) : undefined,
      mistakeAnalysis: mistakeAnalysis.trim() || undefined,
      nextActionPlan: nextActionPlan.trim() || undefined,
    };

    if (editingRecord) {
      onUpdateRecord({
        ...recordPayload,
        id: editingRecord.id,
      });
      onCancelEdit();
    } else {
      onAddRecord(recordPayload);
      // Reset form
      setScores({});
      setTimeSpent('');
      setMistakeAnalysis('');
      setNextActionPlan('');
      setAttemptNumber(1);
      setIsMathAdjustedApplied(false);
      setMathRawScore(null);
    }
  };

  // Regime Badge information
  const regimeBadge = useMemo(() => {
    switch (activeRegime) {
      case 'new_curriculum':
        return {
          label: '新課程 共通テスト',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          desc: '共テ400点(情報Ⅰ込) + 二次375点(各125点均等) = 775点満点',
        };
      case 'old_common_test':
        return {
          label: '旧課程 共通テスト',
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          desc: '共テ375点(情報なし) + 二次350点(英語150/数学100/国語100) = 725点満点',
        };
      case 'center_test':
        return {
          label: 'センター試験時代',
          color: 'bg-amber-100 text-amber-900 border-amber-300',
          desc: 'センター375点(筆記+リス換算) + 二次350点(英語150/数学100/国語100) = 725点満点',
        };
    }
  }, [activeRegime]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      {/* Header bar / Toggle */}
      <div
        onClick={editingRecord ? undefined : onToggleOpen}
        className={`p-3 flex items-center justify-between cursor-pointer select-none transition-colors ${
          editingRecord
            ? 'bg-amber-50/80 border-b border-amber-200'
            : isOpen
            ? 'bg-slate-50 border-b border-slate-200'
            : 'bg-white hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-2">
          {editingRecord ? (
            <Edit3 className="w-4 h-4 text-amber-600 animate-pulse" />
          ) : (
            <PlusCircle className="w-4 h-4 text-indigo-600" />
          )}
          <h3 className="text-xs font-bold text-slate-800">
            {editingRecord ? '演習記録の編集・修正' : '過去問演習の記録を追加'}
          </h3>
          <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded font-bold">
            {currentUniv.shortName}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.2 rounded border ${regimeBadge.color}`}>
            {regimeBadge.label}
          </span>
          {editingRecord && (
            <span className="text-[10px] text-amber-800 bg-amber-100/90 font-mono px-1.5 py-0.2 rounded font-bold">
              {editingRecord.year}年 / {editingRecord.date}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {editingRecord ? (
            <button
              type="button"
              onClick={onCancelEdit}
              className="text-[11px] font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-slate-500" />
              編集をやめる
            </button>
          ) : (
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                isOpen
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
              }`}
            >
              {isOpen ? '入力を閉じる' : '＋ 新規演習を入力'}
              {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          )}
        </div>
      </div>

      {(isOpen || editingRecord) && (
        <form onSubmit={handleSubmit} className="p-3 border-t border-slate-100 space-y-3">
          {/* Row 1: Target University tabs and exam year */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">
                志望大学・学部
              </label>
              <select
                value={selectedUnivId}
                onChange={(e) => onSelectUnivId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.shortName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-slate-500">
                  演習年度（試験制度連動）
                </label>
                <span className="text-[9px] font-bold text-indigo-600">{regimeBadge.label}</span>
              </div>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              >
                <optgroup label="新課程 共通テスト（二次各125点均等・情報Ⅰ新設・775点満点）">
                  <option value={2026}>2026年度 (新課程・775点満点)</option>
                  <option value={2025}>2025年度 (新課程・775点満点)</option>
                </optgroup>
                <optgroup label="旧課程 共通テスト（二次英150/数100/国100・725点満点）">
                  <option value={2024}>2024年度 (旧共テ・725点満点)</option>
                  <option value={2023}>2023年度 (旧共テ・725点満点)</option>
                  <option value={2022}>2022年度 (旧共テ・725点満点)</option>
                  <option value={2021}>2021年度 (旧共テ・725点満点)</option>
                </optgroup>
                <optgroup label="センター試験時代（二次英150/数100/国100・725点満点）">
                  <option value={2020}>2020年度 (センター・725点満点)</option>
                  <option value={2019}>2019年度 (センター・725点満点)</option>
                  <option value={2018}>2018年度 (センター・725点満点)</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">
                演習日
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">
                演習回数 / 所要時間
              </label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={attemptNumber}
                  onChange={(e) => setAttemptNumber(Number(e.target.value))}
                  title="演習回数"
                  className="w-1/2 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                  placeholder="第1回"
                />
                <div className="w-1/2 relative">
                  <input
                    type="number"
                    min="1"
                    max="600"
                    step="5"
                    value={timeSpent}
                    onChange={(e) => setTimeSpent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono pr-6"
                    placeholder="分(任意)"
                  />
                  <span className="absolute right-1.5 top-1 text-[10px] text-slate-400">分</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scheme Notice Box */}
          <div className="p-2 bg-slate-100 rounded border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-700">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>
                <strong>{year}年度の配点体系:</strong> {regimeBadge.desc}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              合格目標: {effectiveBenchmark}点 / {effectiveMaxScore}点満点
            </span>
          </div>

          {/* Row 2: Subject score inputs */}
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
              <span className="text-[11px] font-bold text-slate-700">
                科目別得点入力（{year}年度配点ルール適用中）
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                満点: {effectiveMaxScore}点 / 目標: {effectiveBenchmark}点
                {isKobeSecondaryOnly && ' (二次個別優先基準)'}
              </span>
            </div>

            {/* Kobe university specific subtotal and guidance */}
            {currentUniv.id === 'kobe' && (
              <div className="mb-2 p-2 bg-emerald-50/80 border border-emerald-200 rounded text-[10.5px] text-slate-700 flex flex-wrap items-center justify-between gap-2">
                <span className="leading-snug">
                  <strong className="text-emerald-900">神戸大経営 {year}年度配点:</strong>{' '}
                  二次試験{secondaryMaxForYear}点（{Number(year) >= 2025 ? '英語125/数学125/国語125点' : '英語150/数学100/国語100点'}）＋
                  {Number(year) >= 2025
                    ? '共通テスト400点(情報25含む)'
                    : Number(year) >= 2021
                    ? '旧共テ375点(情報なし)'
                    : 'センター375点(筆記+リス換算)'}
                  。二次のみ演習時は個別優先ライン（約{effectiveBenchmark}点）で判定。
                </span>
                {hasKobeSecondaryEntered && (
                  <span className="shrink-0 px-2 py-0.5 rounded bg-emerald-700 text-white font-mono font-bold text-[11px] shadow-2xs">
                    二次3科目計: {kobeSecondaryScore} / {secondaryMaxForYear}点
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {activeSubjects.map((subject) => {
                const val = scores[subject.name] ?? '';
                const fieldMax = subject.maxScore;
                const isMathField = subject.name.includes('数学') || subject.name.includes('選択');
                return (
                  <div
                    key={subject.name}
                    className={`p-1.5 rounded border ${
                      isMathField && isPrivateUnivWithAdjustment
                        ? 'bg-purple-50/50 border-purple-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <span
                        className={`text-[10px] font-bold truncate ${
                          isMathField && isPrivateUnivWithAdjustment ? 'text-purple-900' : 'text-slate-700'
                        }`}
                        title={subject.name}
                      >
                        {subject.name}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">/{fieldMax}</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max={fieldMax}
                      value={val}
                      onChange={(e) => handleScoreChange(subject.name, e.target.value)}
                      placeholder="未入力"
                      className={`w-full border rounded px-1.5 py-0.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-right placeholder:text-slate-300 placeholder:font-normal ${
                        isMathField && isPrivateUnivWithAdjustment
                          ? 'bg-white border-purple-300 text-purple-950'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                    {isMathField && isPrivateUnivWithAdjustment && isMathAdjustedApplied && (
                      <span className="text-[8.5px] font-bold text-purple-700 block text-right mt-0.5">
                        調整後反映中
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Private University (Doshisha / Kansai) Selective Math Score Adjustment Assistance */}
            {isPrivateUnivWithAdjustment && mathSubject && (
              <div className="mt-2.5 p-2.5 bg-purple-50/80 border border-purple-200 rounded-lg text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                    <span className="font-bold text-purple-950 text-[11px]">
                      文系数学 得点調整（中央値補正）アシスト
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-200 text-purple-900">
                      {currentUniv.name} 商学部
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-purple-800 font-medium">中央値目安:</span>
                    <button
                      type="button"
                      onClick={() => setMathMedian(currentUniv.id === 'kansai' ? 36 : 45)}
                      className={`px-1.5 py-0.5 text-[9.5px] rounded border transition-colors cursor-pointer ${
                        mathMedian === (currentUniv.id === 'kansai' ? 36 : 45)
                          ? 'bg-purple-700 text-white border-purple-700 font-bold'
                          : 'bg-white text-purple-900 border-purple-200 hover:bg-purple-100'
                      }`}
                    >
                      難化 ({currentUniv.id === 'kansai' ? 36 : 45}点)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMathMedian(currentUniv.id === 'kansai' ? 44 : 55)}
                      className={`px-1.5 py-0.5 text-[9.5px] rounded border transition-colors cursor-pointer ${
                        mathMedian === (currentUniv.id === 'kansai' ? 44 : 55)
                          ? 'bg-purple-700 text-white border-purple-700 font-bold'
                          : 'bg-white text-purple-900 border-purple-200 hover:bg-purple-100'
                      }`}
                    >
                      標準 ({currentUniv.id === 'kansai' ? 44 : 55}点)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMathMedian(currentUniv.id === 'kansai' ? 54 : 68)}
                      className={`px-1.5 py-0.5 text-[9.5px] rounded border transition-colors cursor-pointer ${
                        mathMedian === (currentUniv.id === 'kansai' ? 54 : 68)
                          ? 'bg-purple-700 text-white border-purple-700 font-bold'
                          : 'bg-white text-purple-900 border-purple-200 hover:bg-purple-100'
                      }`}
                    >
                      易化 ({currentUniv.id === 'kansai' ? 54 : 68}点)
                    </button>
                  </div>
                </div>

                {mathAdjustmentCalc && (
                  <div className="bg-white p-2 rounded border border-purple-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[9.5px] text-slate-500 block">自己採点・素点</span>
                        <span className="text-sm font-mono font-bold text-slate-800">
                          {currentMathRawToCalculate}
                          <span className="text-[10px] text-slate-400 font-normal"> / {mathSubject.maxScore}点</span>
                        </span>
                      </div>

                      <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />

                      <div>
                        <span className="text-[9.5px] text-purple-800 font-bold block flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5 text-amber-500" /> 調整後（大学判定用）
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-mono font-black text-purple-900">
                            {mathAdjustmentCalc.adjustedScore}
                          </span>
                          <span className="text-[10px] text-purple-600 font-mono">
                            / {mathSubject.maxScore}点
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold px-1 rounded ml-1 ${
                              mathAdjustmentCalc.diff >= 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {mathAdjustmentCalc.diff >= 0 ? `+${mathAdjustmentCalc.diff}` : mathAdjustmentCalc.diff}点
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isMathAdjustedApplied ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            調整後得点（{mathAdjustmentCalc.adjustedScore}点）反映中
                          </span>
                          <button
                            type="button"
                            onClick={handleRevertToMathRaw}
                            className="px-2 py-0.5 text-[10.5px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 cursor-pointer"
                          >
                            素点({mathRawScore}点)に戻す
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleApplyMathAdjustment}
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-purple-700 hover:bg-purple-800 rounded shadow-2xs flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          調整後得点（{mathAdjustmentCalc.adjustedScore}点）を入力に反映（推奨）
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-purple-900/80 leading-relaxed">
                  ※同志社大学発表の合格最低点（例: {year}年 {matchedBenchmark}点）は<strong>得点調整後の点数</strong>です。
                  文系数学は中央値が低いため、素点6割前後で+10〜15点ほど高く換算されます。大学公表ボーダーと正確に照合するため、調整後得点での記録を推奨します。
                </p>
              </div>
            )}

            {validationError && (
              <p className="text-rose-600 text-[11px] font-bold mt-2">
                ※ {validationError}
              </p>
            )}
          </div>

          {/* Row 3: Score summary pill & Reflection inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="flex flex-col justify-between p-2 rounded bg-indigo-50/70 border border-indigo-200 min-h-[76px]">
              {hasAnyScore ? (
                <>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-900 block">
                      {isKobeSecondaryOnly
                        ? '二次個別試験・合否判定プレビュー'
                        : '総合得点・合否判定プレビュー'}
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-lg font-black text-indigo-900 font-mono">
                        {totalScore}
                      </span>
                      <span className="text-[11px] text-indigo-700 font-mono">
                        / {effectiveMaxScore}点
                      </span>
                      <span
                        className={`text-xs font-bold font-mono ${
                          isPassed ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        ({diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}点)
                      </span>
                    </div>
                  </div>
                  <div className="mt-1">
                    {isPassed ? (
                      <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {isKobeSecondaryOnly ? '二次個別優先ライン突破' : '合格最低点クリア'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {isKobeSecondaryOnly
                          ? `個別優先まであと ${Math.abs(diff).toFixed(1)}点`
                          : `合格ラインまであと ${Math.abs(diff).toFixed(1)}点`}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-slate-400 text-xs flex items-center h-full">
                  得点を入力すると合否判定が表示されます
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">
                ミスの分析・課題（なぜ間違えたか？）
              </label>
              <textarea
                rows={2}
                value={mistakeAnalysis}
                onChange={(e) => setMistakeAnalysis(e.target.value)}
                placeholder="例: 数学の大問2で計算ミス。英語長文で時間不足..."
                className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">
                次回への改善アクション（何をして克服するか？）
              </label>
              <textarea
                rows={2}
                value={nextActionPlan}
                onChange={(e) => setNextActionPlan(e.target.value)}
                placeholder="例: 解く順序を大問3からに変更、英単語の復習..."
                className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Row 4: Action button */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
            {onOpenCalculator && (
              <button
                type="button"
                onClick={onOpenCalculator}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5" />
                この二次得点から共通テスト必要点を逆算する
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {editingRecord ? '記録を更新する' : '演習記録を保存する'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { MockExamRecord, MockExamSubjectScore, MockExamJudgement, ExamJudgementGrade } from '../types';
import { X, Save, Plus, Trash2, Award, Calendar, BarChart3, HelpCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: MockExamRecord) => void;
  editingRecord?: MockExamRecord | null;
}

const PRESET_EXAMS = [
  { title: '第1回 全統共通テスト模試 (5月)', category: 'common_test' as const, provider: '河合塾' },
  { title: '第2回 全統共通テスト模試 (8月)', category: 'common_test' as const, provider: '河合塾' },
  { title: '第3回 全統共通テスト模試 (10月)', category: 'common_test' as const, provider: '河合塾' },
  { title: '全統プレ共通テスト (11月/12月)', category: 'common_test' as const, provider: '河合塾' },
  { title: '第1回 全統記述模試 (5月)', category: 'written' as const, provider: '河合塾' },
  { title: '第2回 全統記述模試 (8月)', category: 'written' as const, provider: '河合塾' },
  { title: '第3回 全統記述模試 (10月)', category: 'written' as const, provider: '河合塾' },
  { title: '神戸大入試オープン (11月)', category: 'university_open' as const, provider: '河合塾' },
  { title: '駿台全国模試', category: 'written' as const, provider: '駿台' },
  { title: '第1回 駿台・ベネッセマーク模試 (9月)', category: 'common_test' as const, provider: '駿台/ベネッセ' },
  { title: '第3回 駿台・ベネッセマーク模試 (11月)', category: 'common_test' as const, provider: '駿台/ベネッセ' },
  { title: '東進 共通テスト本番レベル模試', category: 'common_test' as const, provider: '東進' },
];

const DEFAULT_KYOTE_SUBJECTS: { name: string; max: number }[] = [
  { name: '英語 (R/L換算)', max: 200 },
  { name: '数学ⅠA・ⅡBC', max: 200 },
  { name: '国語 (現・古・漢)', max: 200 },
  { name: '情報Ⅰ', max: 100 },
  { name: '地歴公民 (公共/政経/世B等)', max: 100 },
  { name: '理科基礎 (2科目計)', max: 100 },
];

const DEFAULT_SECONDARY_SUBJECTS: { name: string; max: number }[] = [
  { name: '英語 (二次記述)', max: 125 },
  { name: '数学 (文系数学)', max: 125 },
  { name: '国語 (現代文・古文)', max: 125 },
];

export const MockExamModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  editingRecord,
}) => {
  const [title, setTitle] = useState<string>('第2回 全統共通テスト模試 (8月)');
  const [examCategory, setExamCategory] = useState<'common_test' | 'written' | 'university_open'>('common_test');
  const [provider, setProvider] = useState<string>('河合塾');
  const [year, setYear] = useState<number>(2026);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [overallDeviation, setOverallDeviation] = useState<string>('');
  
  const [subjects, setSubjects] = useState<{
    subjectName: string;
    score: string;
    maxScore: string;
    deviation: string;
  }[]>([]);

  const [judgements, setJudgements] = useState<{
    targetName: string;
    universityId: string;
    judgement: ExamJudgementGrade;
  }[]>([
    { universityId: 'kobe', targetName: '神戸大学 経営学部（前期）', judgement: 'C' },
    { universityId: 'doshisha', targetName: '同志社大学 商学部（個別）', judgement: 'B' },
    { universityId: 'kansai', targetName: '関西大学 商学部（個別）', judgement: 'A' },
  ]);

  const [reflection, setReflection] = useState<string>('');
  const [nextActionPlan, setNextActionPlan] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Preset subject loader
  const loadPresetSubjects = (cat: 'common_test' | 'written' | 'university_open') => {
    const list = cat === 'common_test' ? DEFAULT_KYOTE_SUBJECTS : DEFAULT_SECONDARY_SUBJECTS;
    setSubjects(
      list.map((s) => ({
        subjectName: s.name,
        score: '',
        maxScore: String(s.max),
        deviation: '',
      }))
    );
  };

  useEffect(() => {
    if (editingRecord) {
      setTitle(editingRecord.title);
      setExamCategory(editingRecord.examCategory);
      setProvider(editingRecord.provider);
      setYear(editingRecord.year);
      setDate(editingRecord.date);
      setOverallDeviation(editingRecord.overallDeviation ? String(editingRecord.overallDeviation) : '');
      setSubjects(
        editingRecord.subjectScores.map((s) => ({
          subjectName: s.subjectName,
          score: String(s.score),
          maxScore: String(s.maxScore),
          deviation: s.deviation ? String(s.deviation) : '',
        }))
      );
      setJudgements(editingRecord.judgements);
      setReflection(editingRecord.reflection || '');
      setNextActionPlan(editingRecord.nextActionPlan || '');
      setErrorMsg('');
    } else {
      // Default new mock exam setup
      setTitle('第2回 全統共通テスト模試 (8月)');
      setExamCategory('common_test');
      setProvider('河合塾');
      setYear(2026);
      setDate(new Date().toISOString().slice(0, 10));
      setOverallDeviation('');
      loadPresetSubjects('common_test');
      setJudgements([
        { universityId: 'kobe', targetName: '神戸大学 経営学部（前期）', judgement: 'C' },
        { universityId: 'doshisha', targetName: '同志社大学 商学部（個別）', judgement: 'B' },
        { universityId: 'kansai', targetName: '関西大学 商学部（個別）', judgement: 'A' },
      ]);
      setReflection('');
      setNextActionPlan('');
      setErrorMsg('');
    }
  }, [editingRecord, isOpen]);

  if (!isOpen) return null;

  // Auto-fill template based on preset dropdown
  const handlePresetSelect = (selectedTitle: string) => {
    setTitle(selectedTitle);
    const preset = PRESET_EXAMS.find((p) => p.title === selectedTitle);
    if (preset) {
      setExamCategory(preset.category);
      setProvider(preset.provider);
      loadPresetSubjects(preset.category);
    }
  };

  const handleSubjectChange = (index: number, field: 'subjectName' | 'score' | 'maxScore' | 'deviation', val: string) => {
    setSubjects((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleAddSubjectRow = () => {
    setSubjects((prev) => [
      ...prev,
      { subjectName: '', score: '', maxScore: '100', deviation: '' },
    ]);
  };

  const handleRemoveSubjectRow = (index: number) => {
    setSubjects((prev) => prev.filter((_, i) => i !== index));
  };

  const handleJudgementChange = (targetUnivId: string, grade: ExamJudgementGrade) => {
    setJudgements((prev) =>
      prev.map((j) => (j.universityId === targetUnivId ? { ...j, judgement: grade } : j))
    );
  };

  // Calculate totals
  const totalScore = subjects.reduce((acc, cur) => acc + (Number(cur.score) || 0), 0);
  const totalMaxScore = subjects.reduce((acc, cur) => acc + (Number(cur.maxScore) || 0), 0);
  const percentage = totalMaxScore > 0 ? ((totalScore / totalMaxScore) * 100).toFixed(1) : '0.0';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('模試名を入力してください。');
      return;
    }
    const enteredScores = subjects.filter((s) => s.subjectName.trim() && s.score.trim());
    if (enteredScores.length === 0) {
      setErrorMsg('少なくとも1つの科目の得点を入力してください。');
      return;
    }

    const compiledSubjects: MockExamSubjectScore[] = subjects
      .filter((s) => s.subjectName.trim())
      .map((s) => ({
        subjectName: s.subjectName.trim(),
        score: Number(s.score) || 0,
        maxScore: Number(s.maxScore) || 100,
        deviation: s.deviation.trim() ? Number(s.deviation) : undefined,
      }));

    const newRecord: MockExamRecord = {
      id: editingRecord ? editingRecord.id : `mock-${Date.now()}`,
      title: title.trim(),
      examCategory,
      provider,
      year: Number(year),
      date,
      totalScore,
      totalMaxScore,
      overallDeviation: overallDeviation.trim() ? Number(overallDeviation) : undefined,
      subjectScores: compiledSubjects,
      judgements,
      reflection: reflection.trim(),
      nextActionPlan: nextActionPlan.trim(),
    };

    onSave(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-3 px-4 border-b border-slate-200 flex items-center justify-between bg-indigo-900 text-white">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold tracking-tight">
              {editingRecord ? '模試成績の編集・修正 (模試ナビ連携)' : '模試ナビ形式：模試成績の登録 (全統模試など)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-indigo-200 hover:text-white rounded cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded text-xs">
              {errorMsg}
            </div>
          )}

          {/* Preset selector */}
          <div className="bg-indigo-50/60 p-2.5 rounded border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-indigo-950 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              模試名クイック選択:
            </span>
            <select
              onChange={(e) => handlePresetSelect(e.target.value)}
              value={title}
              className="bg-white border border-indigo-200 rounded px-2 py-1 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              {PRESET_EXAMS.map((p) => (
                <option key={p.title} value={p.title}>
                  {p.title} ({p.provider})
                </option>
              ))}
              <option value="その他模試">その他の模試 (自由記述)</option>
            </select>
          </div>

          {/* Basic metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 mb-1">
                模試名称
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 第2回 全統共通テスト模試"
                className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">
                年度
              </label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-medium text-slate-800 font-mono"
              >
                {[2026, 2025, 2024, 2023].map((y) => (
                  <option key={y} value={y}>
                    {y}年度
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">
                受験日・実施日
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">
                模試タイプ
              </label>
              <select
                value={examCategory}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setExamCategory(val);
                  loadPresetSubjects(val);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-medium text-slate-800"
              >
                <option value="common_test">共通テスト型（マーク）</option>
                <option value="written">記述・二次型</option>
                <option value="university_open">大学別オープン・実戦</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">
                予備校・主催
              </label>
              <input
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="河合塾, 駿台, 東進等"
                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
              />
            </div>

            <div className="sm:col-span-2 bg-amber-50/70 border border-amber-200 p-1.5 px-2 rounded flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-900 block">
                  総合偏差値（全統・全国）
                </span>
                <span className="text-[9px] text-amber-700">成績表の総合偏差値を入力</span>
              </div>
              <input
                type="number"
                step="0.1"
                min="20"
                max="90"
                value={overallDeviation}
                onChange={(e) => setOverallDeviation(e.target.value)}
                placeholder="例: 64.5"
                className="w-24 bg-white border border-amber-300 rounded px-2 py-1 text-xs font-mono font-bold text-amber-900 text-right focus:outline-none"
              />
            </div>
          </div>

          {/* Target University Judgements (A - E) */}
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="text-[11px] font-bold text-slate-800 block mb-1.5">
              志望校別 判定グレード（模試ナビ判定）
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {judgements.map((j) => (
                <div key={j.universityId} className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-700 block truncate">
                    {j.targetName}
                  </span>
                  <div className="flex gap-1 mt-1.5">
                    {(['A', 'B', 'C', 'D', 'E'] as ExamJudgementGrade[]).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handleJudgementChange(j.universityId, g)}
                        className={`flex-1 py-1 rounded text-xs font-black font-mono transition-colors cursor-pointer ${
                          j.judgement === g
                            ? g === 'A'
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : g === 'B'
                              ? 'bg-teal-600 text-white shadow-2xs'
                              : g === 'C'
                              ? 'bg-amber-500 text-white shadow-2xs'
                              : g === 'D'
                              ? 'bg-orange-500 text-white shadow-2xs'
                              : 'bg-rose-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subject Scores & Deviations */}
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-800">
                科目別 得点＆科目別偏差値
              </span>
              <button
                type="button"
                onClick={handleAddSubjectRow}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                科目行を追加
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="grid grid-cols-12 gap-1.5 text-[10px] font-bold text-slate-500 px-1">
                <span className="col-span-5">科目名</span>
                <span className="col-span-2 text-right">素点</span>
                <span className="col-span-2 text-right">満点</span>
                <span className="col-span-2 text-right">偏差値</span>
                <span className="col-span-1 text-center">削除</span>
              </div>

              {subjects.map((sub, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-1.5 items-center bg-white p-1 rounded border border-slate-200">
                  <input
                    type="text"
                    value={sub.subjectName}
                    onChange={(e) => handleSubjectChange(idx, 'subjectName', e.target.value)}
                    placeholder="科目名"
                    className="col-span-5 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs font-medium"
                  />
                  <input
                    type="number"
                    value={sub.score}
                    onChange={(e) => handleSubjectChange(idx, 'score', e.target.value)}
                    placeholder="得点"
                    className="col-span-2 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold text-right"
                  />
                  <input
                    type="number"
                    value={sub.maxScore}
                    onChange={(e) => handleSubjectChange(idx, 'maxScore', e.target.value)}
                    placeholder="満点"
                    className="col-span-2 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-slate-500 text-right"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={sub.deviation}
                    onChange={(e) => handleSubjectChange(idx, 'deviation', e.target.value)}
                    placeholder="偏差値"
                    className="col-span-2 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-indigo-700 text-right font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSubjectRow(idx)}
                    className="col-span-1 p-1 text-slate-300 hover:text-rose-600 rounded flex justify-center cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Subtotal calculation bar */}
            <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between items-center text-xs font-bold px-1 text-slate-700 font-mono">
              <span>合計得点 / 満点</span>
              <div className="flex items-baseline gap-2">
                <span className="text-base text-indigo-900 font-black">{totalScore}</span>
                <span className="text-slate-400">/ {totalMaxScore}点</span>
                <span className="text-indigo-600 text-xs font-bold">({percentage}%)</span>
              </div>
            </div>
          </div>

          {/* Reflection and next action plan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-rose-700 mb-1">
                模試の反省・失点分析（模試ナビ振り返り）
              </label>
              <textarea
                rows={2}
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="例: 数学ⅡBの数列で計算ミス。英語長文は時間通り解き終えたが文法問題で落とした。"
                className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-emerald-700 mb-1">
                次回模試への課題・改善アクション
              </label>
              <textarea
                rows={2}
                value={nextActionPlan}
                onChange={(e) => setNextActionPlan(e.target.value)}
                placeholder="例: 次回全統記述までに数学の典型パターンを総復習。現代文の記述要約を毎週2題解く。"
                className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded bg-slate-100 cursor-pointer"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {editingRecord ? '模試成績を更新・保存する' : '模試成績を保存する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

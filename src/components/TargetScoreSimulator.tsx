import React, { useState, useMemo } from 'react';
import { UniversityConfig, PastPaperRecord, ExamRegime } from '../types';
import {
  Target,
  Sparkles,
  SlidersHorizontal,
  Calculator,
  Calendar,
  Layers,
  Info,
  Scale,
} from 'lucide-react';
import { SecondaryToCommonTestCalculator } from './SecondaryToCommonTestCalculator';
import { MathScoreAdjustmentCalculator } from './MathScoreAdjustmentCalculator';
import {
  getExamRegime,
  getYearlyDefaultSubjects,
  getYearlyTotalMaxScore,
} from '../data/universities';

interface Props {
  universities: UniversityConfig[];
  records?: PastPaperRecord[];
  initialTab?: 'reverse_calculator' | 'allocation' | 'math_adjustment';
  initialRecord?: PastPaperRecord | null;
  onClearLoadedRecord?: () => void;
}

export const TargetScoreSimulator: React.FC<Props> = ({
  universities,
  records = [],
  initialTab = 'reverse_calculator',
  initialRecord,
  onClearLoadedRecord,
}) => {
  const [activeTab, setActiveTab] = useState<'reverse_calculator' | 'allocation' | 'math_adjustment'>(initialTab);
  const [selectedUnivId, setSelectedUnivId] = useState<string>('doshisha');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [targetMargin, setTargetMargin] = useState<number>(15);

  const univ = universities.find((u) => u.id === selectedUnivId) || universities[0];

  const regime: ExamRegime = useMemo(() => getExamRegime(selectedYear), [selectedYear]);
  const activeSubjects = useMemo(() => getYearlyDefaultSubjects(univ.id, selectedYear), [
    univ.id,
    selectedYear,
  ]);
  const activeTotalMax = useMemo(() => getYearlyTotalMaxScore(univ.id, selectedYear), [
    univ.id,
    selectedYear,
  ]);

  const matchedPassingScore = useMemo(() => {
    return (
      univ.passingScores.find((p) => p.year === selectedYear)?.score ??
      univ.passingScores[0].score
    );
  }, [univ, selectedYear]);

  const targetTotal = Math.round((matchedPassingScore + targetMargin) * 10) / 10;

  const [subjectTargets, setSubjectTargets] = useState<{ [key: string]: number }>({});

  const handleUnivChange = (id: string) => {
    setSelectedUnivId(id);
    setSubjectTargets({});
  };

  return (
    <div className="space-y-3" id="simulator-container">
      {/* Top Mode Tab Switcher */}
      <div className="bg-slate-100 p-1 rounded-lg flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('reverse_calculator')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'reverse_calculator'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-indigo-600" />
            二次試験から共テ必要点を逆算（年度・制度連動）
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('allocation')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'allocation'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
            年度別 科目目標配分設計
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('math_adjustment')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'math_adjustment'
                ? 'bg-white text-purple-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-purple-600" />
            同志社・私大 文系数学 得点調整シミュレーター
          </button>
        </div>

        <span className="text-[10px] text-slate-500 hidden sm:inline-block pr-2">
          {activeTab === 'reverse_calculator'
            ? '二次スコアを入力して必要共テ・センター得点を算出'
            : activeTab === 'math_adjustment'
            ? '文系数学の中央値補正（得点調整）ボーナスをリアルタイム試算'
            : '各時代の配点に応じた科目バランスを設計'}
        </span>
      </div>

      {/* Render Active Tab */}
      {activeTab === 'reverse_calculator' ? (
        <SecondaryToCommonTestCalculator
          universities={universities}
          records={records}
          initialRecord={initialRecord}
          onClearLoadedRecord={onClearLoadedRecord}
        />
      ) : activeTab === 'math_adjustment' ? (
        <MathScoreAdjustmentCalculator initialUnivId={selectedUnivId} />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-bold text-slate-800">
                志望校別 科目配分シミュレーター（合格戦略設計）
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {/* University Selector */}
              <div className="flex items-center gap-1">
                {universities.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleUnivChange(u.id)}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded transition-all cursor-pointer ${
                      selectedUnivId === u.id
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {u.shortName}
                  </button>
                ))}
              </div>

              {/* Year Selector */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                <Calendar className="w-3 h-3 text-slate-400" />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="text-[11px] font-bold bg-transparent text-slate-700 focus:outline-none cursor-pointer font-mono"
                >
                  <optgroup label="新課程 共通テスト">
                    <option value={2026}>2026年 (新課程)</option>
                    <option value={2025}>2025年 (新課程)</option>
                  </optgroup>
                  <optgroup label="旧課程 共通テスト">
                    <option value={2024}>2024年 (旧共テ)</option>
                    <option value={2023}>2023年 (旧共テ)</option>
                    <option value={2022}>2022年 (旧共テ)</option>
                    <option value={2021}>2021年 (旧共テ)</option>
                  </optgroup>
                  <optgroup label="センター試験時代">
                    <option value={2020}>2020年 (センター)</option>
                    <option value={2019}>2019年 (センター)</option>
                    <option value={2018}>2018年 (センター)</option>
                  </optgroup>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2.5">
            <div className="p-2 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold block">
                {selectedYear}年度 合格最低点（実績）
              </span>
              <span className="text-xs font-bold font-mono text-slate-800">
                {matchedPassingScore}点 / {activeTotalMax}点 (
                {((matchedPassingScore / activeTotalMax) * 100).toFixed(1)}%)
              </span>
            </div>

            <div className="p-2 bg-slate-50 rounded border border-slate-200">
              <div className="flex justify-between items-center text-[10px] mb-1">
                <span className="font-bold text-slate-500">安全圏マージン</span>
                <span className="font-mono font-bold text-indigo-700">+{targetMargin}点</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="5"
                value={targetMargin}
                onChange={(e) => setTargetMargin(Number(e.target.value))}
                className="w-full h-1 bg-slate-300 rounded accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="p-2 bg-indigo-50/70 rounded border border-indigo-200">
              <span className="text-[10px] font-bold text-indigo-900 block">必達総合目標得点</span>
              <span className="text-sm font-black text-indigo-700 font-mono">
                {targetTotal}点{' '}
                <span className="text-[10px] font-semibold text-indigo-600">
                  ({((targetTotal / activeTotalMax) * 100).toFixed(1)}%)
                </span>
              </span>
            </div>
          </div>

          {/* Subject targets list */}
          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-1.5 px-2">科目名</th>
                  <th className="py-1.5 px-2 text-right">配点</th>
                  <th className="py-1.5 px-2 text-right">目標目安点</th>
                  <th className="py-1.5 px-2 text-right">目標得点率</th>
                  <th className="py-1.5 px-2">制度ごとの戦略的配分アドバイス</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {activeSubjects.map((sub, idx) => {
                  const suggestedRatio =
                    univ.id === 'kobe'
                      ? sub.name.includes('英語')
                        ? 0.7
                        : sub.name.includes('数学')
                        ? 0.6
                        : 0.72
                      : 0.72;

                  const suggestedScore = Math.round(sub.maxScore * suggestedRatio);
                  const customVal =
                    subjectTargets[sub.name] !== undefined
                      ? subjectTargets[sub.name]
                      : suggestedScore;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-1.5 px-2 font-bold text-slate-900">{sub.name}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-slate-500">
                        {sub.maxScore}点
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold text-indigo-700">
                        {customVal}点
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-slate-600">
                        {((customVal / sub.maxScore) * 100).toFixed(0)}%
                      </td>
                      <td className="py-1.5 px-2 text-[10px] text-slate-500 font-sans">
                        {sub.name.includes('共通テスト') && regime === 'new_curriculum'
                          ? '新課程400点満点（情報Ⅰ含む）で80%（320点）〜84%以上を固め、二次試験への優位を築く。'
                          : sub.name.includes('共通テスト')
                          ? '旧共テ375点満点（情報なし）で300点（80%）前後を確保する。'
                          : sub.name.includes('センター')
                          ? 'センター375点換算。筆記200点＋リスニング50点の圧縮を念頭に置く。'
                          : sub.name.includes('英語')
                          ? sub.maxScore === 150
                            ? '旧配点150点の最重要傾斜科目。長文と英作文で高得点（100点前後）を確保し稼ぎ頭にする。'
                            : '新課程では各教科均等125点化。速読と英作文の完成度で80〜90点以上を狙う。'
                          : sub.name.includes('数学')
                          ? sub.maxScore === 125
                            ? '新課程で100点から125点に増点。数学の出来が合否に与える影響が拡大（75〜85点目標）。'
                            : '旧配点100点満点。典型問題の完答で大崩れを防ぎ、確実に60点以上を積み上げる。'
                          : sub.name.includes('国語')
                          ? sub.maxScore === 125
                            ? '新課程で100点から125点に増点。現代文の論述力と古文の基礎知識で75点以上を手堅く狙う。'
                            : '旧配点100点満点（漢文なし）。現代文の記述と古文で失点を防ぎ、60点以上を手堅く確保。'
                          : '選択科目の得点調整に備えて素点+10点を常に意識する。'}
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
  );
};

import React from 'react';
import {
  X,
  Calculator,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  Sparkles,
  ExternalLink,
  Target,
  SlidersHorizontal,
} from 'lucide-react';
import { PastPaperRecord, UniversityConfig } from '../types';
import { analyzeRecordReverseCalculation } from '../utils/reverseCalc';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  record: PastPaperRecord | null;
  universities: UniversityConfig[];
  onOpenFullCalculator?: (record: PastPaperRecord) => void;
}

export const RecordReverseCalcModal: React.FC<Props> = ({
  isOpen,
  onClose,
  record,
  universities,
  onOpenFullCalculator,
}) => {
  if (!isOpen || !record) return null;

  const analysis = analyzeRecordReverseCalculation(record, universities);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-3.5 px-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-400/30">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold tracking-tight">
                  演習記録からの共通テスト逆算分析
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/20">
                  {record.year}年 第{record.attemptNumber}回
                </span>
              </div>
              <p className="text-[10.5px] text-slate-300">
                {analysis.universityName} {analysis.facultyName} • {analysis.regimeLabel}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1 bg-slate-50/50 text-xs">
          {/* Top 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Card 1: Secondary Score */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                記録された二次得点
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono text-slate-900">
                  {analysis.secondaryTotal}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  / {analysis.secondaryMax}点
                </span>
                <span className="text-[10px] font-bold font-mono text-indigo-600 ml-auto">
                  {analysis.secondaryPct}%
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                {analysis.secondaryScores.map((s, idx) => (
                  <span
                    key={idx}
                    className="text-[9.5px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono"
                  >
                    {s.name}: <strong>{s.score}</strong>/{s.maxScore}
                  </span>
                ))}
              </div>
            </div>

            {/* Card 2: Passing Benchmark */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                {record.year}年度 総合合格最低点
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono text-slate-900">
                  {analysis.passingBenchmark}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  / {analysis.totalMaxScore}点
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
                <span>共テ＋二次の総合得点</span>
                <span className="font-mono font-bold text-slate-700">
                  {((analysis.passingBenchmark / analysis.totalMaxScore) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Card 3: Needed Common Test */}
            <div className="bg-indigo-50/80 p-3 rounded-lg border border-indigo-200 shadow-2xs">
              <span className="text-[10px] font-bold text-indigo-950 uppercase tracking-wider block mb-1">
                総合合格に必要な共テ得点
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono text-indigo-700">
                  {analysis.neededCommonWeighted}
                </span>
                <span className="text-[11px] font-mono text-indigo-900">
                  / {analysis.commonMaxScore}点
                </span>
                <span className="text-xs font-bold font-mono text-indigo-800 ml-auto">
                  {analysis.neededCommonPct}%
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-indigo-200/60 text-[10px] text-indigo-900 flex items-center justify-between">
                <span>素点換算目安</span>
                <span className="font-mono font-bold text-indigo-800">
                  約 {analysis.neededCommonRaw} / {analysis.commonRawMaxScore}点
                </span>
              </div>
            </div>
          </div>

          {/* Diagnostic Message Banner */}
          <div className={`p-3 rounded-lg border ${analysis.statusColor} space-y-1.5`}>
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                診断結果: {analysis.statusBadge}
              </span>
              {analysis.isKobe && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/70 font-mono font-bold">
                  個別優先目安: {analysis.individualPriorityCutoff}点
                </span>
              )}
            </div>
            <p className="text-[11px] leading-relaxed">{analysis.statusMessage}</p>

            {/* Kobe Individual Priority Box */}
            {analysis.isKobe && (
              <div className="mt-2 pt-2 border-t border-current/15 text-[10.5px] flex flex-wrap items-center justify-between gap-1">
                <span className="font-medium">
                  🏛️ <strong>神戸大経営 個別優先枠（二次上位約30%選抜）判定:</strong>
                </span>
                {analysis.clearsIndividualPriority ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    個別優先枠到達 (+{analysis.individualDiff}点)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px]">
                    個別優先ラインまであと {Math.abs(analysis.individualDiff)}点
                  </span>
                )}
              </div>
            )}

            {/* Comparison with actual common score if recorded */}
            {analysis.hasActualCommon && analysis.actualCommonScore !== null && (
              <div className="mt-2 pt-2 border-t border-current/15 text-[10.5px] flex flex-wrap items-center justify-between gap-1">
                <span>
                  📝 <strong>この演習に記録された共通テスト得点:</strong> {analysis.actualCommonScore} /{' '}
                  {analysis.actualCommonMax}点
                </span>
                <span
                  className={`font-mono font-bold px-1.5 py-0.2 rounded text-[10px] ${
                    analysis.isActualCommonEnough
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {analysis.actualCommonDiff !== null && analysis.actualCommonDiff >= 0
                    ? `必要点より +${analysis.actualCommonDiff}点 上回り合格圏`
                    : `必要点まであと ${Math.abs(analysis.actualCommonDiff || 0)}点`}
                </span>
              </div>
            )}
          </div>

          {/* Recommended Common Test Subject Breakdown */}
          {analysis.recommendedCommonSubjects.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
              <div className="p-2.5 px-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-indigo-600" />
                  合格最低点（{analysis.passingBenchmark}点）突破のための共通テスト科目別おすすめ配分
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  必要合計: {analysis.neededCommonWeighted}点 ({analysis.neededCommonPct}%)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-slate-50/70 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-1.5 px-3">科目名</th>
                      <th className="py-1.5 px-2 text-right">素点目標 (満点)</th>
                      <th className="py-1.5 px-2 text-right">大学換算点 (配点)</th>
                      <th className="py-1.5 px-2 text-right">目標得点率</th>
                      <th className="py-1.5 px-3">戦略ワンポイント</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {analysis.recommendedCommonSubjects.map((sub, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-1.5 px-3 font-medium text-slate-800">{sub.name}</td>
                        <td className="py-1.5 px-2 text-right font-mono text-slate-900 font-bold">
                          {sub.recommendedRaw} <span className="text-slate-400 font-normal">/{sub.rawMax}</span>
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono text-indigo-700 font-bold">
                          {sub.recommendedWeighted} <span className="text-slate-400 font-normal">/{sub.weightMax}</span>
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono text-slate-600">
                          {sub.targetPct}%
                        </td>
                        <td className="py-1.5 px-3 text-[10px] text-slate-500">
                          {sub.name.includes('地歴') || sub.name.includes('公民')
                            ? '配点圧縮なし（等倍100点）。最大の稼ぎ頭にする最重要科目。'
                            : sub.name.includes('情報')
                            ? '新課程25点配点。基礎知識の徹底で85%以上を狙える得点源。'
                            : sub.name.includes('英語')
                            ? '二次記述力と直結。リーディングの速読とリスニングを維持。'
                            : sub.name.includes('数学')
                            ? '大問ごとの時間配分を厳守し、計算ミスでの大崩れを防ぐ。'
                            : '失点を最小限に抑え安定した得点をキープ。'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 px-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-bold rounded hover:bg-slate-100 transition-colors cursor-pointer"
          >
            閉じる
          </button>

          {onOpenFullCalculator && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFullCalculator(record);
              }}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              インタラクティブ逆算計算機で調整する
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { PastPaperRecord, UniversityConfig } from '../types';
import { Target, Award, TrendingUp, CheckCircle, Percent } from 'lucide-react';

interface Props {
  records: PastPaperRecord[];
  universities: UniversityConfig[];
}

export const AnalyticsSummary: React.FC<Props> = ({ records, universities }) => {
  const totalCount = records.length;
  const passedCount = records.filter((r) => r.isPassed).length;
  const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" id="analytics-summary-cards">
      {/* Card 1: Total attempts */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">総演習回数</span>
          <Target className="w-4 h-4 text-indigo-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900">{totalCount}</span>
          <span className="text-xs text-slate-400">回演習済み</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">神戸・同志社・関大の合算演習数</p>
      </div>

      {/* Card 2: Passing rate */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">合格最低点突破率</span>
          <Percent className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-emerald-600">{passRate}%</span>
          <span className="text-xs text-slate-500">
            ({passedCount} / {totalCount}回)
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">最低点クリアの演習割合</p>
      </div>

      {/* Card 3: Kobe status */}
      {(() => {
        const kobeRecs = records.filter((r) => r.universityId === 'kobe');
        const latest = kobeRecs[0];
        return (
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700">神戸大 経営（前期）</span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2">
              {latest ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-900">
                    {latest.totalScore}
                    <span className="text-xs text-slate-400 font-normal">/825点</span>
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      latest.isPassed ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {latest.scoreDiff >= 0 ? `+${latest.scoreDiff}` : latest.scoreDiff}点
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">演習未記録</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              目標ボーダー: 563.8点 (約68.3%)
            </p>
          </div>
        );
      })()}

      {/* Card 4: Doshisha & Kansai status */}
      {(() => {
        const doshishaRecs = records.filter((r) => r.universityId === 'doshisha');
        const kansaiRecs = records.filter((r) => r.universityId === 'kansai');
        return (
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-700">同志社 & 関大 商学部</span>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">同志社 演習数</span>
                <span className="font-bold text-slate-800">{doshishaRecs.length}回</span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <span className="text-slate-400 block text-[10px]">関西大 演習数</span>
                <span className="font-bold text-slate-800">{kansaiRecs.length}回</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">各私大得点調整後の7割超を死守</p>
          </div>
        );
      })()}
    </div>
  );
};

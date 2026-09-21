import React, { useState } from 'react';
import { UniversityConfig } from '../types';
import { Trophy, ChevronRight, X, ExternalLink } from 'lucide-react';

interface Props {
  universities: UniversityConfig[];
  selectedUnivId: string;
  onSelectUnivId: (id: string) => void;
  isCompact?: boolean;
}

export const BenchmarkTable: React.FC<Props> = ({
  universities,
  selectedUnivId,
  onSelectUnivId,
  isCompact = false,
}) => {
  const currentUniv = universities.find((u) => u.id === selectedUnivId) || universities[0];

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-3" id="passing-benchmarks-card">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h2 className="text-xs font-bold text-slate-800">
            合格最低点・入試配点マスター
          </h2>
        </div>

        {/* University Switcher */}
        <div className="flex items-center gap-1">
          {universities.map((u) => (
            <button
              key={u.id}
              onClick={() => onSelectUnivId(u.id)}
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
      </div>

      {/* Mini info stats */}
      <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
        <div className="bg-slate-50 p-1.5 px-2 rounded border border-slate-200/80">
          <span className="text-[10px] text-slate-400 block">試験方式</span>
          <span className="font-bold text-slate-800 text-[11px] truncate block">
            {currentUniv.faculty}
          </span>
        </div>
        <div className="bg-slate-50 p-1.5 px-2 rounded border border-slate-200/80">
          <span className="text-[10px] text-slate-400 block">満点配点</span>
          <span className="font-bold text-indigo-700 text-[11px] font-mono block">
            {currentUniv.totalMaxScore}点 満点
          </span>
        </div>
        <div className="bg-slate-50 p-1.5 px-2 rounded border border-slate-200/80">
          <span className="text-[10px] text-slate-400 block">{currentUniv.passingScores[0].year}年合格最低点</span>
          <span className="font-bold text-emerald-700 text-[11px] font-mono block">
            {currentUniv.passingScores[0].score}点 ({currentUniv.passingScores[0].percentage}%)
          </span>
        </div>
      </div>

      {/* Passing Score Table */}
      <div className="overflow-x-auto rounded border border-slate-200">
        <table className="w-full text-left text-[11px] border-collapse" id="passing-score-table">
          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
            <tr>
              <th className="py-1.5 px-2">年度・試験制度</th>
              <th className="py-1.5 px-2">満点</th>
              <th className="py-1.5 px-2">入試方式</th>
              <th className="py-1.5 px-2 text-right">合格最低点</th>
              <th className="py-1.5 px-2 text-right">得点率</th>
              <th className="py-1.5 px-2">安全圏目標(+15点)</th>
              <th className="py-1.5 px-2">選抜方式別最低点・配点特記事項</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
            {currentUniv.passingScores.map((ps, idx) => {
              const rowMax = ps.totalMaxScore || currentUniv.totalMaxScore;
              const targetGoal = Math.round((ps.score + 15) * 10) / 10;
              return (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-1.5 px-2 font-bold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <span>{ps.year}年度</span>
                      {ps.regime === 'new_curriculum' ? (
                        <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 shrink-0">
                          新課程
                        </span>
                      ) : ps.regime === 'old_common_test' ? (
                        <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-blue-100 text-blue-800 shrink-0">
                          旧共テ
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-100 text-amber-900 shrink-0">
                          センター
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-1.5 px-2 font-bold text-slate-700">{rowMax}点</td>
                  <td className="py-1.5 px-2 font-sans text-slate-600">{ps.examType}</td>
                  <td className="py-1.5 px-2 text-right font-bold text-slate-900">
                    {ps.score}点
                  </td>
                  <td className="py-1.5 px-2 text-right font-bold text-indigo-600">
                    {ps.percentage}%
                  </td>
                  <td className="py-1.5 px-2 text-emerald-700 font-bold">
                    {targetGoal}点 ({((targetGoal / rowMax) * 100).toFixed(1)}%)
                  </td>
                  <td className="py-1.5 px-2 font-sans text-[10px] text-slate-600">
                    {ps.note || (ps as { notes?: string }).notes || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detailed Notes for Kobe University Exam Structure */}
      {currentUniv.id === 'kobe' && (
        <div className="mt-3 p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-md text-[11px] text-slate-700 space-y-1">
          <div className="font-bold text-emerald-900 flex items-center gap-1">
            <span>🏛️ 神戸大学 経営学部（前期）の配点・選抜方式の詳細データ</span>
          </div>
          <p className="leading-relaxed">
            <span className="font-bold text-slate-900">① 二次試験配点の年度変遷:</span>{' '}
            <span className="text-emerald-800 font-semibold">【2025年新課程〜】計375点満点</span>（英語125点＋数学125点＋国語125点の各125点均等配点）。
            <span className="text-blue-800 font-semibold">【2024年以前（旧共テ・センター時代）】計350点満点</span>（英語150点＋数学100点＋国語100点の英語重視傾斜配点）。
          </p>
          <p className="leading-relaxed">
            <span className="font-bold text-slate-900">② 共通テスト配点（計400点）:</span> 新課程は情報Ⅰ(25点)を含め400点満点（国75/数75/英75/理50/社100/情25）。旧課程は375点満点でした。※経済学部総合選抜等では425点配点体系も採用されています。
          </p>
          <p className="leading-relaxed">
            <span className="font-bold text-slate-900">③ 3段階選抜の仕組み:</span> 
            定員の約30%を「共通テスト優先（共テのみ高得点）」で選抜、次に約30%を「個別優先（二次375点のみ高得点）」で選抜し、残りを「共テ・個別総合（775点満点）」で選抜します。
          </p>
        </div>
      )}

      {/* Detailed Notes for Doshisha University Score Adjustment */}
      {currentUniv.id === 'doshisha' && (
        <div className="mt-3 p-2.5 bg-purple-50/70 border border-purple-200/80 rounded-md text-[11px] text-slate-700 space-y-1.5">
          <div className="font-bold text-purple-950 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <span>🏛️ 同志社大学 商学部 選択科目「得点調整（中央値補正方式）」と文系数学の優位性</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-200 text-purple-900 font-bold">
              公表最低点はすべて調整後得点
            </span>
          </div>
          <p className="leading-relaxed">
            <span className="font-bold text-slate-900">① 合格最低点の性質:</span> 表中の各年度合格最低点（例: 2024年 362点/500点）は、選択科目を<strong>中央値補正（得点調整）した後の合計得点</strong>です。
          </p>
          <p className="leading-relaxed">
            <span className="font-bold text-slate-900">② 文系数学の圧倒的ボーナス:</span> 同志社の中央値補正は、選択科目の得点中央値（M）を75点（50%）にリセットします。地歴（日本史・世界史）の中央値は例年90〜95点と高く素点から減点されますが、<strong>文系数学の中央値は例年50〜55点前後と低いため、素点6割（90点）で調整後約103点（+13点）に跳ね上がります</strong>。
          </p>
          <p className="leading-relaxed text-purple-900 font-medium">
            ※「目標スコア逆算シミュレーター」タブ内の「文系数学 得点調整シミュレーター」にて、素点から調整後得点へのリアルタイム試算や、地歴との詳細比較を行えます。
          </p>
        </div>
      )}
    </div>
  );
};

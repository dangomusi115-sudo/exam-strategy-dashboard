import React from 'react';
import { PastPaperRecord, UniversityConfig } from '../types';

interface Props {
  universities: UniversityConfig[];
  records: PastPaperRecord[];
  onSelectUniv: (id: string) => void;
  selectedUnivId: string;
}

export const TargetStatusSidebar: React.FC<Props> = ({
  universities,
  records,
  onSelectUniv,
  selectedUnivId,
}) => {
  return (
    <div className="bg-white rounded-lg p-3 shadow-xs border border-slate-200 shrink-0" id="target-status-card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
          ターゲット校ステータス
        </h2>
        <span className="text-[10px] text-slate-400 font-medium">直近演習ベース</span>
      </div>

      <div className="space-y-3.5">
        {universities.map((u) => {
          const univRecords = records.filter((r) => r.universityId === u.id);
          const latestRecord = univRecords[0];
          const latestPassing = u.passingScores[0].score;

          let badge = '未演習';
          let badgeColor = 'text-slate-400 bg-slate-100';
          let progressPercent = 0;
          let diffText = `目標合格点: ${latestPassing}点`;
          let barColor = 'bg-slate-300';

          if (latestRecord) {
            const ratio = (latestRecord.totalScore / latestPassing) * 100;
            progressPercent = Math.min(100, Math.round(ratio));

            if (latestRecord.scoreDiff >= 15) {
              badge = 'A判定 (安全圏)';
              badgeColor = 'text-emerald-700 bg-emerald-50 border border-emerald-200';
              barColor = 'bg-emerald-500';
              diffText = `最低点 +${latestRecord.scoreDiff.toFixed(1)}点 突破中`;
            } else if (latestRecord.scoreDiff >= 0) {
              badge = 'B判定 (合格圏)';
              badgeColor = 'text-indigo-700 bg-indigo-50 border border-indigo-200';
              barColor = 'bg-indigo-500';
              diffText = `最低点 +${latestRecord.scoreDiff.toFixed(1)}点 到達`;
            } else if (latestRecord.scoreDiff >= -25) {
              badge = 'C判定 (ボーダー)';
              badgeColor = 'text-amber-700 bg-amber-50 border border-amber-200';
              barColor = 'bg-amber-500';
              diffText = `目標まで あと ${Math.abs(latestRecord.scoreDiff).toFixed(1)}点`;
            } else {
              badge = 'D判定 (要対策)';
              badgeColor = 'text-rose-700 bg-rose-50 border border-rose-200';
              barColor = 'bg-rose-500';
              diffText = `目標まで あと ${Math.abs(latestRecord.scoreDiff).toFixed(1)}点`;
            }
          }

          const isSelected = selectedUnivId === u.id;

          return (
            <div
              key={u.id}
              onClick={() => onSelectUniv(u.id)}
              className={`p-2 rounded-md transition-all cursor-pointer border ${
                isSelected
                  ? 'border-indigo-300 bg-indigo-50/40 shadow-2xs'
                  : 'border-transparent hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-bold text-slate-800 text-xs truncate max-w-[170px]" title={u.name}>
                  {u.shortName}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeColor}`}>
                  {badge}
                </span>
              </div>

              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor} transition-all duration-500`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex justify-between items-center mt-1 text-[10px]">
                <span className="text-slate-400">
                  {latestRecord ? `${latestRecord.totalScore}/${u.totalMaxScore}点` : '未演習'}
                </span>
                <span className="text-slate-500 font-mono font-medium">{diffText}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

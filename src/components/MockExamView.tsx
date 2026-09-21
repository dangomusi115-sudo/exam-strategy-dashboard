import React, { useState } from 'react';
import { MockExamRecord, ExamJudgementGrade } from '../types';
import {
  BarChart3,
  TrendingUp,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Target,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface Props {
  mockExams: MockExamRecord[];
  onAddMockExam: () => void;
  onEditMockExam: (record: MockExamRecord) => void;
  onDeleteMockExam: (id: string) => void;
}

const getJudgementBadge = (grade: ExamJudgementGrade) => {
  switch (grade) {
    case 'A':
      return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-300', label: 'A判定 (80%以上)' };
    case 'B':
      return { bg: 'bg-teal-50 text-teal-700 border-teal-300', label: 'B判定 (60%以上)' };
    case 'C':
      return { bg: 'bg-amber-50 text-amber-700 border-amber-300', label: 'C判定 (50%ライン)' };
    case 'D':
      return { bg: 'bg-orange-50 text-orange-700 border-orange-300', label: 'D判定 (努力圏)' };
    case 'E':
      return { bg: 'bg-rose-50 text-rose-700 border-rose-300', label: 'E判定 (再対策)' };
    default:
      return { bg: 'bg-slate-50 text-slate-600 border-slate-200', label: '-' };
  }
};

export const MockExamView: React.FC<Props> = ({
  mockExams,
  onAddMockExam,
  onEditMockExam,
  onDeleteMockExam,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'common_test' | 'written' | 'university_open'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredExams = mockExams.filter((m) => {
    if (selectedCategory === 'all') return true;
    return m.examCategory === selectedCategory;
  });

  // Calculate stats & deviations
  const examsWithDev = mockExams.filter((m) => m.overallDeviation !== undefined);
  const latestExam = mockExams.length > 0 ? mockExams[0] : null;
  const avgDeviation =
    examsWithDev.length > 0
      ? (examsWithDev.reduce((acc, cur) => acc + (cur.overallDeviation || 0), 0) / examsWithDev.length).toFixed(1)
      : null;
  const maxDeviation =
    examsWithDev.length > 0
      ? Math.max(...examsWithDev.map((m) => m.overallDeviation || 0)).toFixed(1)
      : null;

  return (
    <div className="bg-white rounded-lg shadow-xs border border-slate-200 flex-1 flex flex-col overflow-hidden min-h-0" id="mock-exam-view-container">
      {/* Top Banner with Stats & Navigation */}
      <div className="p-3 px-4 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white shadow-2xs">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>模試ナビ：全統模試・各種模試 成績カルテ</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.2 rounded">
                河合塾 / 駿台 / 東進 対応
              </span>
            </h2>
            <p className="text-[10px] text-slate-500">
              全統共通テスト模試・全統記述模試の得点・総合偏差値・志望校判定を記録し、推移を可視化します。
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAddMockExam}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded text-xs flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            模試成績を登録
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="p-3 border-b border-slate-200 bg-white grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0 text-xs">
        <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
          <span className="text-[10px] font-bold text-slate-500 block uppercase">登録模試数</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-black text-slate-800 font-mono">{mockExams.length}</span>
            <span className="text-[11px] text-slate-400 font-medium">回</span>
          </div>
          <span className="text-[9px] text-slate-400 block mt-0.5">年度通期受験ログ</span>
        </div>

        <div className="p-2.5 rounded border border-slate-200 bg-indigo-50/50">
          <span className="text-[10px] font-bold text-indigo-700 block uppercase">直近総合偏差値</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-black text-indigo-900 font-mono">
              {latestExam?.overallDeviation ? latestExam.overallDeviation.toFixed(1) : '-'}
            </span>
          </div>
          <span className="text-[9px] text-indigo-500 block mt-0.5 truncate">
            {latestExam ? latestExam.title : '未登録'}
          </span>
        </div>

        <div className="p-2.5 rounded border border-slate-200 bg-emerald-50/50">
          <span className="text-[10px] font-bold text-emerald-800 block uppercase">最高総合偏差値</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-black text-emerald-900 font-mono">
              {maxDeviation ?? '-'}
            </span>
          </div>
          <span className="text-[9px] text-emerald-600 block mt-0.5">全統・全国自己最高</span>
        </div>

        <div className="p-2.5 rounded border border-slate-200 bg-amber-50/50">
          <span className="text-[10px] font-bold text-amber-800 block uppercase">神戸大 経営 最新判定</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            {latestExam?.judgements.find((j) => j.universityId === 'kobe') ? (
              <span className="text-lg font-black text-amber-900 font-mono">
                {latestExam.judgements.find((j) => j.universityId === 'kobe')?.judgement}判定
              </span>
            ) : (
              <span className="text-slate-400 text-sm">-</span>
            )}
          </div>
          <span className="text-[9px] text-amber-700 block mt-0.5">
            同志社:{latestExam?.judgements.find((j) => j.universityId === 'doshisha')?.judgement || '-'} / 関大:{latestExam?.judgements.find((j) => j.universityId === 'kansai')?.judgement || '-'}
          </span>
        </div>
      </div>

      {/* Filter and Content Area */}
      <div className="p-2.5 px-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0 bg-white">
        <div className="inline-flex bg-slate-100 p-0.5 rounded text-[11px] font-semibold">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-0.5 rounded transition-all cursor-pointer ${
              selectedCategory === 'all' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            すべての模試 ({mockExams.length})
          </button>
          <button
            onClick={() => setSelectedCategory('common_test')}
            className={`px-2.5 py-0.5 rounded transition-all cursor-pointer ${
              selectedCategory === 'common_test' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            共通テスト型
          </button>
          <button
            onClick={() => setSelectedCategory('written')}
            className={`px-2.5 py-0.5 rounded transition-all cursor-pointer ${
              selectedCategory === 'written' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            記述・二次型
          </button>
          <button
            onClick={() => setSelectedCategory('university_open')}
            className={`px-2.5 py-0.5 rounded transition-all cursor-pointer ${
              selectedCategory === 'university_open' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            大学別オープン
          </button>
        </div>

        <span className="text-[10px] text-slate-400 font-mono">
          表示中: {filteredExams.length}件
        </span>
      </div>

      {/* List / Table */}
      <div className="flex-1 overflow-auto min-h-0">
        {filteredExams.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 p-4">
            <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 mb-2.5">
              <Award className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-700">模試成績の記録はまだありません</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-md text-center leading-relaxed">
              河合塾の全統共通テスト模試や全統記述模試、駿台模試などの結果表が手元にあれば、
              右上の「模試成績を登録」ボタンから登録して偏差値や志望校判定の推移を管理できます。
            </p>
            <button
              onClick={onAddMockExam}
              className="mt-3 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              模試成績を登録する
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredExams.map((m) => {
              const pct = m.totalMaxScore > 0 ? ((m.totalScore / m.totalMaxScore) * 100).toFixed(1) : '0';
              const isExpanded = expandedId === m.id;

              return (
                <div key={m.id} className="hover:bg-indigo-50/20 transition-colors">
                  {/* Row Header */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : m.id)}
                    className="p-3 flex flex-wrap items-center justify-between gap-2.5 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-[200px]">
                      <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                        {m.date}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                          m.examCategory === 'common_test'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : m.examCategory === 'written'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {m.examCategory === 'common_test' ? '共テ型' : m.examCategory === 'written' ? '記述型' : 'オープン'}
                      </span>
                      <div>
                        <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <span>{m.title}</span>
                          <span className="text-[10px] font-normal text-slate-400">({m.provider})</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {m.year}年度 • 科目数:{m.subjectScores.length}
                        </div>
                      </div>
                    </div>

                    {/* Scores & Deviation */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">総合得点</span>
                        <div className="font-mono font-bold text-xs text-slate-900">
                          {m.totalScore}
                          <span className="text-[10px] text-slate-400 font-normal">/{m.totalMaxScore} ({pct}%)</span>
                        </div>
                      </div>

                      {m.overallDeviation !== undefined && (
                        <div className="text-right bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <span className="text-[9px] text-amber-800 font-bold block">総合偏差値</span>
                          <span className="font-mono font-black text-sm text-amber-900">
                            {m.overallDeviation.toFixed(1)}
                          </span>
                        </div>
                      )}

                      {/* Judgement Badges */}
                      <div className="hidden sm:flex items-center gap-1.5">
                        {m.judgements.map((j) => {
                          const badge = getJudgementBadge(j.judgement);
                          return (
                            <div
                              key={j.universityId}
                              className={`px-2 py-0.5 rounded border text-[10px] font-bold ${badge.bg}`}
                              title={`${j.targetName}: ${badge.label}`}
                            >
                              <span className="opacity-70 text-[9px] mr-1">
                                {j.universityId === 'kobe' ? '神戸' : j.universityId === 'doshisha' ? '同志社' : '関大'}:
                              </span>
                              <span className="font-mono font-black text-xs">{j.judgement}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Operations: Edit & Delete */}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onEditMockExam(m)}
                          title="この模試成績を編集"
                          className="p-1.5 text-slate-400 hover:text-amber-600 rounded hover:bg-amber-50 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteMockExam(m.id)}
                          title="この模試成績を削除"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : m.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail View */}
                  {isExpanded && (
                    <div className="p-3.5 bg-slate-50/80 border-t border-slate-100 text-xs space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-slate-200">
                        <span className="font-bold text-slate-700 text-xs">
                          {m.title} 科目別成績カルテ & 模試ナビ分析
                        </span>
                        <button
                          onClick={() => onEditMockExam(m)}
                          className="px-2.5 py-0.5 text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 rounded flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                          この模試成績を編集する
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Subject breakdowns */}
                        <div className="bg-white p-2.5 rounded border border-slate-200 md:col-span-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-2">
                            科目別 得点 & 偏差値
                          </span>
                          <div className="space-y-1.5">
                            {m.subjectScores.map((s, idx) => {
                              const sPct = s.maxScore > 0 ? ((s.score / s.maxScore) * 100).toFixed(0) : '0';
                              return (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-[11px] p-1.5 rounded bg-slate-50 border border-slate-200"
                                >
                                  <span className="font-medium text-slate-700">{s.subjectName}</span>
                                  <div className="flex items-center gap-2 font-mono">
                                    <span className="font-bold text-slate-900">
                                      {s.score} / {s.maxScore}
                                    </span>
                                    <span className="text-[10px] text-slate-400">({sPct}%)</span>
                                    {s.deviation !== undefined && (
                                      <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                                        SS {s.deviation.toFixed(1)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Judgements */}
                        <div className="bg-white p-2.5 rounded border border-slate-200 md:col-span-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-2">
                            模試判定・志望校評価
                          </span>
                          <div className="space-y-1.5">
                            {m.judgements.map((j) => {
                              const badge = getJudgementBadge(j.judgement);
                              return (
                                <div
                                  key={j.universityId}
                                  className="p-1.5 rounded border border-slate-200 flex items-center justify-between text-[11px]"
                                >
                                  <span className="font-medium text-slate-700">{j.targetName}</span>
                                  <span className={`px-2 py-0.5 rounded font-black font-mono text-xs ${badge.bg}`}>
                                    {j.judgement}判定
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Reflections & Next Plan */}
                        <div className="bg-white p-2.5 rounded border border-slate-200 md:col-span-1 space-y-2">
                          <div>
                            <span className="text-[10px] font-bold text-rose-700 uppercase block mb-1">
                              失点要因・反省分析
                            </span>
                            <p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                              {m.reflection || '反省メモ未記入'}
                            </p>
                          </div>
                          <div className="pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-bold text-emerald-700 uppercase block mb-1">
                              次回への改善アクション
                            </span>
                            <p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                              {m.nextActionPlan || '改善アクション未記入'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 px-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
        <span className="flex items-center gap-1 font-medium">
          <Sparkles className="w-3 h-3 text-amber-500" />
          全統模試の偏差値は河合塾の公式成績表（模試ナビ）の数値をそのまま入力・蓄積できます。
        </span>
        <button
          onClick={onAddMockExam}
          className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
        >
          ＋ 模試成績を追加
        </button>
      </div>
    </div>
  );
};

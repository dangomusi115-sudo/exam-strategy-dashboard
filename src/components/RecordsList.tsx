import React, { useState } from 'react';
import { PastPaperRecord, UniversityConfig } from '../types';
import { getExamRegime } from '../data/universities';
import { analyzeRecordReverseCalculation } from '../utils/reverseCalc';
import { RecordReverseCalcModal } from './RecordReverseCalcModal';
import {
  ExternalLink,
  Trash2,
  Filter,
  Download,
  Calendar,
  Layers,
  ArrowUpDown,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  PlusCircle,
  Pencil,
  Calculator,
  Sparkles,
  SlidersHorizontal,
  Target
} from 'lucide-react';

interface Props {
  records: PastPaperRecord[];
  universities: UniversityConfig[];
  selectedUnivFilter: string;
  onFilterChange: (id: string) => void;
  onDeleteRecord: (id: string) => void;
  onEditRecord?: (record: PastPaperRecord) => void;
  onClearAllRecords?: () => void;
  onOpenRecordForm?: () => void;
  onExportCSV: () => void;
  spreadsheetUrl?: string;
  onManualSync: (recordId: string) => void;
  onOpenReverseCalculator?: (record: PastPaperRecord) => void;
}

export const RecordsList: React.FC<Props> = ({
  records,
  universities,
  selectedUnivFilter,
  onFilterChange,
  onDeleteRecord,
  onEditRecord,
  onClearAllRecords,
  onOpenRecordForm,
  onExportCSV,
  spreadsheetUrl,
  onManualSync,
  onOpenReverseCalculator,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'passed' | 'failed'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reverseCalcRecord, setReverseCalcRecord] = useState<PastPaperRecord | null>(null);

  const filteredRecords = records.filter((r) => {
    const univMatch = selectedUnivFilter === 'all' || r.universityId === selectedUnivFilter;
    if (!univMatch) return false;
    if (activeTab === 'passed') return r.isPassed;
    if (activeTab === 'failed') return !r.isPassed;
    return true;
  });

  return (
    <div
      className="bg-white rounded-lg shadow-xs border border-slate-200 flex-1 flex flex-col overflow-hidden min-h-0"
      id="records-table-container"
    >
      {/* Table Action Bar */}
      <div className="p-2.5 px-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            過去問演習記録ログ・得点分析一覧
          </h2>
          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
            {filteredRecords.length}件
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filter Tabs */}
          <div className="inline-flex bg-slate-100 p-0.5 rounded text-[11px] font-semibold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2 py-0.5 rounded transition-all ${
                activeTab === 'all' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setActiveTab('passed')}
              className={`px-2 py-0.5 rounded transition-all ${
                activeTab === 'passed' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              合格圏突破
            </button>
            <button
              onClick={() => setActiveTab('failed')}
              className={`px-2 py-0.5 rounded transition-all ${
                activeTab === 'failed' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              要対策
            </button>
          </div>

          {/* Target School Selector */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={selectedUnivFilter}
              onChange={(e) => onFilterChange(e.target.value)}
              className="text-[11px] font-medium bg-transparent text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">全志望校</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.shortName}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onExportCSV}
            disabled={records.length === 0}
            title="CSV形式で保存"
            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3 h-3" />
            CSV出力
          </button>

          {onClearAllRecords && records.length > 0 && (
            <button
              onClick={onClearAllRecords}
              title="すべての演習記録を削除して空欄に戻す"
              className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded border border-rose-200 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              全記録を消去
            </button>
          )}
        </div>
      </div>

      {/* High Density Table Body */}
      <div className="flex-1 overflow-auto min-h-0">
        {filteredRecords.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center text-slate-400 p-4">
            <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 mb-2">
              <Calendar className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-700">演習記録はまだ登録されていません</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm text-center">
              画面上部にある「過去問演習の記録を追加」フォームに、年度と各科目の点数を入力して「記録を保存」をクリックしてください。
            </p>
            {onOpenRecordForm && (
              <button
                type="button"
                onClick={onOpenRecordForm}
                className="mt-3 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                入力フォームを開く
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-left border-collapse table-fixed" id="high-density-records-table">
            <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs shadow-2xs z-10">
              <tr className="text-[11px] text-slate-500 font-bold uppercase tracking-tight border-b border-slate-200">
                <th className="py-2 px-2.5 w-24">演習日</th>
                <th className="py-2 px-2.5 w-40">志望校 / 年度</th>
                <th className="py-2 px-2.5 w-24 text-right">合計得点</th>
                <th className="py-2 px-2.5 w-24 text-right">合格最低点</th>
                <th className="py-2 px-2.5 w-20 text-right">差分</th>
                <th className="py-2 px-2.5 w-24 text-center">判定</th>
                <th className="py-2 px-2.5 w-28 text-center">共テ逆算</th>
                <th className="py-2 px-2.5">科目別内訳・反省メモ</th>
                <th className="py-2 px-2.5 w-16 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100">
              {filteredRecords.map((r) => {
                const u = universities.find((univ) => univ.id === r.universityId);
                const univName = u ? u.shortName : r.universityId;
                const pct = ((r.totalScore / r.totalMaxScore) * 100).toFixed(1);

                const isBorderline = !r.isPassed && r.scoreDiff >= -15;

                const isExpanded = expandedId === r.id;
                const analysis = analyzeRecordReverseCalculation(r, universities);

                return (
                  <React.Fragment key={r.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      className={`hover:bg-indigo-50/40 transition-colors cursor-pointer ${
                        isExpanded ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <td className="py-2 px-2.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {r.date}
                      </td>

                      <td className="py-2 px-2.5">
                        <div className="font-bold text-slate-800 text-xs truncate flex items-center gap-1.5" title={univName}>
                          <span>{univName}</span>
                          {(() => {
                            const reg = r.examRegime || getExamRegime(r.year);
                            if (reg === 'new_curriculum') {
                              return (
                                <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 shrink-0">
                                  新課程
                                </span>
                              );
                            }
                            if (reg === 'old_common_test') {
                              return (
                                <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-blue-100 text-blue-800 shrink-0">
                                  旧共テ
                                </span>
                              );
                            }
                            return (
                              <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-100 text-amber-900 shrink-0">
                                センター
                              </span>
                            );
                          })()}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 font-medium">
                          <span>{r.year}年</span>
                          <span>•</span>
                          <span>第{r.attemptNumber}回</span>
                          {r.timeSpentMinutes && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {r.timeSpentMinutes}分
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-2 px-2.5 text-right font-mono">
                        <span className="font-bold text-slate-900 text-xs">{r.totalScore}</span>
                        <span className="text-[10px] text-slate-400 block leading-tight">
                          /{r.totalMaxScore} ({pct}%)
                        </span>
                      </td>

                      <td className="py-2 px-2.5 text-right font-mono text-slate-600 text-xs">
                        {r.totalMaxScore <= 400 && r.universityId === 'kobe' ? (
                          <div>
                            <span className="font-bold text-slate-900">{r.passingBenchmark}点</span>
                            <span className="block text-[9px] text-emerald-700 font-sans font-semibold">個別優先枠</span>
                            <span className="block text-[8.5px] text-slate-400 font-sans">総合: {analysis.passingBenchmark}点</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-slate-900">{r.passingBenchmark}点</span>
                            <span className="block text-[9px] text-slate-500 font-sans">総合最低点</span>
                          </div>
                        )}
                      </td>

                      <td className="py-2 px-2.5 text-right font-mono">
                        <span
                          className={`font-bold text-xs ${
                            r.isPassed
                              ? 'text-emerald-600'
                              : isBorderline
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {r.scoreDiff > 0 ? `+${r.scoreDiff}` : r.scoreDiff}
                        </span>
                        {r.totalMaxScore <= 400 && r.universityId === 'kobe' && (
                          <span className="block text-[8.5px] text-slate-400 font-sans">対個別枠</span>
                        )}
                      </td>

                      <td className="py-2 px-2.5 text-center">
                        {r.isPassed ? (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {r.totalMaxScore <= 400 && r.universityId === 'kobe' ? '個別枠到達' : '合格圏突破'}
                          </span>
                        ) : isBorderline ? (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            ボーダーライン
                          </span>
                        ) : (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            要対策
                          </span>
                        )}
                      </td>

                      {/* Reverse Calculation Quick Button Cell */}
                      <td className="py-2 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setReverseCalcRecord(r)}
                          className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 hover:border-indigo-300 text-[10.5px] font-bold flex items-center justify-center gap-1 shadow-2xs cursor-pointer transition-all w-full"
                          title="この記録の二次得点から共通テスト必要点を逆算"
                        >
                          <Calculator className="w-3 h-3 text-indigo-600" />
                          <span>逆算を見る</span>
                        </button>
                        <div className="text-[9px] font-mono mt-0.5 whitespace-nowrap">
                          {analysis.clearsIndividualPriority ? (
                            <div>
                              <span className="text-emerald-700 font-bold block">★個別優先クリア</span>
                              <span className="text-slate-500 block text-[8.5px]">総合必要: {analysis.neededCommonWeighted}点</span>
                            </div>
                          ) : (
                            <span className="text-indigo-900/90 font-mono block">
                              共テ必要: <strong>{analysis.neededCommonWeighted}点</strong> ({analysis.neededCommonPct}%)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2 px-2.5">
                        <div className="flex flex-wrap items-center gap-1 mb-0.5">
                          {r.subjectScores.map((s, idx) => {
                            const isMath = s.subjectName.includes('数学') || s.subjectName.includes('選択');
                            return (
                              <span
                                key={idx}
                                className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                                  isMath && (r.mathScoreAdjustmentApplied || s.adjustedScore !== undefined)
                                    ? 'bg-purple-100 text-purple-900 font-bold border border-purple-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                                title={s.adjustmentInfo || undefined}
                              >
                                {s.subjectName.includes('数学') ? '文数' : s.subjectName.slice(0, 2)}: {s.score}
                                {s.rawScore !== undefined && s.rawScore !== s.score && (
                                  <span className="text-[8.5px] font-normal text-purple-700 ml-0.5">
                                    (素{s.rawScore})
                                  </span>
                                )}
                              </span>
                            );
                          })}
                          {r.mathScoreAdjustmentApplied && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold whitespace-nowrap">
                              得点調整済
                            </span>
                          )}
                        </div>
                        {r.mistakeAnalysis ? (
                          <p className="text-[10px] text-slate-500 truncate max-w-md">
                            <span className="text-slate-400">分析:</span> {r.mistakeAnalysis}
                          </p>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">反省メモ未記入</span>
                        )}
                      </td>

                      <td className="py-2 px-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          {onEditRecord && (
                            <button
                              onClick={() => onEditRecord(r)}
                              title="この演習記録を編集・修正"
                              className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-amber-50 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteRecord(r.id)}
                            title="この演習記録を削除"
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Detailed Accordion Row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/80">
                        <td colSpan={9} className="p-3 text-xs border-b border-slate-200">
                          <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-slate-200/60">
                            <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                              <span>{univName} {r.year}年度 (第{r.attemptNumber}回) 詳細振り返り</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReverseCalcRecord(r);
                                }}
                                className="px-2 py-0.5 text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Calculator className="w-3 h-3 text-indigo-600" />
                                逆算シートを開く
                              </button>
                              {onEditRecord && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditRecord(r);
                                  }}
                                  className="px-2 py-0.5 text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 rounded flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Pencil className="w-3 h-3" />
                                  この演習記録を編集する
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Reverse Calculation Summary Card inside accordion */}
                          <div className="mb-3 p-3 bg-gradient-to-r from-indigo-50/90 via-white to-slate-50 border border-indigo-200 rounded-lg shadow-2xs">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-1.5 border-b border-indigo-100">
                              <div className="flex items-center gap-1.5">
                                <div className="p-1 bg-indigo-600 text-white rounded">
                                  <Calculator className="w-3.5 h-3.5" />
                                </div>
                                <span className="font-bold text-slate-900 text-xs">
                                  ⚡ この演習結果に基づく共通テスト必要点 逆算分析
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${analysis.statusColor}`}>
                                  {analysis.statusBadge}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReverseCalcRecord(r);
                                  }}
                                  className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                >
                                  <Sparkles className="w-3 h-3 text-indigo-500" />
                                  逆算詳細モーダル
                                </button>

                                {onOpenReverseCalculator && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenReverseCalculator(r);
                                    }}
                                    className="px-2.5 py-1 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                  >
                                    <SlidersHorizontal className="w-3 h-3" />
                                    計算機でこの記録を試算
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs mb-2">
                              <div className="bg-white p-2 rounded border border-slate-200">
                                <span className="text-[10px] text-slate-500 font-bold block">二次試験得点</span>
                                <div className="flex items-baseline gap-1 mt-0.5">
                                  <span className="text-base font-bold font-mono text-slate-900">{analysis.secondaryTotal}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">/ {analysis.secondaryMax}点</span>
                                  <span className="text-[10px] text-indigo-600 font-mono font-bold ml-auto">{analysis.secondaryPct}%</span>
                                </div>
                              </div>

                              <div className="bg-white p-2 rounded border border-slate-200">
                                <span className="text-[10px] text-slate-500 font-bold block">{r.year}年度 総合合格最低点</span>
                                <div className="flex items-baseline gap-1 mt-0.5">
                                  <span className="text-base font-bold font-mono text-slate-900">{analysis.passingBenchmark}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">/ {analysis.totalMaxScore}点</span>
                                </div>
                                <span className="text-[9.5px] text-slate-400 block mt-0.5">共テ＋二次の総合選抜枠</span>
                              </div>

                              <div className="bg-indigo-50/70 p-2 rounded border border-indigo-200">
                                <span className="text-[10px] text-indigo-950 font-bold block">総合合格に必要な共テ得点</span>
                                <div className="flex items-baseline gap-1 mt-0.5">
                                  <span className="text-base font-bold font-mono text-indigo-700">{analysis.neededCommonWeighted}</span>
                                  <span className="text-[10px] text-indigo-900 font-mono">/ {analysis.commonMaxScore}点</span>
                                  <span className="text-[10px] text-indigo-800 font-mono font-bold ml-auto">{analysis.neededCommonPct}%</span>
                                </div>
                                <span className="text-[9.5px] text-indigo-800/80 block mt-0.5">
                                  素点目安: 約{analysis.neededCommonRaw} / {analysis.commonRawMaxScore}点
                                </span>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-600 leading-relaxed bg-white/80 p-2 rounded border border-slate-200">
                              💡 {analysis.statusMessage}
                            </p>

                            {analysis.isKobe && (
                              <div className="mt-1.5 p-2 bg-emerald-50/80 border border-emerald-200 rounded text-[11px] text-emerald-950">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold flex items-center gap-1">
                                    <span>🏛️</span>
                                    <span>神戸大経営 【個別学力優先枠（第1段階）】</span>
                                  </span>
                                  <span className="font-mono font-bold text-emerald-800 text-[10.5px]">
                                    ボーダー 約{analysis.individualPriorityCutoff}点 / {analysis.secondaryMax}点
                                  </span>
                                </div>
                                <p className="text-[10.5px] text-emerald-800 mt-0.5 leading-relaxed">
                                  {analysis.clearsIndividualPriority ? (
                                    <span className="font-bold text-emerald-700">
                                      ✅ 二次得点（{analysis.secondaryTotal}点）で個別優先ボーダーをクリア（+{analysis.individualDiff}点）！共通テスト得点に関わらず合格濃厚です。
                                    </span>
                                  ) : (
                                    <span>
                                      個別優先ボーダーまであと <strong>{Math.abs(analysis.individualDiff)}点</strong>。個別枠に届かなくても、第3段階（総合選抜・最低点{analysis.passingBenchmark}点）を目指す場合は共通テストで <strong>{analysis.neededCommonWeighted}点 / {analysis.commonMaxScore}点 ({analysis.neededCommonPct}%)</strong> を取れば合格可能です。
                                    </span>
                                  )}
                                </p>
                              </div>
                            )}

                            {(r.mathScoreAdjustmentApplied || r.universityId === 'doshisha' || r.universityId === 'kansai') && (
                              <div className="mt-1.5 p-2 bg-purple-50/80 border border-purple-200 rounded text-[11px] text-purple-950">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold flex items-center gap-1">
                                    <span>⚖️</span>
                                    <span>{u?.name || '同志社・関大'} 選択科目（文系数学）得点調整・中央値補正</span>
                                  </span>
                                  <span className="font-mono font-bold text-purple-800 text-[10.5px]">
                                    {r.mathScoreAdjustmentApplied ? '得点調整（換算後）反映済' : '素点ベース記録'}
                                  </span>
                                </div>
                                <p className="text-[10.5px] text-purple-900 mt-0.5 leading-relaxed">
                                  {r.mathScoreAdjustmentApplied ? (
                                    <span>
                                      文系数学の素点 <strong>{r.mathRawScore ?? '—'}点</strong> を中央値 <strong>{r.mathMedianUsed ?? 55}点</strong> で換算し、
                                      調整後得点 <strong>{r.mathAdjustedScore ?? r.subjectScores.find(s => s.subjectName.includes('数学') || s.subjectName.includes('選択'))?.score}点</strong>（{((r.mathAdjustedScore ?? 0) - (r.mathRawScore ?? 0)) >= 0 ? `+${((r.mathAdjustedScore ?? 0) - (r.mathRawScore ?? 0))}` : ((r.mathAdjustedScore ?? 0) - (r.mathRawScore ?? 0))}点ボーナス）として公表合格最低点（調整後基準）と照合しています。
                                    </span>
                                  ) : (
                                    <span>
                                      ※大学公表の合格最低点は得点調整後の点数です。文系数学は中央値が低いため、素点6割前後で約+10〜15点ほど高く換算されます（編集から調整後反映可能）。
                                    </span>
                                  )}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                科目別得点詳細
                              </span>
                              <div className="space-y-1">
                                {r.subjectScores.map((sub, sIdx) => {
                                  const subPct = ((sub.score / sub.maxScore) * 100).toFixed(0);
                                  const isAdjustedMath = (sub.subjectName.includes('数学') || sub.subjectName.includes('選択')) && (r.mathScoreAdjustmentApplied || sub.rawScore !== undefined);
                                  return (
                                    <div
                                      key={sIdx}
                                      className={`flex items-center justify-between text-[11px] p-1 px-2 rounded border ${
                                        isAdjustedMath ? 'bg-purple-50/70 border-purple-200' : 'bg-white border-slate-200'
                                      }`}
                                    >
                                      <div>
                                        <span className={`font-medium ${isAdjustedMath ? 'text-purple-900 font-bold' : 'text-slate-700'}`}>
                                          {sub.subjectName}
                                        </span>
                                        {isAdjustedMath && sub.rawScore !== undefined && (
                                          <span className="block text-[9px] text-purple-700 font-mono">
                                            素点 {sub.rawScore}点 → 換算後 {sub.score}点
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-slate-900">
                                          {sub.score} / {sub.maxScore}点
                                        </span>
                                        <span className="text-[10px] text-indigo-600 font-mono">
                                          ({subPct}%)
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="bg-white p-2 rounded border border-slate-200">
                              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block mb-1">
                                失点要因・反省分析
                              </span>
                              <p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {r.mistakeAnalysis || '反省メモは記入されていません。'}
                              </p>
                            </div>

                            <div className="bg-white p-2 rounded border border-slate-200">
                              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                                次回への改善アクション
                              </span>
                              <p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {r.nextActionPlan || '改善アクションは記入されていません。'}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Table Footer with Status Legend */}
      <div className="p-2 px-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-[10px] text-slate-500 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-600">判定基準:</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            合格圏内 (最低点以上)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            ボーダーライン (-15点以内)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            要対策 (-16点以下)
          </span>
        </div>
        <div>
          <span>行をクリックすると科目別内訳と反省メモを展開表示できます</span>
        </div>
      </div>

      {/* Record Reverse Calculation Modal */}
      <RecordReverseCalcModal
        isOpen={Boolean(reverseCalcRecord)}
        onClose={() => setReverseCalcRecord(null)}
        record={reverseCalcRecord}
        universities={universities}
        onOpenFullCalculator={onOpenReverseCalculator}
      />
    </div>
  );
};

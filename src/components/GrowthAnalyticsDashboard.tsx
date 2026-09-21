import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  AreaChart,
  Area,
} from 'recharts';
import { PastPaperRecord, MockExamRecord, UniversityConfig } from '../types';
import { TrendingUp, Award, BarChart3, Target, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  pastRecords: PastPaperRecord[];
  mockExams: MockExamRecord[];
  universities: UniversityConfig[];
}

export const GrowthAnalyticsDashboard: React.FC<Props> = ({
  pastRecords,
  mockExams,
  universities,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'past_papers' | 'mock_exams'>('past_papers');
  const [selectedUnivFilter, setSelectedUnivFilter] = useState<string>('all');
  const [chartMetric, setChartMetric] = useState<'percentage' | 'scoreDiff'>('percentage');

  // Sort past records chronologically by exercise date (演習日順)
  const sortedPastRecords = [...pastRecords].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const filteredPastRecords = sortedPastRecords.filter((r) => {
    if (selectedUnivFilter === 'all') return true;
    return r.universityId === selectedUnivFilter;
  });

  // Format date to short string M/D (e.g., '10/15')
  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
    }
    return dateStr;
  };

  // Data for Past Paper Trend Chart (Ordered by exercise date)
  const pastChartData = filteredPastRecords.map((r, index) => {
    const univ = universities.find((u) => u.id === r.universityId);
    const percentage = Number(((r.totalScore / r.totalMaxScore) * 100).toFixed(1));
    const passPercentage = Number(((r.passingBenchmark / r.totalMaxScore) * 100).toFixed(1));
    const shortDate = formatShortDate(r.date);
    return {
      index: index + 1,
      name: `${univ ? univ.shortName : ''} (${shortDate})`,
      // X-axis label prominently displays the exercise date, along with the exam year
      axisLabel: `${shortDate} (${r.year.toString().slice(-2)}年)`,
      label: `${shortDate} ${univ ? univ.shortName : ''}`,
      fullTitle: `${univ ? univ.name : ''} ${r.year}年度 (第${r.attemptNumber}回)`,
      date: r.date,
      year: r.year,
      attemptNumber: r.attemptNumber,
      totalScore: r.totalScore,
      totalMaxScore: r.totalMaxScore,
      percentage,
      passingBenchmark: r.passingBenchmark,
      passPercentage,
      scoreDiff: r.scoreDiff,
      isPassed: r.isPassed,
      timeSpentMinutes: r.timeSpentMinutes || 0,
      universityName: univ ? univ.shortName : r.universityId,
    };
  });

  // Calculate Past Paper Highlights
  const passedCount = pastRecords.filter((r) => r.isPassed).length;
  const passRate = pastRecords.length > 0 ? Math.round((passedCount / pastRecords.length) * 100) : 0;
  const recentDiff = pastChartData.length > 0 ? pastChartData[pastChartData.length - 1].scoreDiff : 0;

  // Sort mock exams chronologically
  const sortedMocks = [...mockExams].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  // Data for Mock Exam Deviation & Score Trend Chart
  const mockChartData = sortedMocks.map((m, index) => {
    // Collect specific subject deviations if available
    const english = m.subjectScores.find((s) => s.subjectName.includes('英語') || s.subjectName.includes('外国語'));
    const math = m.subjectScores.find((s) => s.subjectName.includes('数学'));
    const japanese = m.subjectScores.find((s) => s.subjectName.includes('国語'));
    const social = m.subjectScores.find((s) => s.subjectName.includes('歴') || s.subjectName.includes('地') || s.subjectName.includes('社') || s.subjectName.includes('政'));

    return {
      index: index + 1,
      title: m.title,
      shortTitle: m.title.length > 12 ? m.title.slice(0, 11) + '…' : m.title,
      date: m.date,
      category: m.examCategory === 'common_test' ? '共テ模試' : m.examCategory === 'written' ? '記述模試' : '冠模試',
      overallDeviation: m.overallDeviation || null,
      englishDev: english?.deviation || null,
      mathDev: math?.deviation || null,
      japaneseDev: japanese?.deviation || null,
      socialDev: social?.deviation || null,
      totalScore: m.totalScore,
      totalMaxScore: m.totalMaxScore,
      scorePct: Math.round((m.totalScore / m.totalMaxScore) * 100),
    };
  });

  const mocksWithDev = sortedMocks.filter((m) => m.overallDeviation !== undefined);
  const latestMockDev = mocksWithDev.length > 0 ? mocksWithDev[mocksWithDev.length - 1].overallDeviation : null;
  const maxMockDev = mocksWithDev.length > 0 ? Math.max(...mocksWithDev.map((m) => m.overallDeviation || 0)) : null;

  return (
    <div className="bg-white rounded-lg shadow-xs border border-slate-200 overflow-hidden flex flex-col min-h-0" id="growth-analytics-dashboard">
      {/* Header bar with mode switch */}
      <div className="p-3 px-4 border-b border-slate-200 bg-slate-50/90 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-indigo-600 flex items-center justify-center text-white shadow-2xs">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span>成長実感 チャート＆推移アナリティクス</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-300/60">
                可視化グラフ
              </span>
            </h2>
            <p className="text-[10px] text-slate-500">
              過去問の合格ライン突破度合いや模試の偏差値の上昇トレンドを直感的に把握できます
            </p>
          </div>
        </div>

        {/* View Switch Buttons */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-200/80 p-0.5 rounded-md flex items-center text-xs font-bold">
            <button
              onClick={() => setActiveChartTab('past_papers')}
              className={`px-3 py-1 rounded transition-all cursor-pointer ${
                activeChartTab === 'past_papers'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              過去問 得点推移 ({pastRecords.length})
            </button>
            <button
              onClick={() => setActiveChartTab('mock_exams')}
              className={`px-3 py-1 rounded transition-all cursor-pointer ${
                activeChartTab === 'mock_exams'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              模試 偏差値推移 ({mockExams.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-3.5 flex-1 flex flex-col gap-3 overflow-y-auto">
        {/* ===================== PAST PAPERS TAB ===================== */}
        {activeChartTab === 'past_papers' && (
          <div className="flex flex-col gap-3">
            {/* Filter and Metric Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2 px-3 rounded-lg border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600">志望校絞り込み:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setSelectedUnivFilter('all')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                      selectedUnivFilter === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    全大学 ({pastRecords.length})
                  </button>
                  {universities.map((u) => {
                    const count = pastRecords.filter((r) => r.universityId === u.id).length;
                    return (
                      <button
                        key={u.id}
                        onClick={() => setSelectedUnivFilter(u.id)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                          selectedUnivFilter === u.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {u.shortName} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  📅 演習日順に時系列表示
                </span>
                <span className="font-bold text-slate-600 ml-1">表示モード:</span>
                <button
                  onClick={() => setChartMetric('percentage')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                    chartMetric === 'percentage'
                      ? 'bg-indigo-900 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  得点率 % (合格基準線と比較)
                </button>
                <button
                  onClick={() => setChartMetric('scoreDiff')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                    chartMetric === 'scoreDiff'
                      ? 'bg-indigo-900 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  合格最低点との差分 (±点数)
                </button>
              </div>
            </div>

            {/* Quick KPI stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 px-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">総演習回数</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-mono text-xl font-extrabold text-slate-800">{filteredPastRecords.length}</span>
                  <span className="text-xs text-slate-500">回</span>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 px-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">合格ライン突破率</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="font-mono text-xl font-extrabold text-emerald-600">{passRate}%</span>
                  <span className="text-[11px] text-slate-500 font-semibold">({passedCount}勝/{pastRecords.length}演習)</span>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 px-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">直近の合格基準点差</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className={`font-mono text-xl font-extrabold ${recentDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {recentDiff >= 0 ? `+${recentDiff.toFixed(1)}` : recentDiff.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-500">点</span>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 px-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">目標水準</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-mono text-xl font-extrabold text-indigo-700">70〜75%</span>
                  <span className="text-[11px] text-slate-500 font-semibold">突破で安全圏</span>
                </div>
              </div>
            </div>

            {/* Recharts Canvas */}
            {pastChartData.length === 0 ? (
              <div className="h-64 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center p-6 text-center text-slate-400">
                <BarChart3 className="w-10 h-10 stroke-[1.5] text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-600">過去問演習記録がまだありません</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                  演習を実施したら得点を記録してみましょう。合格最低点との比較や推移グラフがリアルタイムに描画されます。
                </p>
              </div>
            ) : (
              <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-200">
                <div className="h-72 sm:h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartMetric === 'percentage' ? (
                      <LineChart data={pastChartData} margin={{ top: 15, right: 20, left: -10, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis
                          dataKey="axisLabel"
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          tickLine={false}
                          interval={0}
                          dy={10}
                        />
                        <YAxis
                          domain={[30, 100]}
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          tickLine={false}
                          unit="%"
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-2.5 px-3 rounded-lg shadow-lg text-xs border border-slate-700 min-w-48">
                                  <p className="font-bold text-slate-100">{data.fullTitle}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">演習日: {data.date}</p>
                                  <div className="mt-2 space-y-1">
                                    <div className="flex justify-between items-center text-indigo-300">
                                      <span>獲得得点:</span>
                                      <span className="font-mono font-bold text-sm text-white">
                                        {data.totalScore} / {data.totalMaxScore}点 ({data.percentage}%)
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-amber-300">
                                      <span>合格最低点:</span>
                                      <span className="font-mono font-bold">
                                        {data.passingBenchmark}点 ({data.passPercentage}%)
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center pt-1 border-t border-slate-700">
                                      <span>合格判定:</span>
                                      <span className={`font-bold ${data.isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {data.isPassed ? `合格突破 (+${data.scoreDiff.toFixed(1)}点)` : `不足 (${data.scoreDiff.toFixed(1)}点)`}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend
                          verticalAlign="top"
                          align="right"
                          iconType="circle"
                          wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                        />
                        <ReferenceLine y={70} stroke="#10b981" strokeDasharray="4 4" label={{ value: '安全圏 70%', fill: '#059669', fontSize: 10, position: 'insideRight' }} />
                        <Line
                          type="monotone"
                          dataKey="percentage"
                          name="獲得得点率(%)"
                          stroke="#4f46e5"
                          strokeWidth={2.5}
                          dot={{ fill: '#4f46e5', r: 4, strokeWidth: 1.5, stroke: '#fff' }}
                          activeDot={{ r: 6, fill: '#4338ca' }}
                        />
                        <Line
                          type="stepAfter"
                          dataKey="passPercentage"
                          name="合格最低点基準(%)"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={false}
                        />
                      </LineChart>
                    ) : (
                      <BarChart data={pastChartData} margin={{ top: 15, right: 20, left: -10, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis
                          dataKey="axisLabel"
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          tickLine={false}
                          interval={0}
                          dy={10}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          tickLine={false}
                          unit="点"
                        />
                        <ReferenceLine y={0} stroke="#334155" strokeWidth={1.5} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-2.5 px-3 rounded-lg shadow-lg text-xs border border-slate-700 min-w-44">
                                  <p className="font-bold text-slate-100">{data.fullTitle}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">演習日: {data.date}</p>
                                  <div className="mt-2 space-y-1">
                                    <div className="flex justify-between items-center">
                                      <span>合格最低点との差:</span>
                                      <span className={`font-mono font-bold text-sm ${data.scoreDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {data.scoreDiff >= 0 ? `+${data.scoreDiff.toFixed(1)}点` : `${data.scoreDiff.toFixed(1)}点`}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-300 text-[11px]">
                                      <span>得点 / 基準点:</span>
                                      <span>{data.totalScore}点 / {data.passingBenchmark}点</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="scoreDiff"
                          name="合格最低点との差分(点)"
                          fill="#6366f1"
                          radius={[3, 3, 0, 0]}
                          shape={(props: any) => {
                            const { fill, x, y, width, height, value } = props;
                            const isPositive = value >= 0;
                            const barFill = isPositive ? '#10b981' : '#f43f5e';
                            return <rect x={x} y={y} width={width} height={height} fill={barFill} rx={3} />;
                          }}
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    緑: 合格最低点クリア (合格圏)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                    赤: 合格最低点未満 (要復習・補強)
                  </span>
                  <span className="font-medium text-indigo-700">
                    目標: 演習を重ねて常にプラス圏をキープ！
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== MOCK EXAMS TAB ===================== */}
        {activeChartTab === 'mock_exams' && (
          <div className="flex flex-col gap-3">
            {/* Quick stats for Mock Exams */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 px-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">登録模試回数</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-mono text-xl font-extrabold text-slate-800">{mockExams.length}</span>
                  <span className="text-xs text-slate-500">回</span>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 px-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">最新 総合偏差値</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-mono text-xl font-extrabold text-indigo-700">
                    {latestMockDev !== null ? latestMockDev.toFixed(1) : '-'}
                  </span>
                  <span className="text-xs text-slate-500">偏差値</span>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 px-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">最高 偏差値 (PB)</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-mono text-xl font-extrabold text-emerald-600">
                    {maxMockDev !== null ? maxMockDev.toFixed(1) : '-'}
                  </span>
                  <span className="text-xs text-slate-500">偏差値</span>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 px-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">志望校ボーダー基準</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-mono text-base font-bold text-slate-700">神戸62.5 / 同志社60.0</span>
                </div>
              </div>
            </div>

            {/* Mock Exams Recharts Chart */}
            {mockChartData.length === 0 ? (
              <div className="h-64 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center p-6 text-center text-slate-400">
                <Award className="w-10 h-10 stroke-[1.5] text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-600">模試成績のデータがまだありません</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                  「模試ナビ」タブから全統模試や冠模試の成績・偏差値を登録すると、推移グラフが自動生成されます。
                </p>
              </div>
            ) : (
              <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-200">
                <div className="h-72 sm:h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockChartData} margin={{ top: 15, right: 20, left: -10, bottom: 35 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="shortTitle"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        tickLine={false}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                        dy={8}
                      />
                      <YAxis
                        domain={[40, 75]}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickLine={false}
                        unit=""
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white p-2.5 px-3 rounded-lg shadow-lg text-xs border border-slate-700 min-w-44">
                                <p className="font-bold text-slate-100">{data.title}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  実施日: {data.date} ({data.category})
                                </p>
                                <div className="mt-2 space-y-1">
                                  {data.overallDeviation !== null && (
                                    <div className="flex justify-between items-center text-indigo-300">
                                      <span className="font-bold">総合偏差値:</span>
                                      <span className="font-mono font-extrabold text-sm text-white">
                                        {data.overallDeviation.toFixed(1)}
                                      </span>
                                    </div>
                                  )}
                                  {data.englishDev !== null && (
                                    <div className="flex justify-between items-center text-emerald-300 text-[11px]">
                                      <span>英語 偏差値:</span>
                                      <span className="font-mono">{data.englishDev}</span>
                                    </div>
                                  )}
                                  {data.mathDev !== null && (
                                    <div className="flex justify-between items-center text-amber-300 text-[11px]">
                                      <span>数学 偏差値:</span>
                                      <span className="font-mono">{data.mathDev}</span>
                                    </div>
                                  )}
                                  {data.japaneseDev !== null && (
                                    <div className="flex justify-between items-center text-sky-300 text-[11px]">
                                      <span>国語 偏差値:</span>
                                      <span className="font-mono">{data.japaneseDev}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                      />
                      <ReferenceLine y={65} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: '神戸大A判定水準 65.0', fill: '#2563eb', fontSize: 10, position: 'insideTopRight' }} />
                      <ReferenceLine y={60} stroke="#10b981" strokeDasharray="3 3" label={{ value: '同志社A判定水準 60.0', fill: '#059669', fontSize: 10, position: 'insideBottomRight' }} />
                      <ReferenceLine y={55} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '関大A判定水準 55.0', fill: '#d97706', fontSize: 10, position: 'insideBottomRight' }} />

                      <Line
                        type="monotone"
                        dataKey="overallDeviation"
                        name="総合偏差値"
                        stroke="#4f46e5"
                        strokeWidth={3}
                        dot={{ fill: '#4f46e5', r: 5, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 7 }}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="englishDev"
                        name="英語"
                        stroke="#10b981"
                        strokeWidth={1.5}
                        strokeDasharray="2 2"
                        dot={{ fill: '#10b981', r: 3 }}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="mathDev"
                        name="数学"
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        strokeDasharray="2 2"
                        dot={{ fill: '#f59e0b', r: 3 }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                  <span className="font-semibold text-indigo-700">
                    志望校ボーダーライン: 神戸大(営) 偏差値62.5〜65.0 / 同志社大(商) 60.0 / 関西大(商) 55.0
                  </span>
                  <span>継続的な推移を記録して本番までの成長を実感しましょう</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

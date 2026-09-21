import React, { useState, useMemo } from 'react';
import {
  Calculator,
  TrendingUp,
  Sparkles,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Scale,
  Award,
  BookOpen,
} from 'lucide-react';
import {
  DOSHISHA_MATH_ADJUSTMENT,
  KANSAI_MATH_ADJUSTMENT,
  calculateMedianAdjustment,
  calculateRawScoreNeeded,
  getDoshishaMathVsSocialComparison,
  UniversityAdjustmentConfig,
} from '../utils/scoreAdjustment';

interface Props {
  initialUnivId?: string;
}

export const MathScoreAdjustmentCalculator: React.FC<Props> = ({
  initialUnivId = 'doshisha',
}) => {
  const [selectedUnivId, setSelectedUnivId] = useState<string>(
    initialUnivId === 'kansai' ? 'kansai' : 'doshisha'
  );

  const config: UniversityAdjustmentConfig = useMemo(() => {
    return selectedUnivId === 'kansai' ? KANSAI_MATH_ADJUSTMENT : DOSHISHA_MATH_ADJUSTMENT;
  }, [selectedUnivId]);

  // Input states
  const [presetId, setPresetId] = useState<'difficult' | 'standard' | 'easy' | 'custom'>('standard');
  const [customMedian, setCustomMedian] = useState<number>(config.defaultPresets[1].median);
  const [rawMathScore, setRawMathScore] = useState<number>(selectedUnivId === 'doshisha' ? 90 : 60);

  // When switching universities, reset sensible defaults
  const handleUnivChange = (univId: string) => {
    setSelectedUnivId(univId);
    setPresetId('standard');
    if (univId === 'kansai') {
      setCustomMedian(44);
      setRawMathScore(60);
    } else {
      setCustomMedian(55);
      setRawMathScore(90);
    }
  };

  // Active median
  const activeMedian = useMemo(() => {
    if (presetId === 'custom') return customMedian;
    const found = config.defaultPresets.find((p) => p.id === presetId);
    return found ? found.median : config.defaultPresets[1].median;
  }, [presetId, customMedian, config]);

  // Calculations
  const adjustmentResult = useMemo(() => {
    return calculateMedianAdjustment(rawMathScore, config.maxScore, activeMedian);
  }, [rawMathScore, config.maxScore, activeMedian]);

  // 3-Subject Overall Simulator for Doshisha (500 pts) or Kansai (450 pts)
  const [englishScore, setEnglishScore] = useState<number>(selectedUnivId === 'doshisha' ? 148 : 140); // out of 200
  const [japaneseScore, setJapaneseScore] = useState<number>(selectedUnivId === 'doshisha' ? 104 : 100); // out of 150

  const targetCutoff = selectedUnivId === 'doshisha' ? 362 : 305; // 過去問合格最低点目安（得点調整後）
  const totalMax = selectedUnivId === 'doshisha' ? 500 : 450;

  const rawTotal = englishScore + japaneseScore + rawMathScore;
  const adjustedTotal = Math.round((englishScore + japaneseScore + adjustmentResult.adjustedScore) * 10) / 10;
  const diffFromCutoff = Math.round((adjustedTotal - targetCutoff) * 10) / 10;
  const rawDiffFromCutoff = Math.round((rawTotal - targetCutoff) * 10) / 10;

  // Comparison with Social Studies (only for Doshisha)
  const comparison = useMemo(() => {
    return getDoshishaMathVsSocialComparison(rawMathScore);
  }, [rawMathScore]);

  // Reverse Goal Needed Calculation
  const [goalAdjustedMathScore, setGoalAdjustedMathScore] = useState<number>(
    selectedUnivId === 'doshisha' ? 105 : 70
  );
  const neededRaw = useMemo(() => {
    return calculateRawScoreNeeded(goalAdjustedMathScore, config.maxScore, activeMedian);
  }, [goalAdjustedMathScore, config.maxScore, activeMedian]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-3 space-y-3" id="math-score-adjustment-card">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-1.5">
          <Calculator className="w-4 h-4 text-purple-600" />
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-slate-800">
                私大 文系数学「得点調整（中央値補正方式）」完全シミュレーター
              </h2>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                文系数学特化
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500">
              大学発表の合格最低点は「調整後得点」です。中央値が低めになる文系数学は素点から大幅に上方補正されます。
            </p>
          </div>
        </div>

        {/* University Switcher */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleUnivChange('doshisha')}
            className={`px-2.5 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
              selectedUnivId === 'doshisha'
                ? 'bg-purple-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            同志社大学 (150点満点)
          </button>
          <button
            type="button"
            onClick={() => handleUnivChange('kansai')}
            className={`px-2.5 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
              selectedUnivId === 'kansai'
                ? 'bg-blue-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            関西大学 (100点満点)
          </button>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Column: Sliders & Difficulty Presets */}
        <div className="lg:col-span-6 space-y-2.5">
          {/* Math Raw Score Input Box */}
          <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-purple-950 flex items-center gap-1">
                <span>📐 文系数学の自己採点・素点 (演習得点)</span>
              </label>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-purple-900 font-mono">
                  {rawMathScore}
                </span>
                <span className="text-xs text-purple-600 font-mono">
                  / {config.maxScore}点
                </span>
                <span className="text-[11px] text-purple-700 font-bold ml-1">
                  ({((rawMathScore / config.maxScore) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max={config.maxScore}
              step="1"
              value={rawMathScore}
              onChange={(e) => setRawMathScore(Number(e.target.value))}
              className="w-full accent-purple-700 cursor-pointer h-2 bg-purple-200 rounded-lg"
            />

            <div className="flex justify-between items-center text-[10px] text-purple-600 font-mono">
              <span>0点</span>
              <span>4割 ({Math.round(config.maxScore * 0.4)}点)</span>
              <span>6割 ({Math.round(config.maxScore * 0.6)}点)</span>
              <span>8割 ({Math.round(config.maxScore * 0.8)}点)</span>
              <span>満点 ({config.maxScore}点)</span>
            </div>
          </div>

          {/* Difficulty Presets */}
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-indigo-600" />
                数学の難易度・中央値（{activeMedian}点 / {config.maxScore}点）
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                中央値は50%（{config.targetMedianScore}点）に換算
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {config.defaultPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setPresetId(preset.id)}
                  className={`p-1.5 rounded border text-center transition-all cursor-pointer ${
                    presetId === preset.id
                      ? 'bg-purple-700 text-white border-purple-700 shadow-2xs font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <div className="text-[10.5px]">{preset.label}</div>
                  <div className={`text-[10px] font-mono ${presetId === preset.id ? 'text-purple-100' : 'text-slate-500'}`}>
                    M: {preset.median}点
                  </div>
                </button>
              ))}

              <button
                type="button"
                onClick={() => setPresetId('custom')}
                className={`p-1.5 rounded border text-center transition-all cursor-pointer ${
                  presetId === 'custom'
                    ? 'bg-purple-700 text-white border-purple-700 shadow-2xs font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 font-medium'
                }`}
              >
                <div className="text-[10.5px]">自由設定</div>
                <div className={`text-[10px] font-mono ${presetId === 'custom' ? 'text-purple-100' : 'text-slate-500'}`}>
                  M: {customMedian}点
                </div>
              </button>
            </div>

            {presetId === 'custom' && (
              <div className="pt-1.5 flex items-center gap-2">
                <span className="text-[10px] text-slate-500 shrink-0">任意中央値:</span>
                <input
                  type="range"
                  min="20"
                  max={Math.round(config.maxScore * 0.75)}
                  value={customMedian}
                  onChange={(e) => setCustomMedian(Number(e.target.value))}
                  className="w-full accent-purple-700 h-1.5 bg-slate-200 rounded"
                />
                <span className="text-xs font-mono font-bold text-purple-800 w-10 text-right">
                  {customMedian}点
                </span>
              </div>
            )}

            <p className="text-[10px] text-slate-600 leading-snug">
              {presetId !== 'custom'
                ? config.defaultPresets.find((p) => p.id === presetId)?.description
                : '中央値Mを任意にスライド設定して試算できます。'}
            </p>
          </div>
        </div>

        {/* Right Column: Live Result Card */}
        <div className="lg:col-span-6 space-y-2.5">
          {/* Result Card */}
          <div className="p-3 bg-gradient-to-br from-purple-900 to-indigo-900 text-white rounded-lg shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-purple-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                中央値補正（得点調整後）予想結果
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-800/80 text-purple-200 border border-purple-700 font-mono">
                満点 {config.maxScore}点
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-purple-800/40 border border-purple-700/50 rounded-md p-2">
                <span className="text-[10px] text-purple-300 block">自己採点・素点</span>
                <div className="text-xl font-mono font-bold text-white">
                  {adjustmentResult.rawScore}
                  <span className="text-xs text-purple-300 font-normal"> / {config.maxScore}点</span>
                </div>
                <span className="text-[10px] text-purple-300 font-mono">
                  得点率 {((adjustmentResult.rawScore / config.maxScore) * 100).toFixed(1)}%
                </span>
              </div>

              <div className="bg-purple-800/80 border border-purple-400/50 rounded-md p-2 relative overflow-hidden">
                <span className="text-[10px] text-amber-300 font-bold block flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-300" />
                  得点調整後（大学判定用）
                </span>
                <div className="text-2xl font-mono font-black text-amber-200">
                  {adjustmentResult.adjustedScore}
                  <span className="text-xs text-purple-200 font-normal"> / {config.maxScore}点</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                  <span className="text-purple-200 font-bold">
                    得点率 {adjustmentResult.percentage}%
                  </span>
                  <span
                    className={`font-black px-1 rounded ${
                      adjustmentResult.diff >= 0
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-rose-500/90 text-white'
                    }`}
                  >
                    {adjustmentResult.diff >= 0 ? `+${adjustmentResult.diff}` : adjustmentResult.diff}点
                  </span>
                </div>
              </div>
            </div>

            {/* Formula explanation box */}
            <div className="p-2 bg-purple-950/70 border border-purple-800/80 rounded text-[10.5px] text-purple-200 space-y-1">
              <div className="font-bold text-amber-300 flex items-center justify-between">
                <span>算定式 ({selectedUnivId === 'doshisha' ? '同志社大学公式 中央値補正方式' : '関西大学公式 中央値方式'}):</span>
                <span className="text-[9.5px] text-purple-300">
                  {rawMathScore >= activeMedian ? '中央値以上 (上方変換)' : '中央値未満 (下方変換)'}
                </span>
              </div>
              <div className="font-mono text-[11px] text-white">
                {adjustmentResult.formulaDescription}
              </div>
              <p className="text-[9.5px] text-purple-300 leading-tight">
                {rawMathScore >= activeMedian
                  ? `中央値(${activeMedian}点)を超えているため、素点より +${adjustmentResult.diff}点 押し上げられました！`
                  : `中央値(${activeMedian}点)未満のため、${config.targetMedianScore}点基準で下方補正されます。`}
              </p>
            </div>
          </div>

          {/* Goal Reverse Calculator */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                逆算: 調整後で「{goalAdjustedMathScore}点」取るための必要素点
              </span>
              <span className="text-[10.5px] font-mono font-bold text-indigo-700">
                素点 {neededRaw}点 ({((neededRaw / config.maxScore) * 100).toFixed(1)}%) で達成！
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={config.targetMedianScore}
                max={config.maxScore}
                step="1"
                value={goalAdjustedMathScore}
                onChange={(e) => setGoalAdjustedMathScore(Number(e.target.value))}
                className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded"
              />
              <span className="text-xs font-mono font-bold text-slate-700 w-12 text-right">
                {goalAdjustedMathScore}点
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              ※調整後7割（105点）を目指す場合、素点約62%（{neededRaw}点）で到達可能です。
            </p>
          </div>
        </div>
      </div>

      {/* 3-Subject Overall Examination Simulation (500 pts for Doshisha / 450 pts for Kansai) */}
      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-900">
              {config.universityName} 総合合否判定シミュレーション（{totalMax}点満点）
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            合格最低点基準: {targetCutoff}点 / {totalMax}点 ({((targetCutoff / totalMax) * 100).toFixed(1)}%)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* English */}
          <div className="bg-white p-2 rounded border border-slate-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10.5px] font-bold text-slate-700">英語</span>
              <span className="text-[10px] text-slate-500 font-mono">/ 200点</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="200"
                value={englishScore}
                onChange={(e) => setEnglishScore(Number(e.target.value))}
                className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded"
              />
              <span className="text-xs font-mono font-bold text-slate-900 w-8 text-right">
                {englishScore}
              </span>
            </div>
            <span className="text-[9.5px] text-slate-400 font-mono">
              得点率 {((englishScore / 200) * 100).toFixed(1)}%
            </span>
          </div>

          {/* Japanese */}
          <div className="bg-white p-2 rounded border border-slate-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10.5px] font-bold text-slate-700">国語</span>
              <span className="text-[10px] text-slate-500 font-mono">/ 150点</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="150"
                value={japaneseScore}
                onChange={(e) => setJapaneseScore(Number(e.target.value))}
                className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded"
              />
              <span className="text-xs font-mono font-bold text-slate-900 w-8 text-right">
                {japaneseScore}
              </span>
            </div>
            <span className="text-[9.5px] text-slate-400 font-mono">
              得点率 {((japaneseScore / 150) * 100).toFixed(1)}%
            </span>
          </div>

          {/* Math (Linked from top) */}
          <div className="bg-purple-50/80 p-2 rounded border border-purple-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10.5px] font-bold text-purple-900">文系数学 (調整反映中)</span>
              <span className="text-[10px] text-purple-600 font-mono">/ {config.maxScore}点</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] text-slate-600 font-mono">
                素点 {rawMathScore}点 →
              </span>
              <span className="text-sm font-mono font-black text-purple-900">
                調整後 {adjustmentResult.adjustedScore}点
              </span>
            </div>
            <span className="text-[9.5px] text-purple-700 font-bold font-mono">
              ({adjustmentResult.diff >= 0 ? `+${adjustmentResult.diff}` : adjustmentResult.diff}点補正)
            </span>
          </div>
        </div>

        {/* Total Comparison Box */}
        <div className="p-2.5 bg-white border border-slate-200 rounded-md flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-600">素点合算:</span>
              <span className="text-xs font-mono font-bold text-slate-700">
                {rawTotal} / {totalMax}点 ({((rawTotal / totalMax) * 100).toFixed(1)}%)
              </span>
              <span className="text-[10.5px] text-slate-500 font-mono">
                [{rawDiffFromCutoff >= 0 ? `+${rawDiffFromCutoff}` : rawDiffFromCutoff}点]
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-900">得点調整後 総合得点:</span>
              <span className="text-base font-mono font-black text-indigo-900">
                {adjustedTotal} / {totalMax}点 ({((adjustedTotal / totalMax) * 100).toFixed(1)}%)
              </span>
              <span
                className={`text-xs font-mono font-bold px-1.5 py-0.2 rounded ${
                  diffFromCutoff >= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {diffFromCutoff >= 0 ? `+${diffFromCutoff}` : diffFromCutoff}点
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {diffFromCutoff >= 0 ? (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                合格ライン突破！（調整後得点で判定合格）
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                合格ラインまで あと {Math.abs(diffFromCutoff)}点
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Strategic Insights: Math vs Social Studies (Doshisha Only) */}
      {selectedUnivId === 'doshisha' && (
        <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-lg text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-purple-950">
            <BookOpen className="w-4 h-4 text-purple-700" />
            <span>なぜ「文系数学」受験者は同志社大学で極めて有利なのか？（地歴との比較）</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="bg-white p-2 rounded border border-purple-200">
              <span className="font-bold text-purple-900 block mb-0.5">
                📐 文系数学受験者（あなた）
              </span>
              <p className="text-slate-600 leading-snug">
                平均・中央値が低く（例年約50〜55点）、素点<strong>90点（6割）</strong>取ると調整後で約
                <strong className="text-purple-700 font-mono"> 103点（+13点の上方ボーナス）</strong>
                になります。
              </p>
            </div>

            <div className="bg-white p-2 rounded border border-purple-200">
              <span className="font-bold text-slate-800 block mb-0.5">
                📜 地歴（日本史・世界史）受験者
              </span>
              <p className="text-slate-600 leading-snug">
                受験生全体の完成度が高く中央値が約90〜95点と高いため、素点<strong>90点</strong>でも調整後で約
                <strong className="text-rose-600 font-mono"> 73点（-17点の大幅下方減点）</strong>
                されます。
              </p>
            </div>
          </div>

          <p className="text-[10.5px] text-purple-900 leading-relaxed font-medium">
            💡 <strong>戦略的結論:</strong> 同じ「素点90点」でも、中央値補正によって文系数学は地歴に対して
            <span className="text-purple-800 font-bold underline decoration-purple-400 decoration-2">
              約30点もの圧倒的アドバンテージ
            </span>
            がつきます。文系数学に特化して過去問演習を重ねる方針は、同志社商学部合格において極めて合理的な最強の選択です。
          </p>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { PastPaperRecord, UniversityConfig } from '../types';
import { Lightbulb, AlertTriangle, Sparkles, CheckCircle2, Calculator } from 'lucide-react';

interface Props {
  universities: UniversityConfig[];
  records: PastPaperRecord[];
  selectedUnivId: string;
  onOpenCalculator?: () => void;
}

export const WeaknessAdviceSidebar: React.FC<Props> = ({
  universities,
  records,
  selectedUnivId,
  onOpenCalculator,
}) => {
  const currentUniv = universities.find((u) => u.id === selectedUnivId) || universities[0];
  const univRecords = records.filter((r) => r.universityId === currentUniv.id);
  const latestRecord = univRecords[0];

  // Specific high-value strategic exam insights for the 3 target faculties
  const strategicAdvice: Record<string, { title: string; desc: string; type: 'indigo' | 'amber' | 'emerald' }[]> = {
    kobe: [
      {
        title: '神戸大経営：英語・自由英作文の時間配分',
        desc: '大問4の英作文(自由英作文)に時間をかけ過ぎると長文読解で崩れます。論点整理5分、執筆15分でまとめる型を固定しましょう。',
        type: 'amber',
      },
      {
        title: '神戸大経営：文系数学の完答戦略',
        desc: '標準的な大問を確実に1問完答し、残り2問で部分点を稼ぐのが合格ライン(約60%)の鉄則。微積・確率は典型問題を取りこぼさないこと。',
        type: 'indigo',
      },
    ],
    doshisha: [
      {
        title: '同志社商：国語・古文記述と得点調整',
        desc: '選択科目は中央値補正等の得点調整で素点から約15〜20点引かれることを前提に。国語は現代文で確実に稼ぎ、古文の主語特定・敬語を徹底強化。',
        type: 'indigo',
      },
      {
        title: '同志社商：英語長文の空所補充・言い換え',
        desc: '配点200点の英語が最重要。長文2題は語彙レベルが高いため、前後の論理展開(しかし、したがって)を見失わずに選択肢を消去する訓練を。',
        type: 'emerald',
      },
    ],
    kansai: [
      {
        title: '関大商：英語・パラグラフリーディング',
        desc: 'A日程(3教科型)は素点から中央値補正が入るため、英語200点で8割(160点)を狙うのが最も確実。空所補充と段落要旨把握を速読で解き切る。',
        type: 'emerald',
      },
      {
        title: '関大商：地歴・数学の標準問題ミス防止',
        desc: '難問は少なく標準問題が中心のため、ケアレスミス1問が致命傷になります。過去問演習後は「なぜ間違えたか」の徹底言語化を。',
        type: 'amber',
      },
    ],
  };

  const currentAdviceList = strategicAdvice[currentUniv.id] || strategicAdvice.kobe;

  return (
    <div className="bg-white rounded-lg p-3 shadow-xs border border-slate-200 flex-1 flex flex-col" id="weakness-advice-card">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          弱点分析 &amp; 重点攻略
        </h2>
        <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">
          {currentUniv.shortName}
        </span>
      </div>

      {latestRecord?.mistakeAnalysis && (
        <div className="bg-rose-50 border-l-2 border-rose-500 p-2 text-xs mb-2 rounded-r">
          <p className="font-bold text-rose-950 text-[11px] flex items-center gap-1 mb-0.5">
            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
            直近の自己分析メモ ({latestRecord.year}年 #{latestRecord.attemptNumber})
          </p>
          <p className="text-rose-900 text-[10px] leading-tight line-clamp-3">
            {latestRecord.mistakeAnalysis}
          </p>
          {latestRecord.nextActionPlan && (
            <p className="text-emerald-800 font-medium text-[10px] mt-1 pt-1 border-t border-rose-200/60 leading-tight">
              ↳ 次回対策: {latestRecord.nextActionPlan}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2 overflow-y-auto pr-0.5 max-h-56">
        {currentAdviceList.map((adv, idx) => {
          const isAmber = adv.type === 'amber';
          const isEmerald = adv.type === 'emerald';
          return (
            <div
              key={idx}
              className={`p-2 text-xs rounded-r border-l-2 ${
                isAmber
                  ? 'bg-amber-50 border-amber-500 text-amber-950'
                  : isEmerald
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                  : 'bg-indigo-50 border-indigo-500 text-indigo-950'
              }`}
            >
              <p className="font-bold text-[11px] mb-1 leading-tight">{adv.title}</p>
              <p
                className={`text-[10px] leading-relaxed ${
                  isAmber ? 'text-amber-800' : isEmerald ? 'text-emerald-800' : 'text-indigo-800'
                }`}
              >
                {adv.desc}
              </p>
            </div>
          );
        })}
      </div>

      {onOpenCalculator && (
        <button
          type="button"
          onClick={onOpenCalculator}
          className="mt-2.5 w-full py-1.5 px-2 bg-gradient-to-r from-indigo-50 to-slate-50 hover:from-indigo-100 hover:to-slate-100 border border-indigo-200 text-indigo-900 rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
        >
          <Calculator className="w-3.5 h-3.5 text-indigo-600" />
          二次得点から共テ必要点を逆算
        </button>
      )}
    </div>
  );
};

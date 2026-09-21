export interface SubjectScore {
  id: string;
  name: string;
  score: number;
  maxScore: number;
}

export type ExamRegime = 'new_curriculum' | 'old_common_test' | 'center_test';

export interface YearlyExamScheme {
  id: string;
  regime: ExamRegime;
  regimeLabel: string; // e.g. "新課程（2025〜）", "旧課程 共テ（2021〜2024）", "センター試験（〜2020）"
  yearRangeLabel: string; // "2025年〜現在", "2021〜2024年", "2020年以前"
  applicableYears: number[];
  totalMaxScore: number;
  commonMaxScore: number;
  commonRawMaxScore: number;
  secondaryMaxScore: number;
  secondarySubjects: { name: string; maxScore: number; defaultScore?: number }[];
  commonSubjects: {
    name: string;
    rawMax: number;
    weightMax: number;
    conversionDesc?: string;
  }[];
  individualPriorityCutoffScore?: number; // 神戸大個別優先目安
  notes: string;
}

export interface UniversityConfig {
  id: string;
  name: string;
  faculty: string;
  shortName: string;
  badgeColor: string;
  totalMaxScore: number;
  // Passing score benchmarks by year (total points and percentage)
  passingScores: {
    year: number;
    score: number;
    percentage: number;
    examType: string;
    totalMaxScore?: number; // その年度の満点（例: 神戸大2025=775点, 2024以前=725点）
    regime?: ExamRegime;
    note?: string;
  }[];
  defaultSubjects: {
    name: string;
    maxScore: number;
  }[];
  yearlySchemes?: YearlyExamScheme[];
  recommendations: string[];
}

export interface PastPaperRecord {
  id: string;
  universityId: string;
  year: number;
  examRegime?: ExamRegime;
  attemptNumber: number;
  date: string; // YYYY-MM-DD
  examType: string; // e.g. 全学部日程, 一般入試, 前期日程
  subjectScores: {
    subjectName: string;
    score: number;
    maxScore: number;
    rawScore?: number; // 素点（得点調整前）
    adjustedScore?: number; // 調整後得点
    adjustmentInfo?: string; // 調整メモ (例: "中央値55点換算 +13.0点")
  }[];
  totalScore: number;
  totalMaxScore: number;
  passingBenchmark: number; // The target passing minimum score for comparison
  overallPassingBenchmark?: number; // 総合合格最低点（共テ＋二次計。例: 神戸大2025年なら528.1点）
  individualPriorityBenchmark?: number; // 個別優先枠ボーダー（二次単独選考。例: 神戸大2025年なら226.6点）
  isSecondaryOnly?: boolean; // 二次試験科目のみ演習した記録かどうかのフラグ
  mathScoreAdjustmentApplied?: boolean; // 文系数学の得点調整（中央値補正）を適用したか
  mathRawScore?: number; // 文系数学の素点
  mathAdjustedScore?: number; // 文系数学の調整後得点
  mathMedianUsed?: number; // 適用した中央値
  isPassed: boolean;
  scoreDiff: number; // totalScore - passingBenchmark
  timeSpentMinutes?: number;
  mistakeAnalysis?: string; // 間違えた箇所の原因や弱点
  nextActionPlan?: string; // 次回への改善アクション
  syncedToSheets?: boolean;
}

export interface SheetsConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheetTitle: string;
  lastSyncedAt?: string;
}

// 模試ナビ用型定義（全統模試・駿台模試・東進模試等の成績管理）
export interface MockExamSubjectScore {
  subjectName: string;
  score: number;
  maxScore: number;
  deviation?: number; // 偏差値
}

export type ExamJudgementGrade = 'A' | 'B' | 'C' | 'D' | 'E';

export interface MockExamJudgement {
  universityId: string; // 'kobe' | 'doshisha' | 'kansai' | 'other'
  targetName: string; // 例: 神戸大学 経営学部
  judgement: ExamJudgementGrade;
}

export interface MockExamRecord {
  id: string;
  title: string; // 例: 第1回 全統共通テスト模試, 第2回 全統記述模試, 神戸大入試オープン
  examCategory: 'common_test' | 'written' | 'university_open'; // 共通テスト型 | 記述型 | 大学別オープン
  provider: string; // 河合塾(全統), 駿台, 東進, ベネッセ
  year: number; // 2026, 2025 etc.
  date: string; // YYYY-MM-DD
  totalScore: number;
  totalMaxScore: number;
  overallDeviation?: number; // 総合偏差値
  subjectScores: MockExamSubjectScore[];
  judgements: MockExamJudgement[];
  reflection?: string; // 振り返り・反省点
  nextActionPlan?: string; // 次回模試への改善策
}

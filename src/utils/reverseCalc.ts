import { PastPaperRecord, UniversityConfig, ExamRegime, YearlyExamScheme } from '../types';
import { getYearlyExamScheme, getExamRegime } from '../data/universities';

export interface RecordReverseAnalysis {
  record: PastPaperRecord;
  universityName: string;
  universityShortName: string;
  facultyName: string;
  year: number;
  regime: ExamRegime;
  regimeLabel: string;
  scheme: YearlyExamScheme | null;

  // Secondary breakdown
  secondaryScores: { name: string; score: number; maxScore: number; pct: number }[];
  secondaryTotal: number;
  secondaryMax: number;
  secondaryPct: number;

  // Target Benchmark
  passingBenchmark: number;
  totalMaxScore: number;

  // Needed Common Test
  commonMaxScore: number;
  commonRawMaxScore: number;
  neededCommonWeighted: number;
  neededCommonPct: number;
  neededCommonRaw: number;

  // Individual Priority (Kobe)
  isKobe: boolean;
  individualPriorityCutoff: number;
  clearsIndividualPriority: boolean;
  individualDiff: number;

  // Comparison if actual common score is recorded
  hasActualCommon: boolean;
  actualCommonScore: number | null;
  actualCommonMax: number | null;
  actualCommonDiff: number | null;
  isActualCommonEnough: boolean | null;

  // Status & Evaluation
  status:
    | 'secondary_cleared_all'
    | 'individual_priority'
    | 'actual_cleared'
    | 'feasible'
    | 'standard'
    | 'challenging'
    | 'impossible';
  statusBadge: string;
  statusColor: string;
  statusMessage: string;

  // Recommended breakdown for common test
  recommendedCommonSubjects: {
    name: string;
    rawMax: number;
    weightMax: number;
    recommendedWeighted: number;
    recommendedRaw: number;
    targetPct: number;
  }[];
}

export function analyzeRecordReverseCalculation(
  record: PastPaperRecord,
  universities: UniversityConfig[]
): RecordReverseAnalysis {
  const univ = universities.find((u) => u.id === record.universityId) || universities[0];
  const scheme = getYearlyExamScheme(record.universityId, record.year);
  const regime: ExamRegime = record.examRegime || scheme?.regime || getExamRegime(record.year);

  const regimeLabel =
    regime === 'new_curriculum'
      ? '新課程（2025〜）'
      : regime === 'old_common_test'
      ? '旧課程 共通テスト（2021〜2024）'
      : 'センター試験時代（〜2020）';

  // 1. Extract secondary scores
  const secondaryScores: { name: string; score: number; maxScore: number; pct: number }[] = [];
  let secondaryTotal = 0;

  record.subjectScores.forEach((s) => {
    const isCommonOrCenter =
      s.subjectName.includes('共通テスト') ||
      s.subjectName.includes('センター') ||
      s.subjectName.includes('共テ');
    if (!isCommonOrCenter) {
      const cleanName = s.subjectName.replace(/^二次\s*/, '').trim();
      const pct = s.maxScore > 0 ? Math.round((s.score / s.maxScore) * 1000) / 10 : 0;
      secondaryScores.push({
        name: cleanName,
        score: s.score,
        maxScore: s.maxScore,
        pct,
      });
      secondaryTotal += s.score;
    }
  });

  // If the record was a secondary-only examination (e.g. Kobe 375 or 350 max, or isSecondaryOnly flag is true),
  // the secondary exam score is by definition the record's totalScore (e.g. 190 points).
  const isSecondaryOnlyExam =
    record.isSecondaryOnly ||
    record.totalMaxScore <= 400 ||
    (record.universityId === 'kobe' && record.totalMaxScore <= 400);

  if (isSecondaryOnlyExam && record.totalScore > 0) {
    if (secondaryTotal !== record.totalScore) {
      // Re-align individual secondaryScores so they sum to record.totalScore (e.g. 190 instead of 144)
      if (secondaryScores.length > 0 && secondaryTotal > 0) {
        const ratio = record.totalScore / secondaryTotal;
        let runningSum = 0;
        secondaryScores.forEach((s, idx) => {
          if (idx === secondaryScores.length - 1) {
            s.score = record.totalScore - runningSum;
          } else {
            s.score = Math.round(s.score * ratio);
            runningSum += s.score;
          }
          s.pct = s.maxScore > 0 ? Math.round((s.score / s.maxScore) * 1000) / 10 : 0;
        });
      }
      secondaryTotal = record.totalScore;
    }
  }

  const secondaryMax = scheme
    ? scheme.secondaryMaxScore
    : record.year >= 2025
    ? 375
    : 350;
  const secondaryPct =
    secondaryMax > 0 ? Math.round((secondaryTotal / secondaryMax) * 1000) / 10 : 0;

  // 2. Passing Benchmark (Always use Overall Total Passing Benchmark, NOT individual priority cutoff)
  const matchedBenchmarkRecord =
    univ.passingScores.find((p) => p.year === record.year) || univ.passingScores[0];

  // If record.passingBenchmark was saved as secondary-only cutoff (e.g. around 220-234 points for Kobe, or totalMaxScore <= 400),
  // fallback to the true overall passing score (e.g. 528.1 / 775 or 466.6 / 725)
  const isRecordBenchmarkSecondaryOnly =
    (record.totalMaxScore <= 400 && record.passingBenchmark < 300) ||
    (record.universityId === 'kobe' && record.passingBenchmark < 350);

  const passingBenchmark =
    record.overallPassingBenchmark ||
    (!isRecordBenchmarkSecondaryOnly && record.passingBenchmark >= 350
      ? record.passingBenchmark
      : matchedBenchmarkRecord.score);

  const totalMaxScore =
    matchedBenchmarkRecord.totalMaxScore ||
    scheme?.totalMaxScore ||
    (record.year >= 2025 ? 775 : 725);

  // 3. Needed Common Test (Overall passing score - Secondary total score)
  const commonMaxScore = scheme
    ? scheme.commonMaxScore
    : record.year >= 2025
    ? 400
    : 375;
  const commonRawMaxScore = scheme
    ? scheme.commonRawMaxScore
    : record.year >= 2025
    ? 1000
    : 900;

  const neededCommonWeighted = Math.max(
    0,
    Math.round((passingBenchmark - secondaryTotal) * 10) / 10
  );
  const neededCommonPct =
    commonMaxScore > 0 ? Math.round((neededCommonWeighted / commonMaxScore) * 1000) / 10 : 0;
  const neededCommonRaw = Math.round((neededCommonPct / 100) * commonRawMaxScore);

  // 4. Kobe Individual Priority (1st stage selection based solely on secondary score)
  const isKobe = record.universityId === 'kobe';
  const KOBE_INDIVIDUAL_CUTOFFS: { [year: number]: number } = {
    2026: 228.0,
    2025: 226.6,
    2024: 233.9,
    2023: 218.4,
    2022: 213.7,
    2021: 190.2,
    2020: 223.7,
    2019: 220.0,
    2018: 225.0,
  };
  const individualPriorityCutoff =
    record.individualPriorityBenchmark ||
    (isRecordBenchmarkSecondaryOnly ? record.passingBenchmark : undefined) ||
    KOBE_INDIVIDUAL_CUTOFFS[record.year] ||
    scheme?.individualPriorityCutoffScore ||
    (record.year >= 2025 ? 226.6 : 220.0);

  const clearsIndividualPriority = isKobe && secondaryTotal >= individualPriorityCutoff;
  const individualDiff = Math.round((secondaryTotal - individualPriorityCutoff) * 10) / 10;

  // 5. Actual common score (if entered in record)
  const actualCommonItem = record.subjectScores.find(
    (s) =>
      s.subjectName.includes('共通テスト') ||
      s.subjectName.includes('センター') ||
      s.subjectName.includes('共テ')
  );
  const hasActualCommon = Boolean(actualCommonItem && actualCommonItem.score > 0);
  const actualCommonScore = actualCommonItem ? actualCommonItem.score : null;
  const actualCommonMax = actualCommonItem ? actualCommonItem.maxScore : commonMaxScore;
  const actualCommonDiff =
    hasActualCommon && actualCommonScore !== null
      ? Math.round((actualCommonScore - neededCommonWeighted) * 10) / 10
      : null;
  const isActualCommonEnough =
    hasActualCommon && actualCommonScore !== null ? actualCommonScore >= neededCommonWeighted : null;

  // 6. Evaluation Status
  let status: RecordReverseAnalysis['status'] = 'standard';
  let statusBadge = '標準合格圏';
  let statusColor = 'text-blue-700 bg-blue-50 border-blue-200';
  let statusMessage = '';

  const testName = regime === 'center_test' ? 'センター試験' : '共通テスト';

  if (secondaryTotal >= passingBenchmark) {
    status = 'secondary_cleared_all';
    statusBadge = '二次単独総合突破';
    statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-300';
    statusMessage = `二次試験の得点（${secondaryTotal}点）だけで共テ＋二次の総合合格最低点（${passingBenchmark}点）に到達しています！${testName}は失点を抑えるだけで合格圏を確実なものにできます。`;
  } else if (clearsIndividualPriority) {
    status = 'individual_priority';
    statusBadge = '個別優先枠到達（共テ不問）';
    statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-300';
    statusMessage = `二次得点${secondaryTotal}点が神戸大経営の【個別学力検査優先枠】ライン（約${individualPriorityCutoff}点 / ${secondaryMax}点）を突破！本番でも上位約30%枠に入り、共通テストの得点に関わらず合格が狙えるハイレベルな仕上がりです。なお、第3段階（総合点選抜・最低点${passingBenchmark}点）ベースでは共テ${neededCommonPct}%（${neededCommonWeighted}点 / 素点約${neededCommonRaw}点）が目安です。`;
  } else if (hasActualCommon && isActualCommonEnough) {
    status = 'actual_cleared';
    statusBadge = '総合合格点到達';
    statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-300';
    statusMessage = `演習時の${testName}得点（${actualCommonScore}点）は総合合格の必要点（${neededCommonWeighted}点）を +${actualCommonDiff}点 上回っており、見事に総合最低点をクリアしています！`;
  } else if (neededCommonWeighted > commonMaxScore) {
    status = 'impossible';
    statusBadge = '二次得点アップ必須';
    statusColor = 'text-rose-700 bg-rose-50 border-rose-300';
    const deficit = Math.round((neededCommonWeighted - commonMaxScore) * 10) / 10;
    statusMessage = `総合合格最低点（${passingBenchmark}点）に対し、${testName}を満点（${commonMaxScore}点）取っても＋${deficit}点不足します。個別優先枠ライン（約${individualPriorityCutoff}点）まであと${Math.abs(individualDiff)}点。二次試験の記述精度を底上げしましょう。`;
  } else if (neededCommonPct <= 75.0) {
    status = 'feasible';
    statusBadge = '共テ有利圏';
    statusColor = 'text-teal-700 bg-teal-50 border-teal-300';
    statusMessage = `第3段階（総合選抜・最低点${passingBenchmark}点）突破には、${testName}で${neededCommonPct}%（${neededCommonWeighted}点 / 素点約${neededCommonRaw}点）取れれば合格です。二次試験のアドバンテージが非常に大きいです。`;
  } else if (neededCommonPct <= 84.0) {
    status = 'standard';
    statusBadge = '標準合格目標';
    statusColor = 'text-indigo-700 bg-indigo-50 border-indigo-200';
    statusMessage = `第3段階（総合選抜・最低点${passingBenchmark}点）突破には、${testName}で${neededCommonPct}%（${neededCommonWeighted}点 / 素点約${neededCommonRaw}点）が目標となります。個別優先ライン（約${individualPriorityCutoff}点）まであと${Math.abs(individualDiff)}点です。`;
  } else {
    status = 'challenging';
    statusBadge = '共テ高得点要求';
    statusColor = 'text-amber-700 bg-amber-50 border-amber-300';
    statusMessage = `第3段階（総合選抜・最低点${passingBenchmark}点）突破には、${testName}で${neededCommonPct}%（${neededCommonWeighted}点 / 素点約${neededCommonRaw}点）の高得点が必要です。個別優先ライン（約${individualPriorityCutoff}点）まであと${Math.abs(individualDiff)}点。二次試験の得点底上げも並行して目指しましょう。`;
  }

  // 7. Recommended Common Subjects Breakdown
  const commonSubs = scheme?.commonSubjects || [];
  const targetRatio = Math.min(1.0, neededCommonPct / 100);

  const recommendedCommonSubjects = commonSubs.map((sub) => {
    let subFactor = 1.0;
    if (sub.name.includes('地歴') || sub.name.includes('公民')) {
      subFactor = 1.06; // 稼ぎ頭
    } else if (sub.name.includes('情報')) {
      subFactor = 1.04;
    } else if (sub.name.includes('数学')) {
      subFactor = 0.96; // 難易度考慮
    }
    const finalRatio = Math.min(1.0, targetRatio * subFactor);
    const recommendedWeighted = Math.round(sub.weightMax * finalRatio * 10) / 10;
    const recommendedRaw = Math.round(sub.rawMax * finalRatio);
    return {
      name: sub.name,
      rawMax: sub.rawMax,
      weightMax: sub.weightMax,
      recommendedWeighted,
      recommendedRaw,
      targetPct: Math.round(finalRatio * 1000) / 10,
    };
  });

  return {
    record,
    universityName: univ.name,
    universityShortName: univ.shortName,
    facultyName: univ.faculty,
    year: record.year,
    regime,
    regimeLabel,
    scheme,
    secondaryScores,
    secondaryTotal,
    secondaryMax,
    secondaryPct,
    passingBenchmark,
    totalMaxScore,
    commonMaxScore,
    commonRawMaxScore,
    neededCommonWeighted,
    neededCommonPct,
    neededCommonRaw,
    isKobe,
    individualPriorityCutoff,
    clearsIndividualPriority,
    individualDiff,
    hasActualCommon,
    actualCommonScore,
    actualCommonMax,
    actualCommonDiff,
    isActualCommonEnough,
    status,
    statusBadge,
    statusColor,
    statusMessage,
    recommendedCommonSubjects,
  };
}

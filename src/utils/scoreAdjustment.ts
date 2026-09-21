/**
 * Utility functions and data for Score Adjustment (得点調整 / 中央値補正方式)
 * Specifically tailored for selective subjects (primarily 文系数学 - Humanities Mathematics)
 * at Doshisha University (同志社大学) and Kansai University (関西大学).
 */

export interface ScoreAdjustmentPreset {
  id: 'difficult' | 'standard' | 'easy' | 'custom';
  label: string;
  median: number;
  description: string;
}

export interface UniversityAdjustmentConfig {
  universityId: string;
  universityName: string;
  facultyName: string;
  subjectName: string;
  maxScore: number;
  targetMedianScore: number; // 満点の50%に補正される目標点（同志社150点なら75点、関大100点なら50点）
  defaultPresets: ScoreAdjustmentPreset[];
  notes: string;
}

export const DOSHISHA_MATH_ADJUSTMENT: UniversityAdjustmentConfig = {
  universityId: 'doshisha',
  universityName: '同志社大学',
  facultyName: '商学部（学部個別・全学部日程）',
  subjectName: '文系数学',
  maxScore: 150,
  targetMedianScore: 75,
  defaultPresets: [
    {
      id: 'difficult',
      label: '難化年',
      median: 45,
      description: '大問に難問・計算負荷が高い出題があった年。中央値が大きく下がり、素点からの跳ね上がり幅（ボーナス）が最大化します。',
    },
    {
      id: 'standard',
      label: '標準年',
      median: 55,
      description: '同志社文系数学の過去の典型的な中央値水準（約36.7%）。素点60%（90点）で約103点（+13点）に押し上げられます。',
    },
    {
      id: 'easy',
      label: '易化年',
      median: 68,
      description: '典型問題が多く全体の得点が高めの年。中央値約45.3%。素点からの加点幅はやや控えめになります。',
    },
  ],
  notes:
    '同志社大学の選択科目は「中央値補正方式」を採用しています。各科目の得点中央値（全体でちょうど真ん中の人の点数）を75点（50%）に補正し、中央値より上は[75点〜150点]に、下は[0点〜75点]に比例配分します。文系数学は地歴（日本史・世界史等の中央値85〜100点前後）に比べて中央値が低いため、中央値以上を取ると素点より大幅に加点される大きなアドバンテージがあります。',
};

export const KANSAI_MATH_ADJUSTMENT: UniversityAdjustmentConfig = {
  universityId: 'kansai',
  universityName: '関西大学',
  facultyName: '商学部（一般入試・学部個別/全学日程）',
  subjectName: '文系数学',
  maxScore: 100,
  targetMedianScore: 50,
  defaultPresets: [
    {
      id: 'difficult',
      label: '難化年',
      median: 36,
      description: '数学の難度が高く中央値が30点台後半に沈んだ年。素点50点でも60点台後半に調整されます。',
    },
    {
      id: 'standard',
      label: '標準年',
      median: 44,
      description: '関西大学文系数学の例年の中央値水準（約44%）。素点60点で約64点に補正。',
    },
    {
      id: 'easy',
      label: '易化年',
      median: 54,
      description: '平易な年の中央値水準。素点とほぼ同等〜微小調整となります。',
    },
  ],
  notes:
    '関西大学の選択科目は「中央値方式」を採用。中央値（M）を50点（100点満点の半分）とし、素点X≧Mの時は「50 + 50 × (X - M)/(100 - M)」、X<Mの時は「50 × X / M」で計算されます。',
};

/**
 * Calculates the adjusted score using the official Central Value Correction formula
 * (中央値補正方式 / 中央値方式)
 *
 * @param rawScore - The student's raw score (素点)
 * @param maxScore - Maximum possible score (e.g. 150 for Doshisha, 100 for Kansai)
 * @param median - The subject median score (中央値)
 * @returns Adjusted score, score diff, and percentage
 */
export function calculateMedianAdjustment(
  rawScore: number,
  maxScore: number = 150,
  median: number = 55
): {
  rawScore: number;
  adjustedScore: number;
  adjustedScoreExact: number;
  diff: number;
  targetMedianScore: number;
  percentage: number;
  formulaDescription: string;
} {
  const safeRaw = Math.max(0, Math.min(maxScore, rawScore));
  const safeMedian = Math.max(1, Math.min(maxScore - 1, median));
  const halfMax = maxScore / 2;

  let adjustedExact: number;
  let formulaDesc: string;

  if (safeRaw >= safeMedian) {
    // Above or equal to median:
    // adjusted = halfMax + halfMax * (raw - median) / (max - median)
    const numerator = safeRaw - safeMedian;
    const denominator = maxScore - safeMedian;
    adjustedExact = halfMax + halfMax * (numerator / denominator);
    formulaDesc = `${halfMax} + ${halfMax} × (${safeRaw} - ${safeMedian}) / (${maxScore} - ${safeMedian}) = ${adjustedExact.toFixed(1)}点`;
  } else {
    // Below median:
    // adjusted = halfMax * (raw / median)
    adjustedExact = halfMax * (safeRaw / safeMedian);
    formulaDesc = `${halfMax} × (${safeRaw} / ${safeMedian}) = ${adjustedExact.toFixed(1)}点`;
  }

  const adjustedScore = Math.round(adjustedExact * 10) / 10;
  const diff = Math.round((adjustedScore - safeRaw) * 10) / 10;
  const percentage = Math.round((adjustedScore / maxScore) * 1000) / 10;

  return {
    rawScore: safeRaw,
    adjustedScore,
    adjustedScoreExact: adjustedExact,
    diff,
    targetMedianScore: halfMax,
    percentage,
    formulaDescription: formulaDesc,
  };
}

/**
 * Given a desired adjusted score (e.g., needed after score adjustment to pass),
 * calculates what raw score (素点) is required under the specified median.
 */
export function calculateRawScoreNeeded(
  targetAdjusted: number,
  maxScore: number = 150,
  median: number = 55
): number {
  const halfMax = maxScore / 2;
  const safeTarget = Math.max(0, Math.min(maxScore, targetAdjusted));
  const safeMedian = Math.max(1, Math.min(maxScore - 1, median));

  if (safeTarget >= halfMax) {
    // target = halfMax + halfMax * (raw - median) / (max - median)
    // (target - halfMax) / halfMax = (raw - median) / (max - median)
    // raw = median + (target - halfMax) * (max - median) / halfMax
    const raw = safeMedian + ((safeTarget - halfMax) * (maxScore - safeMedian)) / halfMax;
    return Math.min(maxScore, Math.round(raw * 10) / 10);
  } else {
    // target = halfMax * (raw / median)
    // raw = (target / halfMax) * median
    const raw = (safeTarget / halfMax) * safeMedian;
    return Math.max(0, Math.round(raw * 10) / 10);
  }
}

/**
 * Returns comparison data showing the difference between Math (文系数学) and Social Studies (地歴・公民)
 * under the Doshisha Central Value Adjustment.
 */
export function getDoshishaMathVsSocialComparison(rawScore: number = 90) {
  const mathMedian = 55;
  const socialMedian = 92; // Typical social studies median is high (e.g. 90-95 points)
  const maxScore = 150;

  const mathAdj = calculateMedianAdjustment(rawScore, maxScore, mathMedian);
  const socialAdj = calculateMedianAdjustment(rawScore, maxScore, socialMedian);

  // Raw score needed in both to achieve 105 points after adjustment (70% post-adjustment)
  const targetAdj = 105;
  const mathNeeded = calculateRawScoreNeeded(targetAdj, maxScore, mathMedian);
  const socialNeeded = calculateRawScoreNeeded(targetAdj, maxScore, socialMedian);

  return {
    rawScore,
    mathAdj,
    socialAdj,
    advantageDiff: Math.round((mathAdj.adjustedScore - socialAdj.adjustedScore) * 10) / 10,
    targetAdj,
    mathNeeded,
    socialNeeded,
    mathAdvantagePoints: Math.round((socialNeeded - mathNeeded) * 10) / 10,
  };
}

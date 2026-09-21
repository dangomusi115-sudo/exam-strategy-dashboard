import { UniversityConfig, YearlyExamScheme, ExamRegime } from '../types';

export const getExamRegime = (year: number): ExamRegime => {
  if (year >= 2025) return 'new_curriculum';
  if (year >= 2021) return 'old_common_test';
  return 'center_test';
};

export const UNIVERSITIES: UniversityConfig[] = [
  {
    id: 'kobe',
    name: '神戸大学',
    faculty: '経営学部 経営学科（一般選抜・前期日程）',
    shortName: '神戸大 経営',
    badgeColor: 'bg-emerald-700 text-white',
    totalMaxScore: 775, // 新課程: 共通テスト400点 + 二次試験375点
    yearlySchemes: [
      {
        id: 'kobe_new_curriculum',
        regime: 'new_curriculum',
        regimeLabel: '新課程 共通テスト（2025〜）',
        yearRangeLabel: '2025年〜現在',
        applicableYears: [2026, 2025],
        totalMaxScore: 775,
        commonMaxScore: 400,
        commonRawMaxScore: 1000,
        secondaryMaxScore: 375,
        individualPriorityCutoffScore: 226.6, // 2025実績: 226.63/375 (60.4%)
        secondarySubjects: [
          { name: '英語', maxScore: 125, defaultScore: 78 },
          { name: '数学', maxScore: 125, defaultScore: 75 },
          { name: '国語', maxScore: 125, defaultScore: 75 },
        ],
        commonSubjects: [
          { name: '英語 (R/L 1:1圧縮)', rawMax: 200, weightMax: 75, conversionDesc: 'R100+L100=200点を75点圧縮 (×0.375)' },
          { name: '数学 (ⅠA/ⅡBC)', rawMax: 200, weightMax: 75, conversionDesc: 'ⅠA100+ⅡBC100=200点を75点圧縮 (×0.375)' },
          { name: '国語 (現古漢)', rawMax: 200, weightMax: 75, conversionDesc: '200点を75点圧縮 (×0.375)' },
          { name: '地歴・公民', rawMax: 100, weightMax: 100, conversionDesc: '100点等倍 (×1.000 最重要科目)' },
          { name: '理科基礎 (2科目計)', rawMax: 100, weightMax: 50, conversionDesc: '100点を50点圧縮 (×0.500)' },
          { name: '情報Ⅰ (新設)', rawMax: 100, weightMax: 25, conversionDesc: '100点を25点圧縮 (×0.250)' },
        ],
        notes: '新課程により情報Ⅰ(25点)が加わり共テ400点＋二次375点＝775点満点。個別優先枠(約30%)は二次226.6点以上。',
      },
      {
        id: 'kobe_old_common_test',
        regime: 'old_common_test',
        regimeLabel: '旧課程 共通テスト（2021〜2024）',
        yearRangeLabel: '2021〜2024年',
        applicableYears: [2024, 2023, 2022, 2021],
        totalMaxScore: 725,
        commonMaxScore: 375,
        commonRawMaxScore: 900,
        secondaryMaxScore: 350,
        individualPriorityCutoffScore: 218.0, // 旧課程平均目安: 約215〜233点/350 (62〜66%)
        secondarySubjects: [
          { name: '英語', maxScore: 150, defaultScore: 98 },
          { name: '数学', maxScore: 100, defaultScore: 62 },
          { name: '国語', maxScore: 100, defaultScore: 60 },
        ],
        commonSubjects: [
          { name: '英語 (R/L加重換算)', rawMax: 200, weightMax: 75, conversionDesc: 'R100+L100=200点を75点圧縮 (×0.375)' },
          { name: '数学 (ⅠA/ⅡB)', rawMax: 200, weightMax: 75, conversionDesc: 'ⅠA100+ⅡB100=200点を75点圧縮 (×0.375)' },
          { name: '国語 (現古漢)', rawMax: 200, weightMax: 75, conversionDesc: '200点を75点圧縮 (×0.375)' },
          { name: '地歴・公民', rawMax: 100, weightMax: 100, conversionDesc: '100点等倍 (×1.000)' },
          { name: '理科基礎 (2科目計)', rawMax: 100, weightMax: 50, conversionDesc: '100点を50点圧縮 (×0.500)' },
        ],
        notes: '旧課程（2021〜2024）: 共テ375点＋二次350点（英語150/数学100/国語100の英語重視傾斜配点）＝725点満点。情報なし。',
      },
      {
        id: 'kobe_center_test',
        regime: 'center_test',
        regimeLabel: 'センター試験時代（〜2020）',
        yearRangeLabel: '2020年以前',
        applicableYears: [2020, 2019, 2018, 2017, 2016, 2015],
        totalMaxScore: 725,
        commonMaxScore: 375,
        commonRawMaxScore: 900,
        secondaryMaxScore: 350,
        individualPriorityCutoffScore: 222.0, // 2020実績: 223.7/350 (63.9%)
        secondarySubjects: [
          { name: '英語', maxScore: 150, defaultScore: 100 },
          { name: '数学', maxScore: 100, defaultScore: 64 },
          { name: '国語', maxScore: 100, defaultScore: 62 },
        ],
        commonSubjects: [
          { name: 'センター英語 (筆記+リスニング)', rawMax: 250, weightMax: 75, conversionDesc: '筆記200+リス50=250点を75点換算 (×0.300)' },
          { name: 'センター数学 (ⅠA/ⅡB)', rawMax: 200, weightMax: 75, conversionDesc: '200点を75点圧縮 (×0.375)' },
          { name: 'センター国語 (現古漢)', rawMax: 200, weightMax: 75, conversionDesc: '200点を75点圧縮 (×0.375)' },
          { name: '地歴・公民', rawMax: 100, weightMax: 100, conversionDesc: '100点等倍 (×1.000)' },
          { name: '理科基礎 (2科目)', rawMax: 100, weightMax: 50, conversionDesc: '100点を50点圧縮 (×0.500)' },
        ],
        notes: 'センター試験時代（〜2020）: センター375点＋二次350点（英語150/数学100/国語100の英語重視傾斜配点）＝725点満点。センター英語は筆記(200点)+リスニング(50点)構成。',
      },
    ],
    defaultSubjects: [
      { name: '共通テスト換算', maxScore: 400 },
      { name: '二次 英語', maxScore: 125 },
      { name: '二次 数学', maxScore: 125 },
      { name: '二次 国語', maxScore: 125 },
    ],
    passingScores: [
      {
        year: 2026,
        score: 530.0,
        percentage: 68.4,
        totalMaxScore: 775,
        regime: 'new_curriculum',
        examType: '前期総合（新課程 共テ400+二次375=775点）',
        note: '2026年度目標基準 530.0/775(68.4%) | 個別優先目標 228.0/375(60.8%) | 共テ目標 325/400'
      },
      {
        year: 2025,
        score: 528.1,
        percentage: 68.1,
        totalMaxScore: 775,
        regime: 'new_curriculum',
        examType: '前期総合（新課程 共テ400+二次375=775点）',
        note: '総合最低点 528.08/775(68.1%) | 個別優先最低点 226.63/375(60.4%) | 共テ優先 845.4/1000'
      },
      {
        year: 2024,
        score: 466.6,
        percentage: 64.4,
        totalMaxScore: 725,
        regime: 'old_common_test',
        examType: '前期総合（旧課程 共テ375+二次350=725点）',
        note: '総合最低点 466.60/725(64.4%) | 個別優先最低点 233.90/350(66.8%) | 共テ優先 801.0/900'
      },
      {
        year: 2023,
        score: 477.8,
        percentage: 65.9,
        totalMaxScore: 725,
        regime: 'old_common_test',
        examType: '前期総合（旧課程 共テ375+二次350=725点）',
        note: '総合最低点 477.82/725(65.9%) | 個別優先最低点 218.40/350(62.4%) | 共テ優先 725.8/900'
      },
      {
        year: 2022,
        score: 466.6,
        percentage: 64.4,
        totalMaxScore: 725,
        regime: 'old_common_test',
        examType: '前期総合（旧課程 共テ375+二次350=725点）',
        note: '総合最低点 466.58/725(64.4%) | 個別優先最低点 213.67/350(61.0%) | 共テ優先 701.2/900'
      },
      {
        year: 2021,
        score: 458.2,
        percentage: 63.2,
        totalMaxScore: 725,
        regime: 'old_common_test',
        examType: '前期総合（旧課程 共テ375+二次350=725点）',
        note: '総合最低点 458.20/725(63.2%) | 個別優先最低点 190.20/350(54.3%)'
      },
      {
        year: 2020,
        score: 482.5,
        percentage: 66.6,
        totalMaxScore: 725,
        regime: 'center_test',
        examType: '前期総合（センター375+二次350=725点）',
        note: '最後のセンター試験 | 総合最低点 482.50/725(66.6%) | 個別優先最低点 223.70/350(63.9%)'
      },
      {
        year: 2019,
        score: 474.2,
        percentage: 65.4,
        totalMaxScore: 725,
        regime: 'center_test',
        examType: '前期総合（センター375+二次350=725点）',
        note: '総合最低点 474.20/725(65.4%) | 個別優先最低点 220.50/350(63.0%)'
      },
      {
        year: 2018,
        score: 492.0,
        percentage: 67.9,
        totalMaxScore: 725,
        regime: 'center_test',
        examType: '前期総合（センター375+二次350=725点）',
        note: '総合最低点 492.00/725(67.9%) | 個別優先最低点 231.80/350(66.2%)'
      },
    ],
    recommendations: [
      '【新旧配点の違い】2025年以降は英語150→125点、数・国が100→125点に均等化され、情報Ⅰ(25点)が新設（共テ400+二次375=775点満点）。2024年以前は二次350点（英語150/数学100/国語100の英語重視傾斜配点）＋共テ/センター375点＝725点満点でした。',
      '2024年以前の過去問演習時は、英語150点配点のため長文読解と英作文が合否の最重要キーです。',
      '共通テスト・センター換算では地歴公民が100点等倍（1倍）のため最大の得点源となります。',
      '神戸大経営は「共テ優先（上位約30%）」「個別優先（上位約30%）」「共テ・個別総合（残り）」の3段階選抜を実施。',
      '二次試験のみの過去問演習時は、満点中約60%〜66%前後が個別優先枠の合格ライン目安となります（2025年以降は375点中約226点、2024年以前は350点中約218〜233点）。'
    ]
  },
  {
    id: 'doshisha',
    name: '同志社大学',
    faculty: '商学部（一般選抜・学部個別日程 / 全学部日程）',
    shortName: '同志社 商',
    badgeColor: 'bg-purple-800 text-white',
    totalMaxScore: 500, // 英語200点 + 国語150点 + 選択(数学/地歴)150点
    yearlySchemes: [
      {
        id: 'doshisha_new_curriculum',
        regime: 'new_curriculum',
        regimeLabel: '新課程 共通テスト併用型（2025〜）',
        yearRangeLabel: '2025年〜現在',
        applicableYears: [2026, 2025],
        totalMaxScore: 500,
        commonMaxScore: 200,
        commonRawMaxScore: 400,
        secondaryMaxScore: 300,
        secondarySubjects: [
          { name: '個別 英語', maxScore: 150, defaultScore: 112 },
          { name: '個別 数学/選択', maxScore: 150, defaultScore: 106 },
        ],
        commonSubjects: [
          { name: '共テ 外国語', rawMax: 200, weightMax: 100, conversionDesc: '200点を100点に換算 (×0.5)' },
          { name: '共テ 選択高得点1科目 (情報Ⅰ可)', rawMax: 100, weightMax: 100, conversionDesc: '100点等倍' },
        ],
        notes: '個別300点(英150/選択150)＋共通テスト200点＝500点満点。新課程は情報Ⅰも利用可能。',
      },
      {
        id: 'doshisha_old_common_test',
        regime: 'old_common_test',
        regimeLabel: '旧課程 共通テスト併用型（2021〜2024）',
        yearRangeLabel: '2021〜2024年',
        applicableYears: [2024, 2023, 2022, 2021],
        totalMaxScore: 500,
        commonMaxScore: 200,
        commonRawMaxScore: 400,
        secondaryMaxScore: 300,
        secondarySubjects: [
          { name: '個別 英語', maxScore: 150, defaultScore: 110 },
          { name: '個別 数学/選択', maxScore: 150, defaultScore: 105 },
        ],
        commonSubjects: [
          { name: '共テ 外国語', rawMax: 200, weightMax: 100, conversionDesc: '200点を100点に換算 (×0.5)' },
          { name: '共テ 選択高得点1科目', rawMax: 100, weightMax: 100, conversionDesc: '100点等倍' },
        ],
        notes: '個別300点＋旧課程共テ200点＝500点満点。',
      },
      {
        id: 'doshisha_center_test',
        regime: 'center_test',
        regimeLabel: 'センター併用型（〜2020）',
        yearRangeLabel: '2020年以前',
        applicableYears: [2020, 2019, 2018],
        totalMaxScore: 500,
        commonMaxScore: 200,
        commonRawMaxScore: 400,
        secondaryMaxScore: 300,
        secondarySubjects: [
          { name: '個別 英語', maxScore: 150, defaultScore: 110 },
          { name: '個別 数学/選択', maxScore: 150, defaultScore: 105 },
        ],
        commonSubjects: [
          { name: 'センター 英語 (筆記+リス)', rawMax: 250, weightMax: 100, conversionDesc: '250点を100点に換算' },
          { name: 'センター 選択科目', rawMax: 100, weightMax: 100, conversionDesc: '100点等倍' },
        ],
        notes: 'センター試験利用/併用方式: 個別300点＋センター200点＝500点満点。',
      },
    ],
    defaultSubjects: [
      { name: '英語', maxScore: 200 },
      { name: '国語', maxScore: 150 },
      { name: '文系数学 (選択150点)', maxScore: 150 },
    ],
    passingScores: [
      { year: 2026, score: 360, percentage: 72.0, totalMaxScore: 500, regime: 'new_curriculum', examType: '学部個別日程', note: '2026年度目標基準 360/500 (72.0%) ※得点調整後' },
      { year: 2025, score: 363, percentage: 72.6, totalMaxScore: 500, regime: 'new_curriculum', examType: '学部個別日程', note: '最低点 363/500 (72.6%) ※得点調整後' },
      { year: 2024, score: 362, percentage: 72.4, totalMaxScore: 500, regime: 'old_common_test', examType: '学部個別日程', note: '最低点 362/500 (72.4%) ※得点調整後' },
      { year: 2023, score: 358, percentage: 71.6, totalMaxScore: 500, regime: 'old_common_test', examType: '学部個別日程', note: '最低点 358/500 (71.6%) ※得点調整後' },
      { year: 2022, score: 349, percentage: 69.8, totalMaxScore: 500, regime: 'old_common_test', examType: '学部個別日程', note: '最低点 349/500 (69.8%) ※得点調整後' },
      { year: 2021, score: 365, percentage: 73.0, totalMaxScore: 500, regime: 'old_common_test', examType: '学部個別日程', note: '最低点 365/500 (73.0%) ※得点調整後' },
      { year: 2020, score: 355, percentage: 71.0, totalMaxScore: 500, regime: 'center_test', examType: '学部個別日程', note: '最低点 355/500 (71.0%) ※得点調整後' },
      { year: 2019, score: 361, percentage: 72.2, totalMaxScore: 500, regime: 'center_test', examType: '学部個別日程', note: '最低点 361/500 (72.2%) ※得点調整後' },
    ],
    recommendations: [
      '【文系数学 得点調整】同志社は「中央値補正方式」を採用。文系数学の中央値は例年約50〜55点/150点と低めのため、素点6割（90点）で調整後約103点（+13点の上方ボーナス）に化けます。地歴受験者に対して圧倒的有利です。',
      '英語が200点/500点（40%）と最大配点。長文読解の語彙力・スピードと記述設問の精度が最重要です。',
      '国語は記述問題（字数指定まとめ）の演習を念入りに行い、100〜110点目標で安定させましょう。'
    ]
  },
  {
    id: 'kansai',
    name: '関西大学',
    faculty: '商学部（一般入試・学部個別日程 / 全学日程）',
    shortName: '関西大 商',
    badgeColor: 'bg-blue-800 text-white',
    totalMaxScore: 450, // 英語200点 + 国語150点 + 選択科目100点
    yearlySchemes: [
      {
        id: 'kansai_new_curriculum',
        regime: 'new_curriculum',
        regimeLabel: '新課程 共通テスト併用型（2025〜）',
        yearRangeLabel: '2025年〜現在',
        applicableYears: [2026, 2025],
        totalMaxScore: 450,
        commonMaxScore: 200,
        commonRawMaxScore: 400,
        secondaryMaxScore: 250,
        secondarySubjects: [
          { name: '個別 英語', maxScore: 150, defaultScore: 108 },
          { name: '個別 国語/数学', maxScore: 100, defaultScore: 72 },
        ],
        commonSubjects: [
          { name: '共テ 高得点科目① (情報Ⅰ可)', rawMax: 100, weightMax: 100, conversionDesc: '100点等倍' },
          { name: '共テ 高得点科目②', rawMax: 100, weightMax: 100, conversionDesc: '100点等倍' },
        ],
        notes: '個別250点(英150/国or数100)＋共テ200点＝450点満点。新課程は情報Ⅰも利用可能。',
      },
      {
        id: 'kansai_old_common_test',
        regime: 'old_common_test',
        regimeLabel: '旧課程 共通テスト併用型（2021〜2024）',
        yearRangeLabel: '2021〜2024年',
        applicableYears: [2024, 2023, 2022, 2021],
        totalMaxScore: 450,
        commonMaxScore: 200,
        commonRawMaxScore: 400,
        secondaryMaxScore: 250,
        secondarySubjects: [
          { name: '個別 英語', maxScore: 150, defaultScore: 105 },
          { name: '個別 国語/数学', maxScore: 100, defaultScore: 70 },
        ],
        commonSubjects: [
          { name: '共テ 高得点科目①', rawMax: 100, weightMax: 100, conversionDesc: '100点等倍' },
          { name: '共テ 高得点科目②', rawMax: 100, weightMax: 100, conversionDesc: '100点等倍' },
        ],
        notes: '個別250点＋旧課程共テ200点＝450点満点。',
      },
      {
        id: 'kansai_center_test',
        regime: 'center_test',
        regimeLabel: 'センター併用型（〜2020）',
        yearRangeLabel: '2020年以前',
        applicableYears: [2020, 2019, 2018],
        totalMaxScore: 450,
        commonMaxScore: 200,
        commonRawMaxScore: 400,
        secondaryMaxScore: 250,
        secondarySubjects: [
          { name: '個別 英語', maxScore: 150, defaultScore: 105 },
          { name: '個別 国語/数学', maxScore: 100, defaultScore: 70 },
        ],
        commonSubjects: [
          { name: 'センター 高得点科目①', rawMax: 100, weightMax: 100, conversionDesc: '100点換算' },
          { name: 'センター 高得点科目②', rawMax: 100, weightMax: 100, conversionDesc: '100点換算' },
        ],
        notes: '個別250点＋センター200点＝450点満点。',
      },
    ],
    defaultSubjects: [
      { name: '英語', maxScore: 200 },
      { name: '国語', maxScore: 150 },
      { name: '文系数学 (選択100点)', maxScore: 100 },
    ],
    passingScores: [
      { year: 2026, score: 305, percentage: 67.8, totalMaxScore: 450, regime: 'new_curriculum', examType: '一般学部個別（3教科型）', note: '2026年度目標基準 305/450 (67.8%) ※得点調整後' },
      { year: 2025, score: 306, percentage: 68.0, totalMaxScore: 450, regime: 'new_curriculum', examType: '一般学部個別（3教科型）', note: '最低点 306/450 (68.0%) ※得点調整後' },
      { year: 2024, score: 308, percentage: 68.4, totalMaxScore: 450, regime: 'old_common_test', examType: '一般学部個別（3教科型）', note: '最低点 308/450 (68.4%) ※得点調整後' },
      { year: 2023, score: 301, percentage: 66.9, totalMaxScore: 450, regime: 'old_common_test', examType: '一般学部個別（3教科型）', note: '最低点 301/450 (66.9%) ※得点調整後' },
      { year: 2022, score: 295, percentage: 65.6, totalMaxScore: 450, regime: 'old_common_test', examType: '一般学部個別（3教科型）', note: '最低点 295/450 (65.6%) ※得点調整後' },
      { year: 2021, score: 312, percentage: 69.3, totalMaxScore: 450, regime: 'old_common_test', examType: '一般学部個別（3教科型）', note: '最低点 312/450 (69.3%) ※得点調整後' },
      { year: 2020, score: 305, percentage: 67.8, totalMaxScore: 450, regime: 'center_test', examType: '一般学部個別（3教科型）', note: '最低点 305/450 (67.8%) ※得点調整後' },
      { year: 2019, score: 302, percentage: 67.1, totalMaxScore: 450, regime: 'center_test', examType: '一般学部個別（3教科型）', note: '最低点 302/450 (67.1%) ※得点調整後' },
    ],
    recommendations: [
      '【文系数学 中央値方式】関西大学商学部の選択科目は100点満点の中央値方式。文系数学の中央値（例年約40〜44点）を超えるとプラス補正が働きます。',
      '関西大学商学部は英語200点配点。パラグラフリーディングと段落整序・会話文が頻出です。',
      '関西大特有のマーク式設問形式に慣れ、制限時間内で解き切るペース配分を徹底しましょう。'
    ]
  }
];

// Helper to retrieve the correct exam scheme for a university and year
export const getYearlyExamScheme = (universityId: string, year: number): YearlyExamScheme | undefined => {
  const univ = UNIVERSITIES.find((u) => u.id === universityId);
  if (!univ || !univ.yearlySchemes || univ.yearlySchemes.length === 0) return undefined;

  // Exact year match
  const match = univ.yearlySchemes.find((scheme) => scheme.applicableYears.includes(year));
  if (match) return match;

  // Fallback by regime
  const regime = getExamRegime(year);
  return univ.yearlySchemes.find((scheme) => scheme.regime === regime) || univ.yearlySchemes[0];
};

// Helper to retrieve the default subjects for a given university and year
export const getYearlyDefaultSubjects = (universityId: string, year: number) => {
  const scheme = getYearlyExamScheme(universityId, year);
  if (universityId === 'kobe' && scheme) {
    return [
      { name: year >= 2025 ? '共通テスト換算 (400点満点)' : year >= 2021 ? '共通テスト換算 (375点満点)' : 'センター換算 (375点満点)', maxScore: scheme.commonMaxScore },
      ...scheme.secondarySubjects.map((s) => ({ name: `二次 ${s.name}`, maxScore: s.maxScore })),
    ];
  }
  const univ = UNIVERSITIES.find((u) => u.id === universityId);
  return univ?.defaultSubjects || [];
};

// Helper to get total max score for a specific year
export const getYearlyTotalMaxScore = (universityId: string, year: number): number => {
  const scheme = getYearlyExamScheme(universityId, year);
  if (scheme) return scheme.totalMaxScore;
  const univ = UNIVERSITIES.find((u) => u.id === universityId);
  return univ?.totalMaxScore || 500;
};

export const INITIAL_SAMPLE_RECORDS = [
  {
    id: 'rec-1',
    universityId: 'kobe',
    year: 2024,
    examRegime: 'old_common_test',
    attemptNumber: 1,
    date: '2026-08-20',
    examType: '前期日程本試',
    subjectScores: [
      { subjectName: '共通テスト換算計', score: 302, maxScore: 375 },
      { subjectName: '2次 英語', score: 102, maxScore: 150 },
      { subjectName: '2次 数学', score: 64, maxScore: 100 },
      { subjectName: '2次 国語', score: 62, maxScore: 100 },
    ],
    totalScore: 530,
    totalMaxScore: 725,
    passingBenchmark: 466.6,
    isPassed: true,
    scoreDiff: 63.4,
    timeSpentMinutes: 300,
    mistakeAnalysis: '数学の大問2の確率計算でミス。英語の大問3自由英作文で語数がやや不足。国語の現代文記述でキーセンテンスの抜き出しが甘かった。',
    nextActionPlan: '確率の漸化式復習。英語英作文のテンプレート固定（12分目標）。',
    syncedToSheets: false
  },
  {
    id: 'rec-2',
    universityId: 'doshisha',
    year: 2024,
    attemptNumber: 1,
    date: '2026-08-28',
    examType: '学部個別日程',
    subjectScores: [
      { subjectName: '英語', score: 152, maxScore: 200 },
      { subjectName: '国語', score: 104, maxScore: 150 },
      { subjectName: '選択科目 (地歴・公民/数学)', score: 110, maxScore: 150 },
    ],
    totalScore: 366,
    totalMaxScore: 500,
    passingBenchmark: 362,
    isPassed: true,
    scoreDiff: 4,
    timeSpentMinutes: 225,
    mistakeAnalysis: '英語長文の空所補充問題で落とした。世界史は戦後史の年号があやふや。国語の古文単語で取りこぼしあり。',
    nextActionPlan: '長文前後の論理マーカー意識。世界史テーマ史復習。',
    syncedToSheets: false
  },
  {
    id: 'rec-3',
    universityId: 'kansai',
    year: 2024,
    attemptNumber: 1,
    date: '2026-09-02',
    examType: '一般学部個別',
    subjectScores: [
      { subjectName: '英語', score: 148, maxScore: 200 },
      { subjectName: '国語', score: 108, maxScore: 150 },
      { subjectName: '選択科目 (地歴・公民/数学)', score: 72, maxScore: 100 },
    ],
    totalScore: 328,
    totalMaxScore: 450,
    passingBenchmark: 308,
    isPassed: true,
    scoreDiff: 20,
    timeSpentMinutes: 190,
    mistakeAnalysis: '全体的に時間配分は良好。会話文問題で1問ケアレスミス。国語の古文文法（助動詞識別）で失点。',
    nextActionPlan: '古文助動詞の活用表再確認。関西大英語の過去問をスピード優先で回す。',
    syncedToSheets: false
  }
];

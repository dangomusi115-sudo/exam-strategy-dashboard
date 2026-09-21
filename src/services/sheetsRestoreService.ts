import { PastPaperRecord, MockExamRecord, SheetsConfig, UniversityConfig } from '../types';
import { getYearlyExamScheme, getYearlyDefaultSubjects } from '../data/universities';

/**
 * Parses raw rows from Google Spreadsheet back into PastPaperRecord objects
 */
export async function fetchRecordsFromSpreadsheet(
  spreadsheetId: string,
  token: string,
  universities: UniversityConfig[]
): Promise<PastPaperRecord[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'過去問演習全記録ログ'!A2:L200`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('スプレッドシートからのデータ取得に失敗しました。');
  }

  const data = await res.json();
  const rows: any[][] = data.values || [];
  if (rows.length <= 1) {
    return [];
  }

  // Row 0 is header: ['記録日時', '大学・学部', '年度', '回数', '合計得点', '満点', '得点率(%)', '合格最低点', '合否判定', '差分(点)', '失点分析', '次回改善策']
  const parsedRecords: PastPaperRecord[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 5) continue;

    const date = String(row[0] || '').trim();
    const univName = String(row[1] || '').trim();
    const yearStr = String(row[2] || '').replace(/[^0-9]/g, '');
    const attemptStr = String(row[3] || '').replace(/[^0-9]/g, '');
    const totalScore = Number(row[4]) || 0;
    const totalMaxScore = Number(row[5]) || 350;
    const passingBenchmark = Number(row[7]) || 0;
    const isPassed = String(row[8] || '').includes('突破');
    const scoreDiff = Number(String(row[9] || '').replace('+', '')) || (totalScore - passingBenchmark);
    const mistakeAnalysis = String(row[10] || '');
    const nextActionPlan = String(row[11] || '');

    const matchedUniv = universities.find(
      (u) => u.shortName === univName || u.name.includes(univName) || u.id === univName
    ) || universities[0];

    const year = Number(yearStr) || 2024;
    const attemptNumber = Number(attemptStr) || 1;

    const isSecondaryOnly = totalMaxScore <= 400;
    const yearScheme = getYearlyExamScheme(matchedUniv.id, year);

    let defaultSubList = matchedUniv.defaultSubjects;
    if (matchedUniv.id === 'kobe' && yearScheme) {
      if (isSecondaryOnly) {
        defaultSubList = yearScheme.secondarySubjects.map((s) => ({
          name: `二次 ${s.name}`,
          maxScore: s.maxScore,
        }));
      } else {
        defaultSubList = getYearlyDefaultSubjects(matchedUniv.id, year);
      }
    }

    const subCount = defaultSubList.length || 1;
    const perSubScore = Math.round(totalScore / subCount);

    parsedRecords.push({
      id: `rec-imported-${date}-${year}-${attemptNumber}-${i}`,
      universityId: matchedUniv.id,
      year,
      attemptNumber,
      date: date || new Date().toISOString().slice(0, 10),
      examType: '一般入試',
      subjectScores: defaultSubList.map((s, sIdx) => ({
        subjectName: s.name,
        score:
          sIdx === defaultSubList.length - 1
            ? totalScore - perSubScore * (subCount - 1)
            : perSubScore,
        maxScore: s.maxScore,
      })),
      totalScore,
      totalMaxScore,
      passingBenchmark,
      isPassed,
      scoreDiff: Math.round(scoreDiff * 10) / 10,
      mistakeAnalysis,
      nextActionPlan,
      syncedToSheets: true,
      isSecondaryOnly,
    });
  }

  return parsedRecords;
}

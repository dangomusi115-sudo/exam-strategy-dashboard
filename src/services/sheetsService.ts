import { PastPaperRecord, UniversityConfig } from '../types';
import { requestGoogleAccessToken, getCachedGoogleToken, clearGoogleToken } from './googleOAuth';

export { requestGoogleAccessToken };

export async function getCurrentToken(): Promise<string | null> {
  return getCachedGoogleToken();
}

export async function clearToken() {
  clearGoogleToken();
}

/**
 * Creates a fully formatted Past Paper Tracking Google Spreadsheet
 * with separate tabs for Kobe, Doshisha, Kansai Univ, plus a Master Analysis Tab.
 */
export async function createExamTrackerSpreadsheet(
  universities: UniversityConfig[],
  records: PastPaperRecord[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const token = await requestGoogleAccessToken();

  // 1. Create spreadsheet with multiple sheets
  const createPayload = {
    properties: {
      title: `志望校過去問演習・合格分析マスターシート（神戸大・同志社・関大）_${new Date().toISOString().slice(0, 10)}`,
    },
    sheets: [
      { properties: { sheetId: 0, title: '合格判定ダッシュボード', gridProperties: { rowCount: 100, columnCount: 20, frozenRowCount: 4 } } },
      { properties: { sheetId: 1, title: '神戸大学_経営学部', gridProperties: { rowCount: 100, columnCount: 15, frozenRowCount: 4 } } },
      { properties: { sheetId: 2, title: '同志社大学_商学部', gridProperties: { rowCount: 100, columnCount: 15, frozenRowCount: 4 } } },
      { properties: { sheetId: 3, title: '関西大学_商学部', gridProperties: { rowCount: 100, columnCount: 15, frozenRowCount: 4 } } },
      { properties: { sheetId: 4, title: '過去問演習全記録ログ', gridProperties: { rowCount: 200, columnCount: 15, frozenRowCount: 2 } } },
    ],
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'スプレッドシートの作成に失敗しました。');
  }

  const spreadsheet = await createRes.json();
  const spreadsheetId = spreadsheet.spreadsheetId;
  const spreadsheetUrl = spreadsheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Prepare initial values for each sheet
  const valueRanges: any[] = [];

  // Sheet 1: Dashboard Summary & Passing Minimums Reference
  const dashboardRows: (string | number)[][] = [
    ['【志望校 過去問合格基準点 ＆ 配点一覧ダッシュボード】', '', '', '', '', '', ''],
    ['作成日時', new Date().toLocaleString('ja-JP'), '', '', '', '', ''],
    [''],
    ['■ 大学・学部', '満点配点', '最新合格最低点(2024)', '得点率', '直近5年平均最低点', '入試方式・備考'],
  ];

  universities.forEach((u) => {
    const latestPassing = u.passingScores[0];
    const avgPassing = (
      u.passingScores.reduce((acc, curr) => acc + curr.score, 0) / u.passingScores.length
    ).toFixed(1);
    dashboardRows.push([
      `${u.name} ${u.faculty}`,
      `${u.totalMaxScore}点`,
      `${latestPassing.score}点`,
      `${latestPassing.percentage}%`,
      `${avgPassing}点`,
      latestPassing.note || latestPassing.examType,
    ]);
  });

  dashboardRows.push(['']);
  dashboardRows.push(['■ 年度別合格最低点 推移マスターテーブル']);
  dashboardRows.push(['大学・学部', '年度', '入試方式', '満点', '合格最低点', '合格得点率(%)', '特記事項']);

  universities.forEach((u) => {
    u.passingScores.forEach((p) => {
      dashboardRows.push([
        u.shortName,
        `${p.year}年`,
        p.examType,
        u.totalMaxScore,
        p.score,
        `${p.percentage}%`,
        p.note || '',
      ]);
    });
  });

  valueRanges.push({
    range: `'合格判定ダッシュボード'!A1`,
    values: dashboardRows,
  });

  // Sheets for each University
  for (const u of universities) {
    const sheetTitle = u.id === 'kobe' ? '神戸大学_経営学部' : u.id === 'doshisha' ? '同志社大学_商学部' : '関西大学_商学部';
    const univRecords = records.filter((r) => r.universityId === u.id);

    const subjectHeaders = u.defaultSubjects.map((s) => `${s.name} (満点:${s.maxScore})`);
    const headerRow = [
      '演習日',
      '年度',
      '回数',
      '入試方式',
      ...subjectHeaders,
      `合計得点 / ${u.totalMaxScore}`,
      '得点率(%)',
      '合格最低点(基準)',
      '合格判定 (超/+ 不足/-)',
      '演習時間(分)',
      '反省・失点要因',
      '次回への改善計画',
    ];

    const dataRows: (string | number)[][] = [
      [`【${u.name} ${u.faculty} 過去問演習進捗シート】`],
      [`満点配点: ${u.totalMaxScore}点`, `目標得点率: 70%〜75%以上`],
      [''],
      headerRow,
    ];

    univRecords.forEach((r) => {
      const subjectVals = u.defaultSubjects.map((sub) => {
        const found = r.subjectScores.find((s) => s.subjectName.includes(sub.name) || sub.name.includes(s.subjectName));
        return found ? found.score : '';
      });
      const pct = ((r.totalScore / r.totalMaxScore) * 100).toFixed(1);
      const diffStr = r.scoreDiff >= 0 ? `+${r.scoreDiff.toFixed(1)}点 (合格)` : `${r.scoreDiff.toFixed(1)}点 (要対策)`;

      dataRows.push([
        r.date,
        `${r.year}年度`,
        `第${r.attemptNumber}回`,
        r.examType,
        ...subjectVals,
        r.totalScore,
        `${pct}%`,
        r.passingBenchmark,
        diffStr,
        r.timeSpentMinutes || '',
        r.mistakeAnalysis || '',
        r.nextActionPlan || '',
      ]);
    });

    valueRanges.push({
      range: `'${sheetTitle}'!A1`,
      values: dataRows,
    });
  }

  // All logs combined
  const logRows: (string | number)[][] = [
    ['【全志望校 過去問演習ログ】'],
    ['記録日時', '大学・学部', '年度', '回数', '合計得点', '満点', '得点率(%)', '合格最低点', '合否判定', '差分(点)', '失点分析', '次回改善策'],
  ];

  records.forEach((r) => {
    const u = universities.find((univ) => univ.id === r.universityId);
    const univName = u ? u.shortName : r.universityId;
    const pct = ((r.totalScore / r.totalMaxScore) * 100).toFixed(1);
    logRows.push([
      r.date,
      univName,
      `${r.year}年`,
      `第${r.attemptNumber}回`,
      r.totalScore,
      r.totalMaxScore,
      `${pct}%`,
      r.passingBenchmark,
      r.isPassed ? '合格ライン突破' : '合格最低点未満',
      r.scoreDiff > 0 ? `+${r.scoreDiff.toFixed(1)}` : `${r.scoreDiff.toFixed(1)}`,
      r.mistakeAnalysis || '',
      r.nextActionPlan || '',
    ]);
  });

  valueRanges.push({
    range: `'過去問演習全記録ログ'!A1`,
    values: logRows,
  });

  // 3. Batch Update Values
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: valueRanges,
      }),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}));
    console.error('Failed to populate values:', err);
  }

  // 4. Enhance formatting: Set styling, modern header colors, borders, and column widths
  const formatRequests: any[] = [
    // Dashboard Title (A1)
    {
      repeatCell: {
        range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 7 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.12, green: 0.16, blue: 0.38 }, // Deep Indigo
            textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 13 },
            horizontalAlignment: 'LEFT',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
      },
    },
    // Dashboard Table 1 Header (Row 4: index 3)
    {
      repeatCell: {
        range: { sheetId: 0, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 0, endColumnIndex: 6 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.18, green: 0.24, blue: 0.54 },
            textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 10 },
            horizontalAlignment: 'CENTER',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
      },
    },
    // University Sheets Header Formatting (Sheets 1, 2, 3: Rows 1 & 4)
    ...[1, 2, 3].flatMap((sid) => [
      {
        repeatCell: {
          range: { sheetId: sid, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 12 },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.08, green: 0.13, blue: 0.28 },
              textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 13 },
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)',
        },
      },
      {
        repeatCell: {
          range: { sheetId: sid, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 0, endColumnIndex: 12 },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.18, green: 0.24, blue: 0.54 },
              textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 10 },
              horizontalAlignment: 'CENTER',
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
        },
      },
      // Auto resize columns
      {
        autoResizeDimensions: {
          dimensions: { sheetId: sid, dimension: 'COLUMNS', startIndex: 0, endIndex: 12 },
        },
      },
    ]),
    // Master Log Header Formatting (Sheet 4: Row 2)
    {
      repeatCell: {
        range: { sheetId: 4, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 12 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.08, green: 0.13, blue: 0.28 },
            textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 13 },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat)',
      },
    },
    {
      repeatCell: {
        range: { sheetId: 4, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 12 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.18, green: 0.24, blue: 0.54 },
            textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 10 },
            horizontalAlignment: 'CENTER',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
      },
    },
    {
      autoResizeDimensions: {
        dimensions: { sheetId: 4, dimension: 'COLUMNS', startIndex: 0, endIndex: 12 },
      },
    },
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: formatRequests,
    }),
  }).catch((e) => console.warn('Could not apply advanced formatting:', e));

  return {
    spreadsheetId,
    spreadsheetUrl,
  };
}

/**
 * Appends a new record into existing Google Spreadsheet
 */
export async function appendRecordToSpreadsheet(
  spreadsheetId: string,
  record: PastPaperRecord,
  university: UniversityConfig
): Promise<boolean> {
  const token = await requestGoogleAccessToken();

  const sheetTitle =
    record.universityId === 'kobe'
      ? '神戸大学_経営学部'
      : record.universityId === 'doshisha'
      ? '同志社大学_商学部'
      : '関西大学_商学部';

  const subjectVals = university.defaultSubjects.map((sub) => {
    const found = record.subjectScores.find(
      (s) => s.subjectName.includes(sub.name) || sub.name.includes(s.subjectName)
    );
    return found ? found.score : '';
  });

  const pct = ((record.totalScore / record.totalMaxScore) * 100).toFixed(1);
  const diffStr =
    record.scoreDiff >= 0
      ? `+${record.scoreDiff.toFixed(1)}点 (合格)`
      : `${record.scoreDiff.toFixed(1)}点 (要対策)`;

  const rowValues = [
    record.date,
    `${record.year}年度`,
    `第${record.attemptNumber}回`,
    record.examType,
    ...subjectVals,
    record.totalScore,
    `${pct}%`,
    record.passingBenchmark,
    diffStr,
    record.timeSpentMinutes || '',
    record.mistakeAnalysis || '',
    record.nextActionPlan || '',
  ];

  // Append to specific university sheet
  const res1 = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`'${sheetTitle}'!A:Z`)}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );

  if (!res1.ok) {
    const err = await res1.json().catch(() => ({}));
    throw new Error(err.error?.message || `大学別シートへの書き込みに失敗しました (${res1.status})`);
  }

  // Append to master log
  const logRow = [
    record.date,
    university.shortName,
    `${record.year}年`,
    `第${record.attemptNumber}回`,
    record.totalScore,
    record.totalMaxScore,
    `${pct}%`,
    record.passingBenchmark,
    record.isPassed ? '合格ライン突破' : '合格最低点未満',
    record.scoreDiff > 0 ? `+${record.scoreDiff.toFixed(1)}` : `${record.scoreDiff.toFixed(1)}`,
    record.mistakeAnalysis || '',
    record.nextActionPlan || '',
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent("'過去問演習全記録ログ'!A:L")}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [logRow],
      }),
    }
  ).catch((e) => console.error(e));

  return res1.ok;
}

/**
 * Syncs all records into the existing Google Spreadsheet
 */
export async function syncAllRecordsToSpreadsheet(
  spreadsheetId: string,
  records: PastPaperRecord[],
  universities: UniversityConfig[]
): Promise<boolean> {
  const token = await requestGoogleAccessToken();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Read the actual workbook first. The shared Hub already exists and its tabs
  // are different from the workbook created by createExamTrackerSpreadsheet().
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!metaRes.ok) {
    const err = await metaRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `スプレッドシート情報の取得に失敗しました (${metaRes.status})`);
  }
  const meta = await metaRes.json();
  const titles = new Set<string>((meta.sheets || []).map((s: any) => s.properties?.title).filter(Boolean));

  const esc = (title: string) => title.replace(/'/g, "''");
  const rangeUrl = (range: string) => encodeURIComponent(range);

  // Shared Hub master table: keep row 1 headers and replace rows 2+ on every full sync.
  if (titles.has('過去問記録')) {
    const clearRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${rangeUrl("'過去問記録'!A2:L")}:clear`,
      { method: 'POST', headers, body: '{}' }
    );
    if (!clearRes.ok) {
      const err = await clearRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `過去問記録のクリアに失敗しました (${clearRes.status})`);
    }

    if (records.length > 0) {
      const masterRows = records.map((r) => {
        const u = universities.find((x) => x.id === r.universityId);
        const getScore = (name: string) =>
          r.subjectScores.find((x) => x.subjectName.includes(name) || name.includes(x.subjectName))?.score ?? '';
        return [
          r.id,
          u?.name || r.universityId,
          u?.faculty || '',
          r.year,
          r.date,
          getScore('英語'),
          getScore('数学'),
          getScore('国語'),
          '', // 共通テスト（過去問演習レコードに値がない場合は空欄）
          r.totalScore,
          r.mistakeAnalysis || r.nextActionPlan || '',
          new Date().toISOString(),
        ];
      });
      const writeRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${rangeUrl("'過去問記録'!A2")}?valueInputOption=USER_ENTERED`,
        { method: 'PUT', headers, body: JSON.stringify({ values: masterRows }) }
      );
      if (!writeRes.ok) {
        const err = await writeRes.json().catch(() => ({}));
        throw new Error(err.error?.message || `過去問記録への書き込みに失敗しました (${writeRes.status})`);
      }
    }
  }

  // Also refresh the per-university tabs when they exist.
  for (const u of universities) {
    const sheetTitle = u.id === 'kobe' ? '神戸大学_経営学部' : u.id === 'doshisha' ? '同志社大学_商学部' : '関西大学_商学部';
    if (!titles.has(sheetTitle)) continue;
    const univRecords = records.filter((r) => r.universityId === u.id);
    const subjectHeaders = u.defaultSubjects.map((sub) => `${sub.name} (満点:${sub.maxScore})`);
    const rows: (string | number)[][] = [
      [`【${u.name} ${u.faculty} 過去問演習進捗シート】`],
      [`満点配点: ${u.totalMaxScore}点`, 'ダッシュボードから自動同期'],
      [''],
      ['演習日', '年度', '回数', '入試方式', ...subjectHeaders, `合計得点 / ${u.totalMaxScore}`, '得点率(%)', '合格最低点(基準)', '合格判定', '演習時間(分)', '反省・失点要因', '次回への改善計画'],
    ];
    for (const r of univRecords) {
      const subjectVals = u.defaultSubjects.map((sub) => {
        const found = r.subjectScores.find((x) => x.subjectName.includes(sub.name) || sub.name.includes(x.subjectName));
        return found ? found.score : '';
      });
      rows.push([
        r.date, `${r.year}年度`, `第${r.attemptNumber}回`, r.examType, ...subjectVals,
        r.totalScore, `${((r.totalScore / r.totalMaxScore) * 100).toFixed(1)}%`, r.passingBenchmark,
        r.scoreDiff >= 0 ? `+${r.scoreDiff.toFixed(1)}点 (合格)` : `${r.scoreDiff.toFixed(1)}点 (要対策)`,
        r.timeSpentMinutes || '', r.mistakeAnalysis || '', r.nextActionPlan || '',
      ]);
    }
    const clearRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${rangeUrl(`'${esc(sheetTitle)}'!A:Z`)}:clear`,
      { method: 'POST', headers, body: '{}' }
    );
    if (!clearRes.ok) {
      const err = await clearRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `${sheetTitle} のクリアに失敗しました (${clearRes.status})`);
    }
    const writeRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${rangeUrl(`'${esc(sheetTitle)}'!A1`)}?valueInputOption=USER_ENTERED`,
      { method: 'PUT', headers, body: JSON.stringify({ values: rows }) }
    );
    if (!writeRes.ok) {
      const err = await writeRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `${sheetTitle} への書き込みに失敗しました (${writeRes.status})`);
    }
  }

  // Keep the existing master-log tab in sync too, if present.
  if (titles.has('過去問演習全記録ログ')) {
    const rows: (string | number)[][] = [
      ['【全志望校 過去問演習ログ】'],
      ['記録日時', '大学・学部', '年度', '回数', '合計得点', '満点', '得点率(%)', '合格最低点', '合否判定', '差分(点)', '失点分析', '次回改善策'],
      ...records.map((r) => {
        const u = universities.find((x) => x.id === r.universityId);
        return [r.date, u?.shortName || r.universityId, `${r.year}年`, `第${r.attemptNumber}回`, r.totalScore,
          r.totalMaxScore, `${((r.totalScore / r.totalMaxScore) * 100).toFixed(1)}%`, r.passingBenchmark,
          r.isPassed ? '合格ライン突破' : '合格最低点未満', r.scoreDiff > 0 ? `+${r.scoreDiff.toFixed(1)}` : `${r.scoreDiff.toFixed(1)}`,
          r.mistakeAnalysis || '', r.nextActionPlan || ''];
      }),
    ];
    const clearRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${rangeUrl("'過去問演習全記録ログ'!A:L")}:clear`,
      { method: 'POST', headers, body: '{}' }
    );
    if (!clearRes.ok) {
      const err = await clearRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `全記録ログのクリアに失敗しました (${clearRes.status})`);
    }
    const writeRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${rangeUrl("'過去問演習全記録ログ'!A1")}?valueInputOption=USER_ENTERED`,
      { method: 'PUT', headers, body: JSON.stringify({ values: rows }) }
    );
    if (!writeRes.ok) {
      const err = await writeRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `全記録ログへの書き込みに失敗しました (${writeRes.status})`);
    }
  }

  return true;
}

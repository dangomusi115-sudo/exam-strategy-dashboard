import React, { useState } from 'react';
import {
  Download,
  Upload,
  Database,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import { PastPaperRecord, MockExamRecord, SheetsConfig, UniversityConfig } from '../types';
import { requestGoogleAccessToken } from '../services/sheetsService';
import { fetchRecordsFromSpreadsheet } from '../services/sheetsRestoreService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  records: PastPaperRecord[];
  mockExams: MockExamRecord[];
  sheetsConfig: SheetsConfig | null;
  universities: UniversityConfig[];
  onRestoreData: (newRecords: PastPaperRecord[], newMockExams?: MockExamRecord[]) => void;
  onNotice: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const BackupRestoreModal: React.FC<Props> = ({
  isOpen,
  onClose,
  records,
  mockExams,
  sheetsConfig,
  universities,
  onRestoreData,
  onNotice,
}) => {
  const [isRestoringFromSheets, setIsRestoringFromSheets] = useState(false);
  const [customSpreadsheetId, setCustomSpreadsheetId] = useState(sheetsConfig?.spreadsheetId || '');

  if (!isOpen) return null;

  // 1. Export JSON backup file
  const handleExportJSON = () => {
    const backupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      recordsCount: records.length,
      mockExamsCount: mockExams.length,
      records,
      mockExams,
      sheetsConfig,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `志望校過去問演習_バックアップ_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onNotice('バックアップファイル(.json)をダウンロードしました！', 'success');
  };

  // 2. Import JSON backup file
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        let importedRecords: PastPaperRecord[] = [];
        let importedMocks: MockExamRecord[] = [];

        if (Array.isArray(parsed)) {
          // Plain array of records
          importedRecords = parsed;
        } else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.records)) {
            importedRecords = parsed.records;
          }
          if (Array.isArray(parsed.mockExams)) {
            importedMocks = parsed.mockExams;
          }
        }

        if (importedRecords.length === 0 && importedMocks.length === 0) {
          onNotice('有効な演習記録または模試データが見つかりませんでした。', 'error');
          return;
        }

        onRestoreData(importedRecords, importedMocks);
        onNotice(
          `バックアップから過去問${importedRecords.length}件、模試${importedMocks.length}件を完全復元しました！`,
          'success'
        );
        onClose();
      } catch (err: any) {
        console.error(err);
        onNotice('バックアップファイルの読み込みに失敗しました。正しいJSONファイルか確認してください。', 'error');
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  // 3. Restore records from Google Spreadsheet
  const handleRestoreFromSheets = async () => {
    const targetId = customSpreadsheetId.trim() || sheetsConfig?.spreadsheetId;
    if (!targetId) {
      onNotice('スプレッドシートIDを入力するか、まずスプレッドシートを作成してください。', 'error');
      return;
    }

    setIsRestoringFromSheets(true);
    try {
      const token = await requestGoogleAccessToken();
      const fetched = await fetchRecordsFromSpreadsheet(targetId, token, universities);
      if (fetched.length === 0) {
        onNotice('指定のスプレッドシート「過去問演習全記録ログ」にデータが見つかりませんでした。', 'info');
        return;
      }

      onRestoreData(fetched);
      onNotice(`Googleスプレッドシートから${fetched.length}件の過去問記録を読み込んで復元しました！`, 'success');
      onClose();
    } catch (err: any) {
      console.error(err);
      onNotice(err.message || 'スプレッドシートからの復元中にエラーが発生しました。', 'error');
    } finally {
      setIsRestoringFromSheets(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-3.5 px-4 bg-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold tracking-tight">
                データの保護・バックアップ ＆ 復元
              </h3>
              <p className="text-[10px] text-indigo-200">
                ブラウザを閉じたりキャッシュが消えても大切な記録を失わないための安全機能
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto text-xs text-slate-700">
          {/* Explanation Box */}
          <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-3 text-[11px] space-y-1 text-amber-900">
            <p className="font-bold flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-amber-700" />
              データが消える主な原因と対策について
            </p>
            <p className="text-amber-800 leading-relaxed">
              ブラウザ（SafariやChrome）の「プライベートブラウズ」「履歴の自動削除」や、一定期間経過によるブラウザストレージの整理により、端末内の保存データが消えてしまうことがあります。
              以下の<strong>2つの方法</strong>でデータを永続的に安全保管できます。
            </p>
          </div>

          {/* Option 1: Google Spreadsheet cloud backup & restore */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    方法① Googleスプレッドシート連携（クラウド自動保存）
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Googleアカウント側にデータが残り続けるため最も安全です
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              画面上の「Googleスプレッドシートを新規作成」を行うと、記録するたびに自動でGoogleドライブに送信されます。
              端末のデータが消えた場合でも、下のボタンからいつでもスプレッドシートから復元できます。
            </p>

            <div className="pt-1 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <input
                type="text"
                value={customSpreadsheetId}
                onChange={(e) => setCustomSpreadsheetId(e.target.value)}
                placeholder="スプレッドシートID (未入力時は現在の設定を使用)"
                className="flex-1 bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={handleRestoreFromSheets}
                disabled={isRestoringFromSheets}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRestoringFromSheets ? 'animate-spin' : ''}`} />
                {isRestoringFromSheets ? '復元中...' : 'シートから復元'}
              </button>
            </div>
          </div>

          {/* Option 2: Local JSON File Backup & Restore */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">
                  方法② ファイルバックアップ（JSONファイルで保存・読込）
                </h4>
                <p className="text-[10px] text-slate-500">
                  いつでもワンクリックで端末にバックアップを保存し、別のPCやスマホにも引き継げます
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleExportJSON}
                className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                バックアップ保存 (.json)
              </button>

              <label className="w-full px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs">
                <Upload className="w-4 h-4 text-slate-500" />
                バックアップ復元 (.json読込)
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-slate-100/70 p-2.5 rounded text-[11px] text-slate-600 flex justify-between items-center">
            <span>現在の保存件数:</span>
            <span className="font-mono font-bold text-slate-800">
              過去問 {records.length}件 / 模試 {mockExams.length}件
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 px-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded text-xs transition-colors cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

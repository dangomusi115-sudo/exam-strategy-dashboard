import React from 'react';
import { FileSpreadsheet, ExternalLink, RefreshCw, CheckCircle2, Plus, Unlink, PlusCircle, ShieldCheck } from 'lucide-react';
import { SheetsConfig } from '../types';

interface Props {
  sheetsConfig: SheetsConfig | null;
  onCreateSpreadsheet: () => void;
  onSyncAllRecords: () => void;
  onResetSheetsConfig?: () => void;
  onOpenBackupModal?: () => void;
  isCreating: boolean;
  isSyncing: boolean;
}

export const SheetsIntegrationBanner: React.FC<Props> = ({
  sheetsConfig,
  onCreateSpreadsheet,
  onSyncAllRecords,
  onResetSheetsConfig,
  onOpenBackupModal,
  isCreating,
  isSyncing,
}) => {
  return (
    <div
      className="bg-indigo-950 text-white rounded-lg p-2.5 px-3.5 border border-indigo-800/80 shadow-xs flex flex-wrap items-center justify-between gap-3 shrink-0"
      id="sheets-integration-banner"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30 shrink-0">
          <FileSpreadsheet className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-100 tracking-tight whitespace-nowrap">
              Google スプレッドシート連携
            </span>
            {sheetsConfig ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                <CheckCircle2 className="w-2.5 h-2.5" />
                接続先設定済み
              </span>
            ) : (
              <span className="text-[10px] font-medium px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                未作成
              </span>
            )}
          </div>
          <p className="text-[10px] text-indigo-200 truncate">
            {sheetsConfig ? (
              <>シート名: <span className="font-mono text-slate-200">{sheetsConfig.sheetTitle}</span> {sheetsConfig.lastSyncedAt && `(最終同期: ${new Date(sheetsConfig.lastSyncedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })})`}</>
            ) : (
              '神戸大・同志社・関大の合格最低点マスター＆科目別配点シートを自動生成'
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {sheetsConfig ? (
          <>
            <button
              onClick={onSyncAllRecords}
              disabled={isSyncing}
              id="btn-sync-sheets"
              title="演習記録を現在のスプレッドシートに送信"
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/20 text-white rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? '同期中...' : 'Googleに同期'}
            </button>

            <a
              href={sheetsConfig.spreadsheetUrl}
              target="_blank"
              rel="noreferrer"
              id="btn-open-spreadsheet"
              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-[11px] flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              シートを開く
            </a>

            {/* 新規再作成ボタン (削除時や別シートを再作成したい時) */}
            <button
              onClick={onCreateSpreadsheet}
              disabled={isCreating}
              id="btn-recreate-spreadsheet"
              title="新しくGoogleスプレッドシートを作り直して初期化します"
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded text-[11px] flex items-center gap-1 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              <PlusCircle className="w-3 h-3" />
              {isCreating ? '作成中...' : '別シートを作る'}
            </button>

            {onResetSheetsConfig && (
              <button
                onClick={onResetSheetsConfig}
                title="連携を解除して未作成状態に戻す"
                className="p-1 hover:bg-white/10 text-indigo-300 hover:text-rose-300 rounded cursor-pointer transition-colors"
              >
                <Unlink className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        ) : (
          <button
            onClick={onCreateSpreadsheet}
            disabled={isCreating}
            id="btn-create-spreadsheet"
            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold rounded text-[11px] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            {isCreating ? '作成中...' : 'スプレッドシートを新規作成'}
          </button>
        )}
        {onOpenBackupModal && (
          <button
            onClick={onOpenBackupModal}
            id="btn-open-backup-modal"
            title="データの保護・バックアップ・復元メニューを開く"
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/25 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            データ保護・復元
          </button>
        )}
      </div>
    </div>
  );
};

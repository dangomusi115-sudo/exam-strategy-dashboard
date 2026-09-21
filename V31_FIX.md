# v3.1 Google連携修正

- Firebase Auth の `signInWithPopup` を Google Sheets 連携経路から完全に外しました。
- iPhone/Vercel で `firebaseapp.com` に遷移し「The requested action is invalid.」になる問題を回避します。
- Google Identity Services (GIS) の OAuth token client のみを使用します。
- アクセストークンは sessionStorage に短時間だけ保持し、不要な再ログインを減らします。
- 認証待ちのタイムアウトと、ポップアップ失敗時の日本語エラーを追加しました。
- 「同期中」という誤解を招く表示を「接続先設定済み」に変更しました。

## 注意
Google Cloud 側の OAuth クライアントで Vercel の公開ドメインが JavaScript origin として許可されていない場合、GIS は `origin_mismatch` を返します。その場合は Google Cloud Console 側の OAuth クライアント設定に Vercel の公開 URL を追加する必要があります。コードだけでは第三者の OAuth クライアント設定を変更できません。

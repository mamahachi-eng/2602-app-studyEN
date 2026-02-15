# GitHub連携デプロイ手順 🚀

このファイルは、アプリをGitHubにアップロードしてiPhoneで見れるようにする手順です。

---

## 📋 必要なもの

- ✅ GitHubアカウント（無料）
- ✅ この`travel-english-app`フォルダ

---

## 🚀 手順（全7ステップ・約15分）

### ステップ1️⃣：GitHubアカウントを作成

1. [GitHub.com](https://github.com/) にアクセス
2. **Sign up**（無料登録）をクリック
3. メールアドレスとパスワードを入力
4. ユーザー名を決める（例：`ram-learning-2025`）
   - **重要**：後で変更できないので慎重に！
5. メール認証を完了

---

### ステップ2️⃣：2段階認証を設定（セキュリティ強化）

1. 右上のプロフィールアイコン → **Settings**
2. 左メニュー → **Password and authentication**
3. **Enable two-factor authentication** をクリック
4. スマホアプリ（Google Authenticatorなど）で設定
5. リカバリーコードを保存

---

### ステップ3️⃣：新しいリポジトリを作成

1. 右上の **+** → **New repository**
2. 以下を入力：

   | 項目 | 入力内容 |
   |------|---------|
   | Repository name | `my-english-study-k7x9m` ← **ランダムな名前推奨** |
   | Description | `Personal English learning app` |
   | 公開設定 | **Public** を選択 |
   | Initialize | ❌ **何もチェックしない** |

3. **Create repository** をクリック

---

### ステップ4️⃣：ファイルをアップロード

#### 方法A：ブラウザから直接（簡単！）

1. リポジトリページで「uploading an existing file」リンクをクリック
2. 以下のファイルを**すべて**ドラッグ＆ドロップ：
   ```
   ✅ index.html
   ✅ style.css
   ✅ app.js
   ✅ README.md
   ✅ robots.txt         ← 検索避けファイル
   ✅ .gitignore
   ✅ packs/ フォルダ全体
   ✅ .github/ フォルダ全体
   ```
3. 下の方に移動して：
   - Commit message: `Initial commit`
   - **Commit changes** をクリック

---

#### 方法B：Gitコマンド（ちょっと難しい）

```bash
# ターミナルで実行

# 1. フォルダに移動
cd ~/Downloads/travel-english-app

# 2. Gitの初期設定（初回のみ）
git config --global user.name "あなたの名前"
git config --global user.email "GitHubのメールアドレス"

# 3. リポジトリを初期化
git init
git add .
git commit -m "Initial commit"

# 4. GitHubに接続（URLは自分のものに変更）
git remote add origin https://github.com/あなたのユーザー名/リポジトリ名.git

# 5. アップロード
git branch -M main
git push -u origin main
```

---

### ステップ5️⃣：GitHub Pagesを有効化

1. リポジトリページで **Settings** タブをクリック
2. 左メニューから **Pages** をクリック
3. **Build and deployment** セクション：
   - Source: **GitHub Actions** を選択
   - （または **Deploy from a branch** → Branch: `main`, Folder: `/ (root)`）
4. 数分待つ

---

### ステップ6️⃣：URLを確認

Pagesページに以下のように表示されます：

```
✅ Your site is live at https://ユーザー名.github.io/リポジトリ名/
```

**このURLをメモしてください！**

---

### ステップ7️⃣：iPhoneで開く

1. iPhoneのSafariで上記URLを開く
2. 動作確認
3. **ホーム画面に追加**：
   - 下の「共有」ボタンをタップ
   - 「ホーム画面に追加」
   - アイコン名を入力（例：「English Study」）
   - 追加

**完成！🎉**

---

## 🔒 プライバシー設定確認

### ✅ 含まれているセキュリティ対策

- **robots.txt**：検索エンジンに「インデックスしないで」と指示
- **ランダムなリポジトリ名**：推測されにくい
- **URLを公開しない**：知ってる人だけアクセス可能

### ⚠️ 注意点

- Publicリポジトリなので、**URLを知っている人は誰でもアクセス可能**
- GitHubで検索すると**コードは見える**（でもURLは推測しにくい）
- 完全プライベートにしたい場合は：
  - GitHub Pro（月¥550）にアップグレード
  - リポジトリをPrivateに変更

---

## 🔄 更新方法（Packを追加したい時）

### iPhoneから更新

1. SafariでGitHubにログイン
2. リポジトリを開く
3. 編集したいファイルをタップ
4. 右上の✏️（鉛筆）をタップ
5. 編集
6. **Commit changes** をタップ
7. 数分待つ → 反映される！

---

### パソコンから更新

1. GitHub Desktopを使う（簡単）：
   - リポジトリをClone
   - ローカルで編集
   - Commit → Push
   
2. またはブラウザで：
   - GitHubのファイルを直接編集
   - Commit

---

## 📱 iPhoneでの使い方

### 初回アクセス

```
Safari → https://ユーザー名.github.io/リポジトリ名/
→ ホーム画面に追加
```

### 2回目以降

```
ホーム画面のアイコンをタップ
→ アプリみたいに使える！
```

---

## 🆘 トラブルシューティング

### Q1: 404 Not Foundが出る

**原因**：
- Pages設定がまだ有効になっていない
- ファイルがアップロードされていない

**解決**：
1. Settings → Pages で設定確認
2. 5〜10分待つ
3. ブラウザのキャッシュをクリア

---

### Q2: 画面が真っ白

**原因**：
- ファイル構成が壊れている
- CSSやJSが読み込めていない

**解決**：
1. ブラウザの開発者ツール（F12）でエラー確認
2. ファイルが全部アップロードされているか確認
3. パスが正しいか確認（大文字小文字も区別される）

---

### Q3: 音声が出ない（iPhoneで）

**原因**：
- iOSのセキュリティ制限
- ユーザー操作前にTTSが動かない

**解決**：
1. まず何かボタンをタップ（画面をアクティブにする）
2. それから再生ボタンを押す
3. 音量を確認

---

### Q4: 検索エンジンに出てきた！

**原因**：
- robots.txtが効くまで時間がかかる
- 既にクロールされていた

**対策**：
1. Google Search Consoleで削除リクエスト
2. リポジトリ名を変更して再デプロイ
3. Privateリポジトリにアップグレード

---

## 📊 リポジトリ名の付け方

### ❌ 避けるべき名前

```
travel-english-app        ← 誰でも推測できる
my-study-app              ← よくある名前
english-learning          ← 検索されやすい
```

### ✅ おすすめの名前

```
my-project-k7x9m2         ← ランダム文字列
personal-tool-2025-nx8    ← 年と乱数
study-app-ram-j4k2        ← 名前の一部 + 乱数
```

**生成ツール**：
```javascript
// ブラウザのコンソールで実行
'my-app-' + Math.random().toString(36).substring(2, 8)
```

---

## 🎯 チェックリスト

デプロイ前に確認：

```
□ GitHubアカウント作成済み
□ 2段階認証設定済み
□ リポジトリ作成（ランダム名）
□ 全ファイルアップロード済み
  □ HTML, CSS, JS
  □ packs/ フォルダ
  □ robots.txt
  □ .gitignore
  □ .github/workflows/
□ GitHub Pages有効化済み
□ URLが発行された
□ iPhoneで動作確認済み
□ ホーム画面に追加済み
```

---

## 🎉 完了後

おめでとうございます！

あなた専用の英語学習アプリが完成しました。

**URL**: `https://ユーザー名.github.io/リポジトリ名/`

このURLは誰にも教えないでください。
あなただけの秘密の学習ツールです！

---

## 📞 サポート

困ったことがあれば：
1. このファイルを再度確認
2. GitHubのヘルプページを見る
3. ブラウザの開発者ツールでエラー確認

Good luck! 📚✨

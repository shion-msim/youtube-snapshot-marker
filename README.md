# YouTube Snapshot Marker

YouTube の URL を読み込み、シークバー上にマーカーを付けて、動画から取れる最高解像度の静止画をローカルフォルダへ書き出すデスクトップアプリです（Tauri 2 + React）。

## 機能

- YouTube URL の入力と IFrame プレイヤーでの再生
- シークバーへの手動マーカー追加・編集・削除
- ffmpeg によるカット（シーン）自動検出とマーカー提案
- yt-dlp + ffmpeg による最高画質フレームの PNG 書き出し
- マーカー状態の自動保存（アプリデータフォルダ）

## 必要環境

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/tools/install)
- **yt-dlp** と **ffmpeg** はリポジトリ同梱（`src-tauri/binaries/`）。同梱バイナリを優先し、見つからない場合のみ PATH を参照します

### 同梱バイナリの更新（Windows）

```bash
npm run download-binaries
```

手動で入れる場合は `yt-dlp-x86_64-pc-windows-msvc.exe` / `ffmpeg-x86_64-pc-windows-msvc.exe`（または `.exe` 短名）を `src-tauri/binaries/` に配置してください。

## 開発

```bash
npm install
npm run tauri dev
```

## ビルド

```bash
npm run tauri build
```

## 使い方

1. YouTube URL を入力して「読み込む」
2. 再生位置で「現在位置にマーカー追加」、または「カットを自動検出」
3. 「スナップショット書き出し」で保存先フォルダを選択
4. `001_{動画ID}_{時刻}.png` 形式で連番保存されます

## 注意

- YouTube の利用規約上、動画のダウンロードは制限されています。個人のローカル利用に留めてください。
- 自動検出・書き出しは動画を一度ダウンロードするため、長尺・高解像度では時間とディスク容量を消費します。
- 年齢制限・地域制限・DRM 付きの動画は取得できない場合があります。

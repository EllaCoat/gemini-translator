# gemini-translator

Gemini API を使った日本語/英語の翻訳 CLI ツール。

## 必要環境

- Node.js v24 以上
- Gemini API キー（[Google AI Studio](https://aistudio.google.com/apikey) で取得）

## セットアップ

1. 依存パッケージをインストールする。

   ```bash
   npm install
   ```

2. `.env.example` をコピーして `.env` を作成し、`GEMINI_API_KEY` を記入する（任意で `GEMINI_MODEL` を設定するとデフォルトモデルを上書きできる）。

3. TypeScript をコンパイルする。

   ```bash
   npm run build
   ```

## 使い方

```bash
# 入力言語を自動判定して翻訳（日本語 ↔ 英語）
npm run tl -- "Hello, world"
# → こんにちは、世界

npm run tl -- "おはよう"
# → Good morning

# 出力言語を指定（--to / -t、ja または en）
npm run tl -- --to en "今日はいい天気"
# → It's nice weather today

# 使用モデルを一時的に上書き（--model / -m）
npm run tl -- --model gemini-2.5-flash "Hello, world"

# ヘルプ表示
npm run tl -- --help
```

## ライセンス

[MIT License](LICENSE)

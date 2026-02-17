# Community Weather Station (界隈天気予報)

キーワードを入力すると、現在のネット上の「空気感」をAIが分析し、天気として可視化するWebアプリケーションです。

## 🌥️ 特徴

- **ハイブリッド分析エンジン**: Gemini API と Groq API (Llama 3等) を併用し、高精度かつ安定した分析を実現。
- **天気アニメーション**: 感情分析結果（ポジティブ/ネガティブ/中立/炎上）に基づき、Canvas 2D でリッチな天気エフェクト（快晴・雨・雷雨など）を表示。
- **AI天気予報士**: ニュースキャスター風のAIキャラクターが、天気の要因となった具体的な出来事を解説。
- **ピックアップ事象**: 天候を決定づけた具体的なニュースや話題を深掘りして表示。

## 🛠️ 技術スタック

- **Frontend**: Vite, Canvas 2D API, CSS Glassmorphism
- **Backend**: Express.js
- **AI / API**:
  - Google Gemini API
  - Groq API (Llama 3, Mixtral etc.)
  - Google Custom Search API (Optional)

## 🚀 セットアップ

### 1. リポジトリのクローン
```bash
git clone https://github.com/r9kur6ck/weather_news.git
cd weather_news
npm install
```

### 2. 環境変数の設定
`.env.example` をコピーして `.env` を作成し、APIキーを設定してください。

```bash
cp .env.example .env
```

`.env` の内容:
```env
# Gemini API Key (必須またはGroqのどちらかが必要)
GEMINI_API_KEY=your_gemini_api_key

# Groq API Key (必須またはGeminiのどちらかが必要 - 推奨)
GROQ_API_KEY=your_groq_api_key

# Google Custom Search API (任意 - 検索精度向上)
GOOGLE_SEARCH_API_KEY=your_search_api_key
GOOGLE_SEARCH_CX=your_cx_id
```

### 3. アプリケーションの起動
```bash
npm run dev
```
ブラウザで `http://localhost:5173` にアクセスしてください。

## 📝 ライセンス

MIT License

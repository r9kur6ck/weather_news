import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { searchKeyword } from './searchService.js';
import { analyzeSentiment } from './analysisService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/api/analyze', async (req, res) => {
    const { keyword } = req.body;

    if (!keyword || keyword.trim() === '') {
        return res.status(400).json({ error: 'キーワードを入力してください。' });
    }

    try {
        console.log(`[INFO] 分析開始: "${keyword}"`);

        // Step 1: 情報収集
        const searchResults = await searchKeyword(keyword.trim());
        console.log(`[INFO] 検索結果: ${searchResults.length} 件`);

        // Step 2: 感情分析 + 天候判定
        const analysis = await analyzeSentiment(keyword.trim(), searchResults);
        console.log(`[INFO] 天候判定: ${analysis.weather}`);

        res.json({
            keyword: keyword.trim(),
            weather: analysis.weather,
            weatherLabel: analysis.weatherLabel,
            positive: analysis.positive,
            negative: analysis.negative,
            neutral: analysis.neutral,
            rootCause: analysis.rootCause,
            forecasterMessage: analysis.forecasterMessage,
            sources: searchResults.slice(0, 5).map(s => ({
                title: s.title,
                snippet: s.snippet,
            })),
        });
    } catch (err) {
        console.error('[ERROR]', err);
        res.status(500).json({
            error: '分析中にエラーが発生しました。APIキーの設定を確認してください。',
            details: err.message,
        });
    }
});

app.listen(PORT, () => {
    console.log(`[Weather Station] Server running on http://localhost:${PORT}`);
});

import dotenv from 'dotenv';
dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_SEARCH_CX;

/**
 * Google Custom Search API でキーワードを検索
 * API未設定時は空配列を返し、analysisService 側で Gemini フォールバック
 */
export async function searchKeyword(keyword) {
    if (!GOOGLE_API_KEY || !GOOGLE_CX || GOOGLE_API_KEY === 'your_google_search_api_key_here') {
        console.log('[INFO] Google Search API 未設定。Gemini フォールバックモードで動作します。');
        return [];
    }

    try {
        const query = encodeURIComponent(keyword);
        const dateRestrict = 'd1'; // 直近24時間
        const url =
            `https://www.googleapis.com/customsearch/v1` +
            `?key=${GOOGLE_API_KEY}` +
            `&cx=${GOOGLE_CX}` +
            `&q=${query}` +
            `&dateRestrict=${dateRestrict}` +
            `&num=10` +
            `&lr=lang_ja`;

        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`[WARN] Google Search API エラー: ${response.status}`);
            return [];
        }

        const data = await response.json();
        if (!data.items || data.items.length === 0) {
            console.log('[INFO] 検索結果なし。');
            return [];
        }

        return data.items.map((item) => ({
            title: item.title || '',
            snippet: item.snippet || '',
            link: item.link || '',
        }));
    } catch (err) {
        console.error('[ERROR] Google Search:', err.message);
        return [];
    }
}

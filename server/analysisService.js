import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// ---------- API Keys ----------
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const hasGemini = GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here';
const hasGroq = GROQ_API_KEY && GROQ_API_KEY !== 'your_groq_api_key_here';

if (!hasGemini && !hasGroq) {
    console.error('[FATAL] GEMINI_API_KEY または GROQ_API_KEY のいずれかを設定してください。');
}

const genAI = hasGemini ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Gemini モデル優先順位
const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];

/**
 * 天候マッピング
 */
function mapWeather(positive, negative, hasControversial) {
    if (negative >= 80 || hasControversial) {
        return { weather: 'storm', weatherLabel: '雷雨' };
    }
    if (negative > 50) {
        return { weather: 'rainy', weatherLabel: '雨' };
    }
    if (positive > 70) {
        return { weather: 'sunny', weatherLabel: '快晴' };
    }
    if (positive > 50) {
        return { weather: 'partly_cloudy', weatherLabel: '晴れ時々曇り' };
    }
    return { weather: 'cloudy', weatherLabel: '曇り' };
}

/**
 * 共通の感情分析プロンプトを生成
 */
function buildPrompt(keyword, searchResults) {
    let contextText = '';
    if (searchResults.length > 0) {
        contextText = `以下は「${keyword}」に関する最新のWeb検索結果です:\n\n`;
        searchResults.forEach((r, i) => {
            contextText += `${i + 1}. ${r.title}\n   ${r.snippet}\n\n`;
        });
    }

    return `あなたはSNSやニュースの空気感を分析する専門家です。

${contextText || `「${keyword}」というキーワードについて、現在のインターネット上の評判・空気感を分析してください。あなたの知識に基づいて、最新のトレンドや話題を考慮して回答してください。`}

以下のJSON形式で回答してください。JSON以外のテキストは含めないでください:
{
  "positive": <ポジティブな感情の割合 0-100の整数>,
  "negative": <ネガティブな感情の割合 0-100の整数>,
  "neutral": <中立的な感情の割合 0-100の整数>,
  "hasControversial": <炎上・大きな論争があるかどうか true/false>,
  "rootCause": "<感情の主な原因を1文で要約。日本語で。例: サーバーダウンの報告が相次いでいるため>",
  "highlightedEvent": "<天候判定の決定打となった具体的な事象を1つピックアップして2〜3文で解説。例: 『〇〇』という発言がSNSで拡散され、賛否両論を呼んでいます。特に〜という点が批判されています。>",
  "forecasterMessage": "<ニュースキャスター風の天気予報コメントを日本語で。例: 本日は『待望のアップデート』高気圧に覆われ、界隈は一日中快晴となるでしょう！>"
}

注意:
- positive + negative + neutral = 100 になるようにしてください
- forecasterMessage は天気予報士が話すような口調で、キーワードに関連する具体的な出来事を交えてください
- highlightedEvent は具体的なニュースや話題を特定して深掘りしてください`;
}

/**
 * LLMレスポンスからJSONをパース
 */
function parseResponse(text) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    try {
        return JSON.parse(jsonMatch[0]);
    } catch {
        return null;
    }
}

// ============================================
// Gemini API 呼び出し
// ============================================
async function callGemini(prompt) {
    if (!genAI) return null;

    for (const modelName of GEMINI_MODELS) {
        try {
            console.log(`[Gemini] ${modelName} で生成中...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const parsed = parseResponse(text);
            if (parsed) {
                console.log(`[Gemini] ✅ ${modelName} 成功`);
                return parsed;
            }
        } catch (err) {
            const is429 = err.message?.includes('429') || err.message?.includes('quota');
            console.warn(`[Gemini] ${modelName} ${is429 ? 'クォータ超過' : 'エラー'}: ${err.message?.substring(0, 80)}`);
            if (!is429) break; // 429以外は即中断
        }
    }
    console.warn('[Gemini] ❌ 全モデル失敗');
    return null;
}

// ============================================
// Groq API 呼び出し (OpenAI互換)
// ============================================
async function callGroq(prompt) {
    if (!hasGroq) return null;

    const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'];

    for (const model of models) {
        try {
            console.log(`[Groq] ${model} で生成中...`);
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                },
                body: JSON.stringify({
                    model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    max_tokens: 1024,
                }),
            });

            if (!res.ok) {
                const errBody = await res.text().catch(() => '');
                console.warn(`[Groq] ${model} HTTP ${res.status}: ${errBody.substring(0, 80)}`);
                if (res.status === 429) continue; // 次のモデルへ
                break;
            }

            const data = await res.json();
            const text = data.choices?.[0]?.message?.content || '';
            const parsed = parseResponse(text);
            if (parsed) {
                console.log(`[Groq] ✅ ${model} 成功`);
                return parsed;
            }
        } catch (err) {
            console.warn(`[Groq] ${model} エラー: ${err.message}`);
        }
    }
    console.warn('[Groq] ❌ 全モデル失敗');
    return null;
}

// ============================================
// 2つのLLM結果を統合
// ============================================
function mergeResults(results) {
    // 有効な結果のみ
    const valid = results.filter(Boolean);
    if (valid.length === 0) return null;
    if (valid.length === 1) return valid[0];

    // 2つの結果を平均化（数値）+ 長い方のテキストを採用
    const merged = {
        positive: Math.round(valid.reduce((s, r) => s + (parseInt(r.positive) || 0), 0) / valid.length),
        negative: Math.round(valid.reduce((s, r) => s + (parseInt(r.negative) || 0), 0) / valid.length),
        neutral: Math.round(valid.reduce((s, r) => s + (parseInt(r.neutral) || 0), 0) / valid.length),
        hasControversial: valid.some(r => r.hasControversial === true),
        // テキストは長い方（より詳しい分析）を優先
        rootCause: valid.reduce((a, b) => (a.rootCause?.length || 0) >= (b.rootCause?.length || 0) ? a : b).rootCause,
        highlightedEvent: valid.reduce((a, b) => (a.highlightedEvent?.length || 0) >= (b.highlightedEvent?.length || 0) ? a : b).highlightedEvent,
        forecasterMessage: valid.reduce((a, b) =>
            (a.forecasterMessage?.length || 0) >= (b.forecasterMessage?.length || 0) ? a : b
        ).forecasterMessage,
    };

    // 合計が100になるよう調整
    const total = merged.positive + merged.negative + merged.neutral;
    if (total !== 100 && total > 0) {
        const diff = 100 - total;
        merged.neutral += diff;
    }

    console.log(`[MERGE] Gemini + Groq 統合結果: P=${merged.positive}% N=${merged.negative}% 中=${merged.neutral}%`);
    return merged;
}

// ============================================
// メインエクスポート
// ============================================
export async function analyzeSentiment(keyword, searchResults) {
    const prompt = buildPrompt(keyword, searchResults);

    try {
        // 両方のAPIを並行して呼び出し
        const availableAPIs = [];
        if (hasGemini) availableAPIs.push({ name: 'Gemini', fn: () => callGemini(prompt) });
        if (hasGroq) availableAPIs.push({ name: 'Groq', fn: () => callGroq(prompt) });

        console.log(`[INFO] 使用API: ${availableAPIs.map(a => a.name).join(' + ') || 'なし'}`);

        // 並行実行
        const results = await Promise.all(availableAPIs.map(api => api.fn()));
        const merged = mergeResults(results);

        if (!merged) {
            throw new Error('全てのAPIが応答に失敗しました');
        }

        const positive = Math.max(0, Math.min(100, merged.positive));
        const negative = Math.max(0, Math.min(100, merged.negative));
        const neutral = Math.max(0, Math.min(100, merged.neutral));

        const { weather, weatherLabel } = mapWeather(positive, negative, merged.hasControversial);

        const sourceCount = [hasGemini && results[0] ? 'Gemini' : null, hasGroq && results[availableAPIs.findIndex(a => a.name === 'Groq')] ? 'Groq' : null].filter(Boolean);
        console.log(`[INFO] 天候判定: ${weatherLabel} (${weather}) | 分析ソース: ${sourceCount.join(' + ')}`);

        return {
            weather,
            weatherLabel,
            positive,
            negative,
            neutral,
            rootCause: merged.rootCause || '現在の空気感を分析中です',
            highlightedEvent: merged.highlightedEvent || '特筆すべき事象は見当たりませんでした。',
            forecasterMessage: merged.forecasterMessage || `「${keyword}」界隈の天気をお伝えします。`,
            analysisSources: sourceCount,
        };
    } catch (err) {
        console.error('[ERROR] Analysis:', err.message);
        return {
            weather: 'cloudy',
            weatherLabel: '曇り',
            positive: 40,
            negative: 20,
            neutral: 40,
            rootCause: '分析データが不足しています（APIクォータ超過の可能性があります）',
            forecasterMessage: `「${keyword}」界隈の天気は現在観測が困難な状況です。雲の隙間から様子を伺っていますので、しばらくお待ちください！`,
            analysisSources: [],
        };
    }
}

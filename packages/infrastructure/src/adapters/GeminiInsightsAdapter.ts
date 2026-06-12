import { Activity } from '@carbon-tracker/domain';
import { IInsightsProvider } from '@carbon-tracker/application';
import { Goal, Insight, Result, ok } from '@carbon-tracker/shared-types';

const STATIC_TIPS: Insight[] = [
  {
    tip: 'Switch to LED light bulbs in your main living spaces.',
    estimatedSavingKg: 15.5,
    difficulty: 'easy',
    category: 'ENERGY',
    rationale: 'LED bulbs consume up to 80% less energy and last much longer.',
  },
  {
    tip: 'Reduce meat consumption with Meatless Mondays.',
    estimatedSavingKg: 8.2,
    difficulty: 'medium',
    category: 'FOOD',
    rationale: 'Plant-based diets have a significantly lower carbon footprint.',
  },
  {
    tip: 'Unplug idle electronics to prevent phantom energy draw.',
    estimatedSavingKg: 4.5,
    difficulty: 'easy',
    category: 'ENERGY',
    rationale: 'Standby power accounts for up to 10% of home electricity use.',
    actionableSteps: ['Unplug microwave', 'Use smart power strips', 'Turn off PC at night']
  },
];

export class GeminiInsightsAdapter implements IInsightsProvider {
  constructor(private readonly apiKey: string) {}

  public async generatePersonalizedTips(
    userHistory: Activity[],
    goals: Goal[]
  ): Promise<Result<Insight>> {
    if (!this.apiKey || this.apiKey === 'mock-key') {
      return ok(this.getRandomStaticTip());
    }

    try {
      const prompt = this.getPromptText(userHistory, goals);
      const response = await this.callGeminiApi(prompt);
      const parsed = JSON.parse(response) as Insight;
      return ok(parsed);
    } catch (err) {
      console.warn('Gemini API failed, falling back to static tips.', err);
      return ok(this.getRandomStaticTip());
    }
  }

  private getRandomStaticTip(): Insight {
    const idx = Math.floor(Math.random() * STATIC_TIPS.length);
    return STATIC_TIPS[idx];
  }

  private getPromptText(userHistory: Activity[], goals: Goal[]): string {
    const historySummary = userHistory
      .slice(0, 10)
      .map((a) => `${a.category}: ${String(a.amount)} ${a.unit}`)
      .join(', ');
    const goalSummary = goals
      .map((g) => `${g.timeframe} target: ${String(g.targetKgCO2e)} kg`)
      .join(', ');

    return `Analyze user carbon footprint history: [${historySummary}] and user goals: [${goalSummary}].
Generate one personalized, actionable carbon reduction tip.
Return ONLY a JSON object matching this schema:
{
  "tip": "actionable tip description",
  "estimatedSavingKg": 12.5,
  "difficulty": "easy" | "medium" | "hard",
  "category": "TRANSPORT" | "FOOD" | "ENERGY" | "CONSUMPTION",
  "rationale": "reason why this helps",
  "actionableSteps": ["Simple Action 1", "Simple Action 2", "Simple Action 3"]
}`;
  }

  private async callGeminiApi(prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Gemini API HTTP Error: ${String(res.status)}`);
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini API');
    return text.trim();
  }
}

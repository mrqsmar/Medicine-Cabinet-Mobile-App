import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DosageUnit, MedicationForm } from '../types/medication';

// ── Types ───────────────────────────────────────────────────────────

export interface RecognitionResult {
  name: string;
  dosage_amount: number;
  dosage_unit: DosageUnit;
  form: MedicationForm;
}

// ── API key management ──────────────────────────────────────────────

const API_KEY_STORAGE_KEY = 'anthropic_api_key';

let _apiKey: string | null = null;

export async function loadApiKey(): Promise<void> {
  const stored = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
  _apiKey = stored ?? null;
}

export async function setAnthropicApiKey(key: string): Promise<void> {
  _apiKey = key || null;
  if (key) {
    await AsyncStorage.setItem(API_KEY_STORAGE_KEY, key);
  } else {
    await AsyncStorage.removeItem(API_KEY_STORAGE_KEY);
  }
}

export function getAnthropicApiKey(): string | null {
  return _apiKey;
}

// ── Recognition ─────────────────────────────────────────────────────

export async function recognizeMedication(
  imageUri: string,
): Promise<RecognitionResult> {
  const apiKey = _apiKey;
  if (!apiKey) {
    throw new Error('Anthropic API key not set. Go to Settings to add it.');
  }

  // Read image as base64
  const base64Image = await FileSystem.readAsStringAsync(imageUri, {
    encoding: 'base64',
  });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: 'Identify this medication. Return JSON only, no markdown: { "name": string, "dosage_amount": number, "dosage_unit": "mg" or "cc", "form": "tablet" or "capsule" or "liquid" }',
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`API error ${response.status}: ${errBody}`);
  }

  const data = await response.json();

  // Extract the text content from the response
  const textBlock = data.content?.find(
    (block: any) => block.type === 'text',
  );
  if (!textBlock?.text) {
    throw new Error('No text in API response');
  }

  // Parse JSON from the response — handle markdown code blocks
  let jsonStr = textBlock.text.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr);

  // Validate and normalize
  return {
    name: String(parsed.name || '').trim(),
    dosage_amount: Number(parsed.dosage_amount) || 0,
    dosage_unit: parsed.dosage_unit === 'cc' ? 'cc' : 'mg',
    form:
      parsed.form === 'liquid' || parsed.form === 'capsule'
        ? parsed.form
        : 'tablet',
  };
}

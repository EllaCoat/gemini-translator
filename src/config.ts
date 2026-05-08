import { ConfigError } from './errors.js';

/**
 * アプリ全体で参照される設定値。
 * `loadConfig()` で環境変数から構築される。
 */
export interface AppConfig {
  apiKey: string;
  model: string;
}

const DEFAULT_MODEL = 'gemini-2.5-flash-lite';

/**
 * 環境変数から設定を読み込んで AppConfig を返す。
 * `GEMINI_API_KEY` が未設定または空文字の場合は ConfigError を投げる。
 * `GEMINI_MODEL` が未設定または空文字の場合は DEFAULT_MODEL を使用。
 *
 * @throws {ConfigError} API キーが未設定または空文字の場合
 */
export function loadConfig(): AppConfig {
  const apiKey = process.env.GEMINI_API_KEY?.trim() ?? '';
  if (apiKey === '') {
    throw new ConfigError(
      '.env に GEMINI_API_KEY が設定されていません。',
    );
  }

  const rawModel = process.env.GEMINI_MODEL?.trim() ?? '';
  const model = rawModel === '' ? DEFAULT_MODEL : rawModel;

  return { apiKey, model };
}
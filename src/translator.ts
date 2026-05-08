import {
  GoogleGenerativeAI,
  GoogleGenerativeAIError,
  GoogleGenerativeAIFetchError,
  type GenerativeModel,
} from '@google/generative-ai';

import {
  ApiKeyInvalidError,
  EmptyInputError,
  ErrorTemplate,
  GeminiApiError,
  NetworkError,
  RateLimitError,
} from './errors.js';
import { GENERATION_CONFIG, SYSTEM_INSTRUCTION } from './prompts.js';

/** 言語定義 */
const LANGUAGE_NAMES = {
  ja: 'Japanese',
  en: 'English',
} as const;

/** 翻訳の入出力で扱う言語コード */
export type LanguageCode = keyof typeof LANGUAGE_NAMES;

/** `Translator.translate()` のオプション */
export interface TranslateOptions {
  /** 出力言語の指定 */
  to?: LanguageCode;
}

/** `Translator` のコンストラクタが受け取る Config Object */
export interface TranslatorConfig {
  /** Gemini API キー */
  apiKey: string;
  /** 使用するモデル名（例: `gemini-2.5-flash-lite`） */
  model: string;
}

/**
 * Gemini API を使った翻訳機能を提供するクラス。
 * コンストラクタで API キーとモデル名を受け取り、
 * 内部で SDK クライアントとモデルインスタンスを保持する。
 */
export class Translator {
  private readonly model: GenerativeModel;

  constructor(config: TranslatorConfig) {
    const genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = genAI.getGenerativeModel({
      model: config.model,
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: GENERATION_CONFIG,
    });
  }

  /**
   * 入力テキストを翻訳して結果を返す。
   *
   * @param text - 翻訳対象の文字列
   * @param options - 翻訳オプション
   * @returns 翻訳結果のテキスト（前後空白はトリム済み）
   * @throws {EmptyInputError} 入力が空文字または空白のみの場合
   * @throws {NetworkError} ネットワーク層の通信失敗
   * @throws {ApiKeyInvalidError} API キー認証失敗（HTTP 401/403）
   * @throws {RateLimitError} レート制限（HTTP 429）
   * @throws {GeminiApiError} 上記以外の API エラー
   */
  async translate(text: string, options?: TranslateOptions): Promise<string> {
    if (text.trim() === '') {
      throw new EmptyInputError('翻訳対象テキストが空です。');
    }

    const prompt = this.buildPrompt(text, options);

    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      throw this.mapError(error);
    }
  }

  /**
   * systemInstruction の仕様に沿ってプロンプトを組み立てる。
   * `<input>` タグで囲ってプロンプトインジェクションを防ぎ、
   * 出力言語が指定されていれば先頭にマーカーを付与する。
   */
  private buildPrompt(text: string, options?: TranslateOptions): string {
    const target = options?.to;
    const targetMarker = target !== undefined ? `[target=${LANGUAGE_NAMES[target]}] ` : '';
    return `<input>\n${targetMarker}${text}\n</input>`;
  }

  /**
   * SDK が投げる例外を、本アプリの ErrorTemplate 系に変換。
   * HTTP ステータスがある場合はそれで分岐、なければメッセージから推測。
   */
  private mapError(error: unknown): ErrorTemplate {
    if (error instanceof GoogleGenerativeAIFetchError) {
      const status = error.status;
      if (status === 401 || status === 403) {
        return new ApiKeyInvalidError(
          'API キーが無効です。.env の GEMINI_API_KEY を確認してください。',
        );
      }
      if (status === 429) {
        return new RateLimitError(
          'Gemini API のレート制限に達しました。しばらく待ってから再試行してください。',
        );
      }
      return new GeminiApiError(
        `Gemini API エラー (status: ${status ?? 'unknown'}): ${error.message}`,
      );
    }

    // fetch 自体が失敗したケース（オフライン・DNS 失敗等）。
    // SDK が独自エラーで包まない場合があるためメッセージから判定。
    if (
      error instanceof Error &&
      /fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT/i.test(error.message)
    ) {
      return new NetworkError(`ネットワーク接続に失敗しました: ${error.message}`);
    }

    if (error instanceof GoogleGenerativeAIError) {
      return new GeminiApiError(`Gemini API エラー: ${error.message}`);
    }

    if (error instanceof Error) {
      return new GeminiApiError(`予期せぬエラー: ${error.message}`);
    }

    return new GeminiApiError('予期せぬエラーが発生しました。');
  }
}

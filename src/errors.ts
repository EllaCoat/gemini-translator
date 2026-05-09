/**
 * 独自エラーの抽象基底クラス。
 * 各サブクラスは識別子として `code` プロパティを実装。
 */
export abstract class ErrorTemplate extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    // 未指定だと name が 'Error' のままになってしまうので、
    // どのサブクラスのエラーか判別できなくなるため明示的に設定
    this.name = new.target.name;
  }
}

/** 環境変数や設定ファイルが不正な場合のエラー */
export class ConfigError extends ErrorTemplate {
  readonly code = 'CONFIG_ERROR';
}

/** 翻訳対象テキストが空文字または空白のみの場合のエラー */
export class EmptyInputError extends ErrorTemplate {
  readonly code = 'EMPTY_INPUT';
}

/** Gemini API への通信が失敗した場合のエラー */
export class NetworkError extends ErrorTemplate {
  readonly code = 'NETWORK_ERROR';
}

/** Gemini API キーが認証で拒否された場合のエラー */
export class ApiKeyInvalidError extends ErrorTemplate {
  readonly code = 'API_KEY_INVALID';
}

/** Gemini API のレート制限に達した場合のエラー */
export class RateLimitError extends ErrorTemplate {
  readonly code = 'RATE_LIMIT';
}

/** 上記以外の Gemini API エラー（不正リクエスト、サーバ側エラー等） */
export class GeminiApiError extends ErrorTemplate {
  readonly code = 'GEMINI_API_ERROR';
}

/** CLI 引数のパースに失敗した場合のエラー */
export class InvalidArgsError extends ErrorTemplate {
  readonly code = 'INVALID_ARGS';
}
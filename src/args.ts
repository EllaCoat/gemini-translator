import { InvalidArgsError } from './errors.js';
import { LANGUAGE_CODES, type LanguageCode } from './translator.js';

/** パース済みのコマンドライン引数 */
export type ParsedArgs =
  | { kind: 'help' }
  | { kind: 'version' }
  | { kind: 'translate'; text: string; to?: LanguageCode };

/**
 * 引数配列をパースして ParsedArgs を返す。
 * `process.argv.slice(2)` 等の「ユーザ引数の配列」を渡して使う。
 *
 * @param argv - パース対象の引数配列
 * @returns パース結果
 * @throws {InvalidArgsError} 無効引数時のエラー
 */
export function parseArgs(argv: string[]): ParsedArgs {
  let to: LanguageCode | undefined;
  let helpRequested = false;
  let versionRequested = false;
  const positionals: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === undefined) {
      continue;
    }

    if (token === '--help' || token === '-h') {
      helpRequested = true;
      continue;
    }

    if (token === '--version' || token === '-v') {
      versionRequested = true;
      continue;
    }

    if (token === '--to') {
      const value = argv[i + 1];
      if (value === undefined) {
        throw new InvalidArgsError('--to の後に言語コードを指定してください。');
      }
      if (!isLanguageCode(value)) {
        throw new InvalidArgsError(
          `--to は ${LANGUAGE_CODES.join(', ')} のみ対応しています: ${value}`,
        );
      }
      to = value;
      i++;
      continue;
    }

    if (token.startsWith('-')) {
      throw new InvalidArgsError(`未知のオプション: ${token}`);
    }

    positionals.push(token);
  }

  // help / version は他のすべての判定より優先
  if (helpRequested) {
    return { kind: 'help' };
  }
  if (versionRequested) {
    return { kind: 'version' };
  }

  // 位置引数 0 個はヘルプ表示にフォールバック
  if (positionals.length === 0) {
    return { kind: 'help' };
  }

  // 位置引数 2 個以上はクォート忘れの可能性が高いのでエラー
  if (positionals.length > 1) {
    throw new InvalidArgsError('翻訳本文はクォートで 1 つにまとめてください。');
  }

  const text = positionals[0];
  if (text === undefined) {
    throw new InvalidArgsError('翻訳本文の取得に失敗しました。');
  }

  return { kind: 'translate', text, to };
}

/** 文字列が LanguageCode かを判定する型ガード。 */
function isLanguageCode(value: string): value is LanguageCode {
  return (LANGUAGE_CODES as readonly string[]).includes(value);
}

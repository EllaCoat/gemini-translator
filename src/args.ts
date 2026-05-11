import { Command, CommanderError, Option } from 'commander';

import { InvalidArgsError } from './errors.js';
import { LANGUAGE_CODES, type LanguageCode } from './translator.js';

/** パース済みのコマンドライン引数(翻訳実行用) */
export interface TranslateArgs {
  text: string;
  to?: LanguageCode;
  model?: string;
}

/**
 * 引数配列をパースして TranslateArgs を返す。
 * `process.argv.slice(2)` 等の「ユーザ引数の配列」を渡して使う。
 * --help / --version 指定時は commander が出力して process.exit する。
 *
 * @param argv - パース対象の引数配列
 * @param version - バージョン文字列(--version 表示用)
 * @returns パース結果
 * @throws {InvalidArgsError} 無効引数時のエラー
 */
export function parseArgs(argv: string[], version: string): TranslateArgs {
  const program = createCommand(version);

  try {
    // process.argv における先頭 2 要素を除外するために from: 'user' は必須。
    program.parse(argv, { from: 'user' });
  } catch (error) {
    if (error instanceof CommanderError) {
      // help/version は commander が既に出力済み、そのまま終了
      if (error.code === 'commander.helpDisplayed' || error.code === 'commander.version') {
        process.exit(error.exitCode);
      }
      // コマンド引数系のエラー
      throw new InvalidArgsError(translateCommanderError(error));
    }
    // 未知のエラー
    throw error;
  }

  // ジェネリクスを使用してオプションの型指定をする。
  const opts = program.opts<{ to?: LanguageCode; model?: string }>();
  const text = program.args[0];
  if (text === undefined) {
    throw new InvalidArgsError('翻訳本文の取得に失敗しました。');
  }

  return { text, to: opts.to, model: opts.model };
}

/**
 * commander の Command インスタンスを構築する。
 * オプション宣言、ヘルプテキスト、exitOverride 設定をまとめて行う。
 *
 * @param version - バージョン文字列(package.json から渡す想定)
 * @returns 構築済みの Command
 */
function createCommand(version: string): Command {
  return new Command()
    .name('tl')
    .description('Gemini API で翻訳する CLI')
    .version(version, '-v, --version', 'バージョンを表示')
    .helpOption('-h, --help', 'このヘルプを表示')
    .argument('<text>', '翻訳したいテキスト')
    .addOption(
      new Option('-t, --to <lang>', '出力言語を指定').choices([...LANGUAGE_CODES]),
    )
    .option('-m, --model <name>', '使用する Gemini モデルを指定')
    .allowExcessArguments(false)
    .addHelpText(
      'after',
      `\n例:\n  npm run tl -- "Hello, world"\n  npm run tl -- --to en "今日はいい天気"`,
    )
    .configureOutput({
      // commander の自前 stderr 出力を抑制(英語メッセージは translateCommanderError 経由で日本語化)
      writeErr: () => {},
    })
    .exitOverride();
}

/**
 * commander が exitOverride 経由で投げた CommanderError を、
 * ユーザー向け日本語メッセージに変換する。
 * 主要な error code をマッピングし、可能なら詳細情報を含める。
 * 未知の code は元メッセージを返す。
 */
function translateCommanderError(error: CommanderError): string {
  switch (error.code) {
    case 'commander.unknownOption': {
      const option = extractFirstQuoted(error.message);
      return option !== undefined
        ? `未知のオプション: ${option}`
        : '未知のオプションが指定されました。';
    }
    case 'commander.optionMissingArgument': {
      const option = extractFirstQuoted(error.message);
      return option !== undefined
        ? `オプション ${option} に値を指定してください。`
        : 'オプションの後に値を指定してください。';
    }
    case 'commander.missingArgument':
      return '翻訳本文を指定してください。';
    case 'commander.excessArguments':
      return '翻訳本文はクォートで 1 つにまとめてください。';
    case 'commander.invalidArgument': {
      const matches = /argument '([^']+)' is invalid\. Allowed choices are ([^.]+)\./.exec(error.message);
      if (matches !== null) {
        const [, value, choices] = matches;
        return `値が無効: ${value} (許容: ${choices})`;
      }
      return '指定された値が無効です。';
    }
    default:
      return error.message;
  }
}

/** メッセージ中の最初のシングルクォート囲みを返す。なければ undefined。 */
function extractFirstQuoted(message: string): string | undefined {
  const match = /'([^']+)'/.exec(message);
  return match?.[1];
}

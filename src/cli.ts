import 'dotenv/config';

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseArgs } from './args.js';
import { loadConfig } from './config.js';
import { ErrorTemplate } from './errors.js';
import { Translator } from './translator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = join(__dirname, '..', 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string };
const VERSION = pkg.version;

/** ヘルプを出力する。 */
function printHelp(): void {
  console.log(`gemini-translator v${VERSION}

使い方: npm run tl -- [オプション] <翻訳したい文字列>

オプション:
  --to <言語>      出力言語を指定 (ja, en)
  -h, --help       このヘルプを表示
  -v, --version    バージョンを表示

例:
  npm run tl -- "Hello, world"
  npm run tl -- --to en "今日はいい天気"`);
}

/** バージョンを出力する。 */
function printVersion(): void {
  console.log(VERSION);
}

/**
 * 例外を受け取り、ユーザ向けメッセージを出力して終了。
 * exit code は 1 として出力する。
 * ErrorTemplate 系は code 付きで識別しやすく表示する。
 */
function handleError(error: unknown): never {
  if (error instanceof ErrorTemplate) {
    console.error(`エラー [${error.code}]: ${error.message}`);
  } else if (error instanceof Error) {
    console.error(`予期せぬエラー: ${error.message}`);
  } else {
    console.error('予期せぬエラーが発生しました。');
  }
  process.exit(1);
}

/** CLI のエントリポイント。 */
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  switch (args.kind) {
    // ヘルプを表示
    case 'help':
      printHelp();
      return;
    // バージョンを表示
    case 'version':
      printVersion();
      return;
    // 翻訳実行
    case 'translate': {
      const config = loadConfig();
      const translator = new Translator(config);
      const result = await translator.translate(args.text, { to: args.to });
      console.log(result);
      return;
    }
  }
}

main().catch(handleError);

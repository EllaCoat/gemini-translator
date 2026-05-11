import 'dotenv/config';

import { parseArgs } from './args.js';
import { loadConfig } from './config.js';
import { ErrorTemplate } from './errors.js';
import { Translator } from './translator.js';
import { VERSION } from './version.js';

/**
 * 例外を受け取り、ユーザ向けメッセージを出力して終了。
 * exit code は 1 として出力する。
 * ErrorTemplate 系は code 付きで識別しやすく表示する。
 */
function handleError(error: unknown): never {
  if (error instanceof ErrorTemplate) {
    console.error(`Error [${error.code}]: ${error.message}`);
  } else if (error instanceof Error) {
    console.error(`Unexpected Error: ${error.message}`);
  } else {
    console.error('Unknown Error: An unexpected error occurred.');
  }
  process.exit(1);
}

/** CLI のエントリポイント。 */
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2), VERSION);
  const config = loadConfig();
  const model = args.model ?? config.model;
  const translator = new Translator({ ...config, model });
  const result = await translator.translate(args.text, { to: args.to });
  console.log(result);
}

main().catch(handleError);

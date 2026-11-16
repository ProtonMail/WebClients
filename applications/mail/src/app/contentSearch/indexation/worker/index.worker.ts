import initText2HtmlWasm from '@protontech/mail-html-to-text-fast-wasm';
import * as Comlink from 'comlink';
// Polyfill Uint8Array.fromBase64/toBase64
import 'core-js/proposals/array-buffer-base64';
import 'core-js/stable';

import { initWasm } from '../../init';
import type { MailApiBridge } from '../MailApiBridge';
import { IndexWorker, type WorkerIndexListener } from './IndexWorker';

const indexWorkerFactory = async (
    userId: string,
    indexKey: CryptoKey,
    api: Comlink.Remote<MailApiBridge & Comlink.ProxyMarked>,
    listener: WorkerIndexListener
) => {
    await Promise.all([initWasm(), initText2HtmlWasm()]);
    return Comlink.proxy(new IndexWorker(userId, indexKey, api, listener));
};

export type IndexWorkerFactory = typeof indexWorkerFactory;
Comlink.expose(indexWorkerFactory);

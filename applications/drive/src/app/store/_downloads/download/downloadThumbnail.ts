// @ts-ignore missing `toStream` TS defs
import { readToEnd, toStream } from '@openpgp/web-stream-tools';
import type { ReadableStream } from 'web-streams-polyfill';

import type { VERIFICATION_STATUS } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';

import { streamToBuffer } from '../../../utils/stream';
import type { DecryptFileKeys } from '../interface';
import { markErrorAsCrypto } from '../markErrorAsCrypto';
import downloadBlock from './downloadBlock';

type GetKeysCallback = () => Promise<DecryptFileKeys>;

export default async function downloadThumbnail(url: string, token: string, getKeys: GetKeysCallback) {
    const abortController = new AbortController();
    const stream = await downloadBlock(abortController, url, token);
    const { data: decryptedStream, verifiedPromise } = await decryptThumbnail(stream, getKeys);
    const thumbnailData = streamToBuffer(decryptedStream);
    return {
        abortController,
        contents: thumbnailData,
        verifiedPromise,
    };
}

async function decryptThumbnail(
    stream: ReadableStream<Uint8Array>,
    getKeys: GetKeysCallback
): Promise<{ data: ReadableStream<Uint8Array>; verifiedPromise: Promise<VERIFICATION_STATUS> }> {
    const { sessionKeys, addressPublicKeys } = await getKeys();

    const { data, verified } = await markErrorAsCrypto<{ data: Uint8Array; verified: VERIFICATION_STATUS }>(
        async () => {
            const { data, verified } = await CryptoProxy.decryptMessage({
                binaryMessage: await readToEnd(stream),
                sessionKeys,
                verificationKeys: addressPublicKeys,
                format: 'binary',
            });
            return { data, verified };
        }
    );

    return {
        data: toStream(data) as ReadableStream<Uint8Array>,
        verifiedPromise: Promise.resolve(verified), // TODO lara/michal: refactor this since we no longer use streaming on decryption, hence verified is no longer a promise
    };
}

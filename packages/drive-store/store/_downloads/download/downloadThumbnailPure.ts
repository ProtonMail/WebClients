// @ts-ignore missing `toStream` TS defs
import { readToEnd, toStream } from '@openpgp/web-stream-tools';

import { CryptoProxy, type VERIFICATION_STATUS } from '@proton/crypto';

import { streamToBuffer } from '../../../utils/stream';
import type { DecryptFileKeys } from '../interface';
import { markErrorAsCrypto } from '../markErrorAsCrypto';
import downloadBlock from './downloadBlock';

type GetKeysCallback = () => Promise<DecryptFileKeys>;
type GetCache = () => Promise<Uint8Array<ArrayBuffer> | undefined>;
type SetCache = (data: Uint8Array<ArrayBuffer>) => void;
type StreamOrCache = ReadableStream<Uint8Array<ArrayBuffer>> | Uint8Array<ArrayBuffer>;

function assertStream(value: StreamOrCache | undefined): asserts value is StreamOrCache {
    if (value === undefined) {
        throw new Error('Stream is undefined');
    }
}

export async function downloadThumbnailPure(
    url: string,
    token: string,
    getKeys: GetKeysCallback,
    getCache: GetCache,
    setCache: SetCache
) {
    const abortController = new AbortController();
    const cache: StreamOrCache | undefined = await getCache();
    let stream: StreamOrCache | undefined = undefined;
    if (!cache) {
        stream = await downloadBlock(abortController, url, token);
    }
    const inputStream = cache || stream;
    assertStream(inputStream);
    const { data: decryptedStream, verificationStatusPromise } = await decryptThumbnail(inputStream, getKeys, setCache);

    const thumbnailData = streamToBuffer(decryptedStream);
    return {
        abortController,
        contents: thumbnailData,
        verificationStatusPromise,
    };
}

async function decryptThumbnail(
    streamOrCache: StreamOrCache,
    getKeys: GetKeysCallback,
    setCache: SetCache
): Promise<{ data: ReadableStream<Uint8Array<ArrayBuffer>>; verificationStatusPromise: Promise<VERIFICATION_STATUS> }> {
    const { sessionKeys, addressPublicKeys } = await getKeys();

    const binaryMessage =
        streamOrCache instanceof Uint8Array
            ? streamOrCache
            : await readToEnd<Uint8Array<ArrayBuffer>>(streamOrCache);
    if (!(streamOrCache instanceof Uint8Array) && binaryMessage instanceof Uint8Array) {
        setCache(binaryMessage);
    }

    const { data, verificationStatus } = await markErrorAsCrypto<{
        data: Uint8Array<ArrayBuffer>;
        verificationStatus: VERIFICATION_STATUS;
    }>(async () => {
        const { data, verificationStatus } = await CryptoProxy.decryptMessage({
            binaryMessage,
            sessionKeys,
            verificationKeys: addressPublicKeys,
            format: 'binary',
        });

        return {
            data,
            verificationStatus,
        };
    });

    return {
        data: toStream(data) as ReadableStream<Uint8Array<ArrayBuffer>>,
        verificationStatusPromise: Promise.resolve(verificationStatus), // TODO lara/michal: refactor this since we no longer use streaming on decryption, hence verified is no longer a promise
    };
}

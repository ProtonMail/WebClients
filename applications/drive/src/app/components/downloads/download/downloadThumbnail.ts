import { decryptMessage } from 'pmcrypto';
import { ReadableStream } from 'web-streams-polyfill';

import { getStreamMessage } from '@proton/shared/lib/keys/driveKeys';

import { streamToBuffer } from '../../../utils/stream';
import { DecryptFileKeys } from '../interface';
import downloadBlock from './downloadBlock';

type GetKeysCallback = () => Promise<DecryptFileKeys>;

export default async function downloadThumbnail(url: string, token: string, getKeys: GetKeysCallback) {
    const abortController = new AbortController();
    const stream = await downloadBlock(abortController, url, token);
    const decryptedStream = await decryptThumbnail(stream, getKeys);
    const thumbnailData = streamToBuffer(decryptedStream);
    return {
        abortController,
        contents: thumbnailData,
    };
}

async function decryptThumbnail(
    stream: ReadableStream<Uint8Array>,
    getKeys: GetKeysCallback
): Promise<ReadableStream<Uint8Array>> {
    const { sessionKeys, addressPublicKeys } = await getKeys();

    const message = await getStreamMessage(stream);
    const { data } = await decryptMessage({
        message,
        sessionKeys,
        publicKeys: addressPublicKeys,
        streaming: 'web',
        format: 'binary',
    });
    return data;
}

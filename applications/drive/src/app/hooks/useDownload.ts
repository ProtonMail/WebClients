import { useCallback } from 'react';
import { useApi, useCache } from 'react-components';
import { DriveFile, DriveFileRevisionResult } from '../interfaces/file';
import { decryptMessage } from 'pmcrypto/lib/pmcrypto';
import { getPromiseValue } from 'react-components/hooks/useCachedModelResult';
import { deserializeUint8Array } from 'proton-shared/lib/helpers/serialization';
import { getDecryptedSessionKey } from 'proton-shared/lib/calendar/decrypt';
import { getStreamMessage } from 'proton-shared/lib/keys/driveKeys';
import { queryFileRevision } from '../api/files';
import { useDownloadProvider } from '../components/downloads/DownloadProvider';
import useShare from './useShare';

function useDownload(shareId: string) {
    const api = useApi();
    const cache = useCache();
    const { getFileMeta } = useShare(shareId);
    const { startDownload } = useDownloadProvider();

    const getFileRevision = async ({ ID, ActiveRevision }: DriveFile): Promise<DriveFileRevisionResult> =>
        getPromiseValue(cache, `drive/shares/${shareId}/file/${ID}/${ActiveRevision.ID}`, () =>
            api(queryFileRevision(shareId, ID, ActiveRevision.ID))
        );

    const downloadDriveFile = useCallback(
        async (linkId: string, filename: string) => {
            const { File, privateKey } = await getFileMeta(linkId);
            const { Revision } = await getFileRevision(File);
            const blockKeys = deserializeUint8Array(File.ContentKeyPacket);
            const sessionKeys = await getDecryptedSessionKey(blockKeys, privateKey);
            const publicKeys = privateKey.toPublic();

            await startDownload({ File, Revision, filename }, async (stream) => {
                const { data } = await decryptMessage({
                    message: await getStreamMessage(stream),
                    sessionKeys,
                    publicKeys,
                    streaming: 'web',
                    format: 'binary'
                });
                return data;
            });
        },
        [shareId]
    );

    return { downloadDriveFile };
}

export default useDownload;

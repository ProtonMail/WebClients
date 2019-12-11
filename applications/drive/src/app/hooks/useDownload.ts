import { useCallback } from 'react';
import { useApi, useCache } from 'react-components';
import { queryFileRevision } from '../api/files';
import { DriveFile, DriveFileRevisionResult } from '../interfaces/file';
import { decryptMessage, getMessage } from 'pmcrypto/lib/pmcrypto';
import useShare from './useShare';
import { getPromiseValue } from 'react-components/hooks/useCachedModelResult';
import { mergeUint8Arrays } from '../utils/array';
import { useDownloadProvider } from '../components/downloads/DownloadProvider';
import { deserializeUint8Array } from 'proton-shared/lib/helpers/serialization';

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

            await startDownload({ File, Revision, filename }, async (buffer: Uint8Array) => {
                const encryptedBlock = mergeUint8Arrays([blockKeys, buffer], blockKeys.length + buffer.length);
                const { data } = await decryptMessage({
                    message: await getMessage(encryptedBlock),
                    privateKeys: privateKey,
                    publicKeys: privateKey.toPublic(),
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

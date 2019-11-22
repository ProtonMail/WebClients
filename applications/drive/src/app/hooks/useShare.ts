import { getPromiseValue } from 'react-components/hooks/useCachedModelResult';
import { useCache, useApi } from 'react-components';
import { decryptUnsigned } from 'proton-shared/lib/keys/driveKeys';
import { decryptPrivateKeyArmored } from 'proton-shared/lib/keys/keys';
import { queryFolderChildren, queryGetFolder } from '../api/folder';
import { DriveLink, FolderMeta } from '../interfaces/folder';
import useDrive from './useDrive';

function useShare(shareId: string) {
    const api = useApi();
    const cache = useCache();
    const { getShareBootstrap } = useDrive();

    const getFolderMeta = async (linkId: string): Promise<{ Folder: FolderMeta; privateKey: any }> =>
        getPromiseValue(cache, `drive/shares/${shareId}/folder/${linkId}`, async () => {
            const { Folder } = await api(queryGetFolder(shareId, linkId));

            const { privateKey: parentKey } = Folder.ParentLinkID
                ? await getFolderMeta(Folder.ParentLinkID)
                : await getShareBootstrap(shareId);

            const decryptedFolderPassphrase = await decryptUnsigned({
                armoredMessage: Folder.Passphrase,
                privateKey: parentKey
            });
            const privateKey = await decryptPrivateKeyArmored(Folder.Key, decryptedFolderPassphrase);
            return { Folder, privateKey };
        });

    const getFolderContents = async (linkId: string): Promise<DriveLink[]> =>
        getPromiseValue(cache, `drive/shares/${shareId}/folder/${linkId}/children`, async () => {
            const { Links } = await api(queryFolderChildren(shareId, linkId));

            return await Promise.all(
                Links.map(async ({ Name, ParentLinkID, ...rest }: DriveLink) => {
                    const { privateKey } = await getFolderMeta(ParentLinkID);
                    return {
                        ...rest,
                        ParentLinkID,
                        Name: await decryptUnsigned({ armoredMessage: Name, privateKey })
                    };
                })
            );
        });

    return { getFolderContents, getFolderMeta };
}

export default useShare;

import { createContext, ReactNode, useContext, useEffect } from 'react';
import { useEncryptedSearch, useUser } from '@proton/components';
// import { ESEvent, ESItemEvent } from '@proton/shared/lib/interfaces';
// import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import {
    EncryptedSearchDB,
    EncryptedSearchFunctionsDrive,
    ESDriveSearchParams,
    ESFile,
    ESItemMetadataDrive,
    ESItemChangesDrive,
    getESHelpers,
    MetadataOptionsDrive,
    storeName,
    timeIndex,
} from '../helpers/encryptedSearchDriveHelpers';
import useDrive from '../hooks/drive/useDrive';
import { useDriveCache } from '../components/DriveCache/DriveCacheProvider';
// import useDriveEvents from '../hooks/drive/useDriveEvents';

const EncryptedSearchContext = createContext<EncryptedSearchFunctionsDrive>(null as any);
export const useEncryptedSearchContext = () => useContext(EncryptedSearchContext);

interface Props {
    children?: ReactNode;
}

const EncryptedSearchProvider = ({ children }: Props) => {
    const { getLinkMeta, fetchAllFolderPages } = useDrive();
    const [user] = useUser();
    const {
        get: { mainShares, childLinkMetas },
    } = useDriveCache();
    // const { listenForShareEvents } = useDriveEvents();
    // const shareIDs = shareIds();

    const esHelpers = getESHelpers({ getLinkMeta, user, mainShares, childLinkMetas, fetchAllFolderPages });

    const { dealWithEvent, initialiseES, ...esFunctions } = useEncryptedSearch<
        ESItemMetadataDrive,
        MetadataOptionsDrive,
        ESFile,
        EncryptedSearchDB,
        ESDriveSearchParams,
        ESItemChangesDrive
    >({
        storeName,
        timeIndex,
        refreshMask: 0,
        esHelpers,
    });

    useEffect(() => {
        /* TODO: this approach doesn't seem to work
        shareIDs.forEach((shareID) => {
            const share = shareMeta(shareID);
            if (!share) {
                return;
            }
            const { ShareID } = share;
            
            void listenForShareEvents(ShareID, (event) => {
                const Items: ESItemEvent<EncryptedSearchDB, ESItemChangesDrive>[] = [];
    
                event.Events.forEach(async (ev) => {
                    if (ev.Link) {
                        const linkMeta = await getLinkMeta(ShareID, ev.Link.LinkID);
                        Items.push({
                            ID: `${ShareID}:${linkMeta.LinkID}`,
                            Action: (ev.EventType as unknown) as EVENT_ACTIONS,
                            ItemEvent: {
                                newName: ev.Link.Name, // TODO: fix the fact that it could still be encrypted
                            },
                        });
                    }
                });

                if (Items.length) {
                    const esEvent: ESEvent<EncryptedSearchDB, ESItemChangesDrive> = {
                        EventID: (event as any).EventID,
                        Items,
                    }
                    void dealWithEvent(esEvent);
                }
            });
        });
        */
        void initialiseES();
    }, []);

    return <EncryptedSearchContext.Provider value={esFunctions}>{children}</EncryptedSearchContext.Provider>;
};

export default EncryptedSearchProvider;

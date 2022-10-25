import { encryptToDB, getES, openESDB, sizeOfESItem, updateSizeIDB } from '@proton/encrypted-search';
import { queryMessageMetadata } from '@proton/shared/lib/api/messages';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { Api } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { GetMessageKeys } from '../../hooks/message/useGetMessageKeys';
import { ESMessage, StoredCiphertext } from '../../models/encryptedSearch';
import { queryMessagesMetadata } from './esAPI';
import { fetchMessage, prepareCiphertext } from './esBuild';

export const checkIndexCorruption = async (userID: string, api: Api) => {
    const progress = getES.Progress(userID);
    if (progress) {
        // If we are still indexing, no recovery should happen
        return false;
    }

    // In order to establish whether IDB is limited or not, we check
    // whether the oldest message in the mailbox is contained. This
    // is not definitive, as there is the chance that the mistakenly
    // missing message (in case of a corrupted IDB) is precisely that
    // one. This possibility seems remote enough
    const {
        Messages: [mailboxOldestMessage],
    } = await api<{ Messages: Message[] }>({
        ...queryMessageMetadata({
            PageSize: 1,
            Limit: 1,
            Location: MAILBOX_LABEL_IDS.ALL_MAIL,
            Sort: 'Time',
            Desc: 0,
        }),
    });

    if (!mailboxOldestMessage) {
        return false;
    }

    const esDB = await openESDB(userID);

    const isDBLimited = (await esDB.count('messages', mailboxOldestMessage.ID)) === 0;

    // In order to establish whether IDB is corrupted or not, we check
    // whether the number of messages older than the most recent message is
    // the same in IDB and in the mailbox. Note that if IDB is also
    // limited, we need to set a lower bound on the messages' age
    // in order to count consistently
    const oldestMessage: StoredCiphertext | undefined = (await esDB.getAllFromIndex('messages', 'byTime', null, 1))[0];
    const mostRecentMessage: StoredCiphertext | undefined = (
        await esDB.transaction('messages').store.index('byTime').openCursor(null, 'prev')
    )?.value;

    if (!oldestMessage || !mostRecentMessage) {
        esDB.close();
        throw new Error('No message boundaries for recovery found');
    }

    const { Total } = await api<{ Total: number }>({
        ...queryMessageMetadata({
            Location: MAILBOX_LABEL_IDS.ALL_MAIL,
            End: mostRecentMessage.Time,
            EndID: mostRecentMessage.ID,
            Begin: isDBLimited ? oldestMessage.Time : undefined,
            BeginID: isDBLimited ? oldestMessage.ID : undefined,
        }),
    });

    const count = await esDB.count('messages');
    esDB.close();

    // Note that Total excludes the EndID message, therefore
    // we add back 1
    return Total + 1 !== count;
};

export const recoverIndex = async (userID: string, indexKey: CryptoKey, api: Api, getMessageKeys: GetMessageKeys) => {
    let result = await queryMessagesMetadata(api, {});
    if (!result) {
        throw new Error('Metadata could not be fetched');
    }
    let resultMetadata = result.Messages;

    const esDB = await openESDB(userID);

    while (resultMetadata.length) {
        await Promise.all(
            resultMetadata.map(async (metadata) => {
                if ((await esDB.count('messages', metadata.ID)) === 0) {
                    const itemToStore = await fetchMessage(metadata.ID, api, getMessageKeys);

                    // If something happens during fetching, we do not add anything, not
                    // even metadata, to the index. This way, a new recovery will be attempted
                    // on this same message
                    if (!itemToStore) {
                        return;
                    }

                    const ciphertext = await encryptToDB<ESMessage, StoredCiphertext>(
                        itemToStore,
                        indexKey,
                        prepareCiphertext
                    );

                    await esDB.put('messages', ciphertext);
                    updateSizeIDB(userID, sizeOfESItem(itemToStore));
                }
            })
        );

        const lastCheckedItem = resultMetadata[resultMetadata.length - 1];
        result = await queryMessagesMetadata(api, {
            EndID: lastCheckedItem.ID,
            End: lastCheckedItem.Time,
        });
        if (!result) {
            esDB.close();
            throw new Error('Metadata could not be fetched');
        }
        resultMetadata = result.Messages;
    }

    esDB.close();
};

import { fromUnixTime } from 'date-fns';
import { decryptMessageLegacy, encryptMessage } from 'pmcrypto';

import chunk from '@proton/utils/chunk';

import { getMessage, markAsBroken, queryMessageMetadata, updateBody } from '../../api/messages';
import { API_CODES, MINUTE, SECOND } from '../../constants';
import { wait } from '../../helpers/promise';
import { Api, SimpleMap } from '../../interfaces';
import { GetAddressKeys } from '../../interfaces/hooks/GetAddressKeys';
import {
    GetMessageResponse,
    MarkAsBrokenResponse,
    Message,
    QueryMessageMetadataResponse,
} from '../../interfaces/mail/Message';
import { getPrimaryKey, splitKeys } from '../../keys';

const LABEL_LEGACY_MESSAGE = '11';
const QUERY_LEGACY_MESSAGES_MAX_PAGESIZE = 150;
const LEGACY_MESSAGES_CHUNK_SIZE = 5; // How many messages we want to decrypt and encrypt simultaneously
const RELAX_TIME = 5 * SECOND; // 5s . Time to wait (for other operations) after a batch of legacy messages has been migrated
const MAX_RETRIES = 20; // Maximum number of retries allowed for the migration to restart after an unexpected error

enum MIGRATION_STATUS {
    NONE,
    SUCCESS,
    BROKEN,
    ERROR,
}

/**
 * Given a list of legacy message IDs, fetch, decrypt, re-encrypt and send them to API
 */
const migrateSingle = async ({
    id,
    api,
    getAddressKeys,
    statusMap,
}: {
    id: string;
    api: Api;
    getAddressKeys: GetAddressKeys;
    statusMap: SimpleMap<MIGRATION_STATUS>;
}) => {
    try {
        // Get message and private keys
        const { Message } = await api<GetMessageResponse>(getMessage(id));
        if (!Message) {
            throw new Error('Failed to get message');
        }
        const { ID, Time, Body, AddressID } = Message;
        const addressKeys = await getAddressKeys(AddressID);
        const { privateKeys } = splitKeys(addressKeys);
        const { publicKey: primaryPublicKey } = getPrimaryKey(addressKeys) || {};
        if (!primaryPublicKey) {
            throw new Error('Failed to decrypt primary address key');
        }

        // Decrypt message
        let newBody = '';
        try {
            let decryptionError: Error | undefined;
            // decryptMessageLegacy is not constant-time yet, force it by hand
            const [{ data: decryptedMessage }] = await Promise.all([
                decryptMessageLegacy({
                    message: Body,
                    messageDate: fromUnixTime(Time),
                    privateKeys,
                }).catch((error: any) => {
                    decryptionError = error instanceof Error ? error : new Error('Decryption failed');
                    return { data: '' };
                }),
                wait(SECOND),
            ]);
            if (decryptionError) {
                throw decryptionError;
            }
            // Re-encrypt message body. Use the primary key (first in the array) for re-encryption
            // We do not sign the message. Any original signature is lost
            const { data } = await encryptMessage({
                data: decryptedMessage,
                publicKeys: primaryPublicKey,
            });
            newBody = data;
        } catch {
            // mark as broken
            const { Code, Error: error } = await api<MarkAsBrokenResponse>(markAsBroken(id));
            if (error || Code !== API_CODES.SINGLE_SUCCESS) {
                throw new Error('Failed to mark message as broken');
            }
        }

        // Send re-encrypted message to API
        void (await api({
            ...updateBody(ID, { Body: newBody }),
            // lowest priority
            headers: { Priority: 'u=7' },
        }));
    } catch {
        statusMap[id] = MIGRATION_STATUS.ERROR;
    }
};

/**
 * Query all legacy messages
 */
const queryAllLegacyMessages = async (api: Api) => {
    const result: Message[] = [];
    let page = 0;

    while (true) {
        const { Messages = [] } = await api<QueryMessageMetadataResponse>({
            ...queryMessageMetadata({
                LabelID: [LABEL_LEGACY_MESSAGE],
                Page: page,
                PageSize: QUERY_LEGACY_MESSAGES_MAX_PAGESIZE,
            }),
            // lowest priority
            headers: { Priority: 'u=7' },
        });
        if (!Messages.length) {
            break;
        }
        result.push(...Messages);
        page++;
    }

    return result;
};

/**
 * Fetch legacy messages, re-encrypt and send them to API
 */
export const migrateAll = async ({
    api,
    getAddressKeys,
    retryNumber = 0,
    messageIDs,
}: {
    api: Api;
    getAddressKeys: GetAddressKeys;
    retryNumber?: number;
    messageIDs?: string[];
}): Promise<void> => {
    if (retryNumber > MAX_RETRIES) {
        // end the process
        return;
    }
    try {
        // fetch all legacy messages if no messageIDs were passed
        const ids = messageIDs || (await queryAllLegacyMessages(api)).map(({ ID }) => ID);
        if (!ids.length) {
            return;
        }
        const statusMap = ids.reduce<SimpleMap<MIGRATION_STATUS>>((acc, id) => {
            acc[id] = MIGRATION_STATUS.NONE;
            return acc;
        }, {});

        // proceed to migrate in batches of messages, waiting some time in between each batch,
        // we are not in a hurry and we don't want to burn the user's machine decrypting and re-encrypting
        const batches = chunk(Object.keys(statusMap), LEGACY_MESSAGES_CHUNK_SIZE);

        for (const batch of batches) {
            void (await Promise.all(
                batch.map((id) =>
                    migrateSingle({
                        id,
                        api,
                        getAddressKeys,
                        statusMap,
                    })
                )
            ));
            await wait(RELAX_TIME);
        }

        return await migrateAll({
            api,
            getAddressKeys,
            retryNumber: retryNumber + 1,
            messageIDs: Object.keys(statusMap).filter((id) => statusMap[id] === MIGRATION_STATUS.ERROR),
        });
    } catch {
        await wait(MINUTE);
        return migrateAll({ api, getAddressKeys, retryNumber: retryNumber + 1 });
    }
};

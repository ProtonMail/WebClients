import { fromUnixTime } from 'date-fns';

import { CryptoProxy, enums } from '@proton/crypto';
import chunk from '@proton/utils/chunk';

import { getMessage, markAsBroken, queryMessageMetadata, updateBody } from '../../api/messages';
import { API_CODES, MINUTE, SECOND } from '../../constants';
import { wait } from '../../helpers/promise';
import { Api, SimpleMap } from '../../interfaces';
import { GetAddressKeys } from '../../interfaces/hooks/GetAddressKeys';
import { GetMessageResponse, MarkAsBrokenResponse, QueryMessageMetadataResponse } from '../../interfaces/mail/Message';
import { getPrimaryKey, splitKeys } from '../../keys';

const LABEL_LEGACY_MESSAGE = '11';
const QUERY_LEGACY_MESSAGES_MAX_PAGESIZE = 150;
const LEGACY_MESSAGES_CHUNK_SIZE = 5; // How many messages we want to decrypt and encrypt simultaneously
const RELAX_TIME = 5 * SECOND; // 5s . Time to wait (for other operations) after a batch of legacy messages has been migrated
const MAX_RETRIES = 20; // Maximum number of retries allowed for the migration to restart after an unexpected error

// For constant-time decryption we need to specify which ciphers might have been used to encrypt the legacy message.
// It is likely that only AES was used, but we are not 100% certain, so we go all the way.
const SUPPORTED_CIPHERS: Set<enums.symmetric> = new Set([
    // idea = 1,
    2, // tripledes
    3, // cast5
    // blowfish = 4,
    7, // aes128
    8, // aes192
    9, // aes256
    // twofish = 10,
]);

enum MIGRATION_STATUS {
    NONE,
    SUCCESS,
    BROKEN,
    ERROR,
}

/**
 * Given a list of legacy message IDs, fetch, decrypt, re-encrypt and send them to API.
 * If decryption fails, mark the message as broken.
 */
export const migrateSingle = async ({
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

        let decryptedBody: string;
        try {
            const decryptionResult = await CryptoProxy.decryptMessageLegacy({
                armoredMessage: Body,
                messageDate: fromUnixTime(Time),
                decryptionKeys: privateKeys,
                config: {
                    constantTimePKCS1Decryption: true,
                    constantTimePKCS1DecryptionSupportedSymmetricAlgorithms: SUPPORTED_CIPHERS,
                },
            });

            // Simple sanity check to prevent migrating standard messages.
            // We cannot simply look at the armoring headers before decryption because the backend has marked messages as "legacy"
            // as long as they failed to parse, and we need to report them as "broken" if we fail to decrypt them
            if (decryptionResult.signatures.length > 0) {
                throw new Error('Legacy message expected');
            }

            decryptedBody = decryptionResult.data;
        } catch {
            // mark as broken
            const { Code, Error: error } = await api<MarkAsBrokenResponse>(markAsBroken(id));
            if (error || Code !== API_CODES.SINGLE_SUCCESS) {
                throw new Error('Failed to mark message as broken');
            }
            // nothing more to do
            return;
        }

        // Re-encrypt message body. Use the primary key (first in the array) for re-encryption
        // We cannot sign the message, since we cannot determine its authenticity. Any original signature is lost.
        const { message: newEncryptedBody } = await CryptoProxy.encryptMessage({
            textData: decryptedBody,
            encryptionKeys: primaryPublicKey,
        });

        // Send re-encrypted message to API
        await api({
            ...updateBody(ID, { Body: newEncryptedBody }),
            // lowest priority
            headers: { Priority: 'u=7' },
        });
    } catch {
        statusMap[id] = MIGRATION_STATUS.ERROR;
    }
};

/**
 * Re-encrypt the given legacy messages in batches, and send them to API
 */
export const migrateMultiple = async ({
    messageIDs: originalMessageIDs,
    api,
    getAddressKeys,
}: {
    messageIDs: string[];
    api: Api;
    getAddressKeys: GetAddressKeys;
}): Promise<void> => {
    let messageIDs = [...originalMessageIDs];

    for (let retryNumber = 0; retryNumber < MAX_RETRIES; retryNumber++) {
        const statusMap = messageIDs.reduce<SimpleMap<MIGRATION_STATUS>>((acc, id) => {
            acc[id] = MIGRATION_STATUS.NONE;
            return acc;
        }, {});

        // proceed to migrate in batches of messages, waiting some time in between each batch,
        // we are not in a hurry and we don't want to burn the user's machine decrypting and re-encrypting
        const batches = chunk(messageIDs, LEGACY_MESSAGES_CHUNK_SIZE);

        for (const batch of batches) {
            await Promise.all(
                batch.map((id) =>
                    migrateSingle({
                        id,
                        api,
                        getAddressKeys,
                        statusMap,
                    })
                )
            );
            await wait(RELAX_TIME);
        }

        messageIDs = messageIDs.filter((id) => statusMap[id] === MIGRATION_STATUS.ERROR);

        // no more messages to migrate
        if (!messageIDs.length) {
            return;
        }

        // if some messages failed to be migrated (most likely due to API reachability issues),
        // we wait before retrying
        await wait(MINUTE);
    }
};

/**
 * Fetch legacy message IDs from the API. This is only meant to be used as part of the migration.
 * @returns iterator-like object fetching a new page of results at every `next()` call.
 */
export const makeLegacyMessageIDsFetcher = (api: Api, pageSize = QUERY_LEGACY_MESSAGES_MAX_PAGESIZE) => {
    const pageIterator = {
        async next() {
            const { Messages = [] } = await api<QueryMessageMetadataResponse>({
                ...queryMessageMetadata({
                    LabelID: [LABEL_LEGACY_MESSAGE],
                    // we always fetch page 0 because we assume the returned message IDs are migrated
                    // between one `next()` call and the following one.
                    Page: 0,
                    PageSize: pageSize,
                }),
                // lowest priority
                headers: { Priority: 'u=7' },
            });

            if (Messages.length > 0) {
                return { value: Messages, done: false };
            }

            return { value: [], done: true };
        },
    };
    return pageIterator;
};

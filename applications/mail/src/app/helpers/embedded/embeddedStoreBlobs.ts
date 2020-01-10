import { Message } from '../../models/message';
import { isDraft } from '../message/messages';
import { getMessageCIDs } from './embeddedStoreCids';

export interface BlobInfo {
    url: string;
    isContentLocation: boolean;
}

const PREFIX_DRAFT = 'draft_';

const urlCreator = () => window.URL || window.webkitURL;

const Blobs: { [cid: string]: BlobInfo } = {};
const MAP_BLOBS: { [key: string]: string[] } = {};

const getHashKey = (msg: Message) => {
    const draft = isDraft(msg);
    const prefix = draft ? PREFIX_DRAFT : '';
    return `${prefix}${msg.ConversationID || msg.ID}`.trim();
};

/**
 * The URL.revokeObjectURL() static method releases an existing object URL
 * which was previously created by calling URL.createObjectURL().
 * Call this method when you've finished using a object URL, in order to let
 * the browser know it doesn't need to keep the reference to the file
 * any longer.
 */
function deallocateList(key: string) {
    const list = MAP_BLOBS[key] || [];
    list.forEach((cid) => {
        if (Blobs[cid]) {
            urlCreator().revokeObjectURL(Blobs[cid].url);
            // Remove the Blob ref from our store
            delete Blobs[cid];
        }
    });
    delete MAP_BLOBS[key];
}

/**
 * blob URLs never get deallocated automatically--
 * we manage deallocation to avoid a massive memory leak
 * once we navigate away from a conversation
 * eg. this can be triggered from the conversations controller
 */
export function deallocate(message: Message = {}) {
    const key = getHashKey(message);
    Object.keys(MAP_BLOBS)
        .filter((k) => k !== key && k.indexOf(PREFIX_DRAFT) !== 0) // Do nothing for draft and itself
        .forEach(deallocateList);
}

/**
 * Use the Blobs array to store CIDs url reference
 * once the attachment has been decrypted
 * so we can re-use the blob instead of decrypting
 * this should be rewritted a bit to work with
 * the service store
 */
export const store = (message: Message = {}, cid = '') => {
    const Attachments = getMessageCIDs(message);
    const { Headers = {} } = Attachments[cid] || {};

    const key = getHashKey(message);

    MAP_BLOBS[key] = MAP_BLOBS[key] || [];

    return (data: Uint8Array, MIME = '') => {
        // If you switch to another conversation the MAP_BLOBS won't exist anymore
        if (MAP_BLOBS[key]) {
            // Turn the decrypted attachment data into a blob.
            let blob: Blob | null = new Blob([data], { type: MIME });
            // Generate the URL
            let imageUrl: string | null = urlCreator().createObjectURL(blob);
            // Store the generated URL
            Blobs[cid] = {
                url: imageUrl,
                isContentLocation:
                    typeof Headers['content-location'] !== 'undefined' && typeof Headers['content-id'] === 'undefined'
            };
            // this is supposed to remove the blob so it
            // can be garbage collected. we dont save it (for now)
            blob = null;
            imageUrl = null;

            MAP_BLOBS[key].push(cid);
            // dispatcher.embeddedStore('store', { cid });
        }
    };
};

export const getBlob = (cid: string) => Blobs[cid] || {};

export const hasBlob = (cid: string) => !!Blobs[cid];

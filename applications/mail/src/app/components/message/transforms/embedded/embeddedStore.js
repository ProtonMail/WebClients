import { noop } from 'proton-shared/lib/helpers/function';
import * as embeddedUtils from './embeddedUtils';

const Blobs = {};
const MAP_BLOBS = {};
const CIDList = {};
// const { on, dispatcher } = dispatchers(['embeddedStore']);

const PREFIX_DRAFT = 'draft_';
const urlCreator = () => window.URL || window.webkitURL;

/**
 * When we close the composer we need to deallocate Blobs used by this composer
 */
// on('composer.update', (e, { type, data = {} }) => {
//     if (type === 'close') {
//         const { ID, ConversationID } = data.message;
//         const key = `${PREFIX_DRAFT}${ConversationID || ID}`;

//         // CLEAN ALL THE THINGS
//         if (CIDList[ID]) {
//             delete CIDList[ID];
//         }

//         // Clean these blobs !
//         if (MAP_BLOBS[key]) {
//             deallocateList(key);
//         }
//     }
// });

function getHashKey(msg) {
    const isDraft = msg.isDraft ? msg.isDraft() : false;
    const prefix = isDraft ? PREFIX_DRAFT : '';
    return `${prefix}${msg.ConversationID || msg.ID}`.trim();
}

/**
 * The URL.revokeObjectURL() static method releases an existing object URL
 * which was previously created by calling URL.createObjectURL().
 * Call this method when you've finished using a object URL, in order to let
 * the browser know it doesn't need to keep the reference to the file
 * any longer.
 * @param {key}  key     Key of the message/conversation
 */
function deallocateList(key) {
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
 * @param  {Object} message [description]
 * @return {[type]}         [description]
 */
export function deallocate(message = {}) {
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
export const store = (message = { isDraft: noop }, cid = '') => {
    const Attachments = CIDList[message.ID] || {};
    const { Headers = {} } = Attachments[cid] || {};

    const key = getHashKey(message);

    MAP_BLOBS[key] = MAP_BLOBS[key] || [];

    return (data, MIME) => {
        // If you switch to another conversation the MAP_BLOBS won't exist anymore
        if (MAP_BLOBS[key]) {
            // Turn the decrypted attachment data into a blob.
            let blob = new Blob([data], { type: MIME });
            // Generate the URL
            let imageUrl = urlCreator().createObjectURL(blob);
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

export const getBlob = (cid) => Blobs[cid] || {};
export const hasBlob = (cid) => !!Blobs[cid];

export const getMessageCIDs = ({ ID }) => CIDList[ID] || {};
export const containsMessageCIDs = ({ ID }) => Object.keys(CIDList[ID] || {}).length > 0;
export const addMessageCID = (message, { Headers = {}, Name = '' }) => {
    !CIDList[message.ID] && (CIDList[message.ID] = {});
    !message.NumEmbedded && (message.NumEmbedded = 0);

    const cid = embeddedUtils.readCID(Headers);
    Headers.embedded = 1;
    message.NumEmbedded++;
    CIDList[message.ID][cid] = { Headers, Name };
};

/**
 * Check if the cid exist for a specific message
 * @param {Resource} message
 * @param {String} cid
 * @return {Boolean}
 */
export const existMessageCID = (message, cid) => {
    return !!getMessageCIDs(message)[cid];
};

export const getBlobValue = (cid) => {
    const { url } = getBlob(cid);
    return embeddedUtils.getBlobFromURL(url);
};

export const cid = {
    contains: containsMessageCIDs,
    exist: existMessageCID,
    add: addMessageCID,
    get: getMessageCIDs
};

//     return {
//         store,
//         deallocate,
//         getBlob,
//         hasBlob,
//         getBlobValue,
//         cid: {
//             contains: containsMessageCIDs,
//             exist: existMessageCID,
//             add: addMessageCID,
//             get: getMessageCIDs
//         }
//     };

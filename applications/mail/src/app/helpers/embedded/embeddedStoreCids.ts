import { Message } from '../../models/message';
import { Attachment } from '../../models/attachment';
import { readCID } from './embeddedUtils';

const CIDList: { [ID: string]: { [cid: string]: Attachment } } = {};

export const getMessageCIDs = ({ ID = '' }: Message = {}) => CIDList[ID] || {};

export const containsMessageCIDs = ({ ID = '' }: Message = {}) => Object.keys(CIDList[ID] || {}).length > 0;

export const addMessageCID = ({ ID = '' }: Message, { Headers = {}, Name = '' }: Attachment) => {
    !CIDList[ID] && (CIDList[ID] = {});
    // !message.NumEmbedded && (message.NumEmbedded = 0);

    const cid = readCID(Headers);
    Headers.embedded = '1';
    // message.NumEmbedded++;
    CIDList[ID][cid] = { Headers, Name };
};

/**
 * Check if the cid exist for a specific message
 */
export const existMessageCID = (message: Message, cid: string) => {
    return !!getMessageCIDs(message)[cid];
};

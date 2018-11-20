import { MESSAGE_FLAGS } from '../app/constants';

import { normalizeEmail } from './string';

const { FLAG_RECEIVED, FLAG_SENT, FLAG_RECEIPT_REQUEST } = MESSAGE_FLAGS;

/**
 * Add flag to current one
 * @param {Integer} message.Flags bit map
 * @param {Integer} flag
 * @return {Integer}
 */
export function addFlag({ Flags = 0 } = {}, flag) {
    return Flags | flag;
}
/**
 * Remove flag from current one
 * @param {Integer} message.Flags bit map
 * @param {Integer} flag
 * @return {Integer}
 */
export function removeFlag({ Flags = 0 } = {}, flag) {
    if (Flags & flag) {
        return Flags - flag;
    }
    return Flags;
}

/**
 * Check if the message Object requires read receipt
 * @param {Integer} message.Flags bit map
 * @return {Boolean}
 */
export function requestReadReceipt({ Flags = 0 } = {}) {
    return Flags & FLAG_RECEIPT_REQUEST;
}

/**
 * Check if the message Object is a Draft
 * @param {Integer} message.Flags bit map
 * @return {Boolean}
 */
export function isDraft({ Flags = 0 } = {}) {
    return !(Flags & (FLAG_RECEIVED | FLAG_SENT));
}

/**
 * Extract recipients addresses from a message
 * @param {Array} message.ToList
 * @param {Array} message.CCList
 * @param {Array} message.BCCList
 * @return {Array<Object>}
 */
export function getRecipients({ ToList, CCList = [], BCCList = [] } = {}) {
    return ToList.concat(CCList, BCCList);
}

/**
 * Extract and normalize recipients
 * @param {Object} message
 * @return {Array<String>}
 */
export function normalizeRecipients(message = {}) {
    return getRecipients(message).map(({ Address }) => normalizeEmail(Address));
}

import { MESSAGE_FLAGS } from '../app/constants';

import { normalizeEmail } from './string';

const { FLAG_RECEIVED, FLAG_SENT } = MESSAGE_FLAGS;

/**
 * Check if the message Object is a Draft
 * @param {Integer} message.Flags bit map
 * @return {Boolean}
 */
export function isDraft({ Flags } = {}) {
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

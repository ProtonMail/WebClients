import { MESSAGE_FLAGS } from '../app/constants';

const { FLAG_RECEIVED, FLAG_SENT } = MESSAGE_FLAGS;

/**
 * Check if the message Object is a Draft
 * @param {Integer} message.Flags bit map
 * @return {Boolean}
 */
export function isDraft({ Flags } = {}) {
    return !(Flags & (FLAG_RECEIVED | FLAG_SENT));
}

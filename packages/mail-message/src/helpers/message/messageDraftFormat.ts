import { escape } from '@proton/sanitize/escape';
import type { Recipient } from '@proton/shared/lib/interfaces/Address';

/**
 * Format a recipient to the string that is displayed at the beginning of blockquotes
 * For HTML content, useHtmlEntities should be true
 */
export const formatRecipientsString = (recipient: Recipient[] = [], format: 'html' | 'plaintext') => {
    const isHTML = format === 'html';
    const escapeIfHTML = (value: string) => (isHTML ? escape(value) : value);

    return recipient
        .map((recipient) => {
            const name = recipient?.Name || recipient?.Address || '';
            const address = recipient?.Address || '';
            const [open, close] = isHTML ? ['&lt;', '&gt;'] : ['<', '>'];
            return `${escapeIfHTML(name)} ${open}${escapeIfHTML(address)}${close}`;
        })
        .join(', ');
};

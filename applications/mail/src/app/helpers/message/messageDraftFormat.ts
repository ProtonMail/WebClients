import type { Recipient } from '@proton/shared/lib/interfaces/Address';

/**
 * Format a recipient to the string that is displayed at the beginning of blockquotes
 * For HTML content, useHtmlEntities should be true
 */
export const formatRecipientsString = (recipient: Recipient[] = [], format: 'html' | 'plaintext') => {
    return recipient
        .map((recipient) => {
            const name = recipient?.Name || recipient?.Address;
            const address = recipient?.Address;
            const [open, close] = format === 'html' ? ['&lt;', '&gt;'] : ['<', '>'];
            return `${name} ${open}${address}${close}`;
        })
        .join(', ');
};

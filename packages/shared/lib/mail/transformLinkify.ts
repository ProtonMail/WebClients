import LinkifyIt from 'linkify-it';

import { getUTMTrackersFromURL } from '@proton/shared/lib/mail/trackers';
import { MessageUTMTracker } from '@proton/shared/lib/models/mailUtmTrackers';

const linkifyInstance = new LinkifyIt();

const htmlEntities = (str = '') => {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

/**
 * Convert plain text content with links to content with html links
 * Input : `hello http://www.protonmail.com`
 * Output : `hello <a target="_blank" rel="noreferrer nofollow noopener" href="http://protonmail.com">http://protonmail.com</a>`
 */
export const transformLinkify = ({
    content = '',
    target = '_blank',
    rel = 'noreferrer nofollow noopener',
    canCleanUTMTrackers = false,
    onCleanUTMTrackers,
}: {
    content?: string;
    target?: string;
    rel?: string;
    canCleanUTMTrackers?: boolean;
    onCleanUTMTrackers?: (utmTrackers: MessageUTMTracker[]) => void;
}) => {
    const matches = linkifyInstance.match(content);

    if (!matches) {
        return htmlEntities(content);
    }

    const utmTrackers: MessageUTMTracker[] = [];
    let last = 0;
    const result = matches.reduce<string[]>((result, match) => {
        if (last < match.index) {
            result.push(htmlEntities(content.slice(last, match.index)));
        }
        result.push(`<a target="${target}" rel="${rel}" href="`);

        const UTMTrackersResult = canCleanUTMTrackers ? getUTMTrackersFromURL(match.url) : undefined;
        // Clean trackers in plaintext messages
        if (UTMTrackersResult) {
            result.push(UTMTrackersResult.url);
            if (UTMTrackersResult.utmTracker) {
                utmTrackers.push(UTMTrackersResult.utmTracker);
            }
        } else {
            result.push(match.url);
        }

        result.push('">');
        result.push(match.text);
        result.push('</a>');

        last = match.lastIndex;

        return result;
    }, []);

    // Push all trackers found to mail redux store
    if (utmTrackers.length > 0) {
        onCleanUTMTrackers?.(utmTrackers);
    }

    if (last < content.length) {
        result.push(htmlEntities(content.slice(last)));
    }

    return result.join('');
};

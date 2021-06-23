import generateUID from 'proton-shared/lib/helpers/generateUID';
import { MailSettings } from 'proton-shared/lib/interfaces';
import { isDraft } from 'proton-shared/lib/mail/messages';
import { MessageExtended } from '../../models/message';
import { querySelectorAll } from '../message/messageContent';
import { hasShowRemote } from '../mailSettings';
import { getRemoteImages, insertImageAnchor } from '../message/messageImages';

const WHITELIST = ['notify@protonmail.com'];

export const ATTRIBUTES = ['url', 'xlink:href', 'srcset', 'src', 'svg', 'background', 'poster'];

const SELECTOR = ATTRIBUTES.map((name) => {
    if (name === 'src') {
        return '[proton-src]:not([proton-src^="cid"]):not([proton-src^="data"])';
    }

    // https://stackoverflow.com/questions/23034283/is-it-possible-to-use-htmls-queryselector-to-select-by-xlink-attribute-in-an
    if (name === 'xlink:href') {
        return '[*|href]:not([href])';
    }

    return `[proton-${name}]`;
}).join(',');

const removeProtonPrefix = (match: HTMLElement) => {
    ATTRIBUTES.forEach((attr) => {
        const protonAttr = `proton-${attr}`;
        if (match.hasAttribute(protonAttr)) {
            match.setAttribute(attr, match.getAttribute(protonAttr) as string);
            match.removeAttribute(attr);
        }
    });
};

export const transformRemote = (message: MessageExtended, mailSettings?: Partial<MailSettings>) => {
    const showRemoteImages =
        message.messageImages?.showRemoteImages ||
        hasShowRemote(mailSettings) ||
        WHITELIST.includes(message.data?.Sender?.Address || '');

    const draft = isDraft(message.data);

    const matches = querySelectorAll(message, SELECTOR);

    const hasRemoteImages = !!matches.length;

    const remoteImages = getRemoteImages(message);

    matches.forEach((match) => {
        if (showRemoteImages) {
            removeProtonPrefix(match);
        }
        if (match.tagName === 'IMG') {
            const id = generateUID('remote');
            if (!draft) {
                insertImageAnchor(id, 'remote', match);
            }
            remoteImages.push({
                type: 'remote',
                url: match.getAttribute('proton-src') || '',
                original: match,
                id,
            });
        }
    });

    return {
        document,
        showRemoteImages: hasRemoteImages ? showRemoteImages : undefined,
        remoteImages,
        hasRemoteImages,
    };
};

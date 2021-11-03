import generateUID from '@proton/shared/lib/helpers/generateUID';
import { Api, MailSettings } from '@proton/shared/lib/interfaces';
import { isDraft } from '@proton/shared/lib/mail/messages';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { IMAGE_PROXY_FLAGS } from '@proton/shared/lib/constants';
import { MessageExtended } from '../../models/message';
import { querySelectorAll } from '../message/messageContent';
import { hasShowRemote } from '../mailSettings';
import { getRemoteImages, insertImageAnchor } from '../message/messageImages';
import { MessageCache } from '../../containers/MessageProvider';
import { ATTRIBUTES, loadRemoteImages, removeProtonPrefix } from '../message/messageRemotes';

const WHITELIST = ['notify@protonmail.com'];

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

export const transformRemote = (
    message: MessageExtended,
    mailSettings: Partial<MailSettings> | undefined,
    api: Api,
    messageCache: MessageCache
) => {
    const showRemoteImages =
        message.messageImages?.showRemoteImages ||
        hasShowRemote(mailSettings) ||
        WHITELIST.includes(message.data?.Sender?.Address || '');

    const draft = isDraft(message.data);

    const useProxy = hasBit(mailSettings?.ImageProxy, IMAGE_PROXY_FLAGS.PROXY);

    const matches = querySelectorAll(message, SELECTOR);

    const hasRemoteImages = !!matches.length;

    const remoteImages = getRemoteImages(message);

    matches.forEach((match) => {
        const id = generateUID('remote');
        if (match.tagName === 'IMG') {
            if (draft) {
                removeProtonPrefix(match);
            } else {
                insertImageAnchor(id, 'remote', match);
            }
        }

        let url = '';
        ATTRIBUTES.find((attribute) => {
            url = match.getAttribute(`proton-${attribute}`) || '';
            return url && url !== '';
        });

        remoteImages.push({
            type: 'remote',
            url,
            original: match,
            id,
            tracker: undefined,
            status: 'not-loaded',
        });
    });

    if (showRemoteImages) {
        void loadRemoteImages(useProxy, message.localID, remoteImages, messageCache, api, message?.document);
    }

    return {
        document,
        showRemoteImages: hasRemoteImages ? showRemoteImages : undefined,
        remoteImages,
        hasRemoteImages,
    };
};

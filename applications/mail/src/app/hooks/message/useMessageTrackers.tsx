import { useEffect, useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { useMailSettings } from '@proton/components';
import { IMAGE_PROXY_FLAGS, SHOW_IMAGES } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';

import { locateBlockquote } from '../../helpers/message/messageBlockquote';
import { hasToSkipProxy } from '../../helpers/message/messageRemotes';
import { MessageState } from '../../logic/messages/messagesTypes';

export interface Tracker {
    name: string;
    urls: string[];
}

const getTrackers = (message: MessageState) => {
    const trackersImages = message.messageImages?.images.filter((image) => {
        return image.tracker;
    });

    const [content, blockquote] = locateBlockquote(message.messageDocument?.document);

    const trackers: Tracker[] = [];
    trackersImages?.forEach((trackerImage) => {
        const elExists = trackers.findIndex((tracker) => tracker.name === trackerImage.tracker);

        // Ignore trackers located in the blockquote
        if (
            (!content.includes(`data-proton-remote="${trackerImage.id}"`) &&
                blockquote.includes(`data-proton-remote="${trackerImage.id}"`)) ||
            (!content.includes(`data-proton-embedded="${trackerImage.id}"`) &&
                blockquote.includes(`data-proton-embedded="${trackerImage.id}"`))
        ) {
            return;
        }

        let url = '';
        if ('cloc' in trackerImage) {
            url = trackerImage.cloc;
        } else if ('originalURL' in trackerImage) {
            url = trackerImage.originalURL || '';
        }

        if (elExists < 0) {
            trackers.push({ name: trackerImage.tracker || '', urls: [url] });
        } else {
            const alreadyContainsURL = trackers[elExists].urls.includes(url);
            if (!alreadyContainsURL) {
                trackers[elExists] = { ...trackers[elExists], urls: [...trackers[elExists].urls, url] };
            }
        }
    });

    const numberOfTrackers = trackers.reduce((acc, tracker) => {
        return acc + tracker.urls.length;
    }, 0);

    return { trackers, numberOfTrackers };
};

interface Props {
    message: MessageState;
    isDetails?: boolean;
}

export const useMessageTrackers = ({ message, isDetails = false }: Props) => {
    const [mailSettings] = useMailSettings();
    const [title, setTitle] = useState<string>('');
    const [modalText, setModalText] = useState<string>('');

    const hasProtection = (mailSettings?.ImageProxy ? mailSettings.ImageProxy : 0) > IMAGE_PROXY_FLAGS.NONE;
    const hasShowImage = hasBit(mailSettings?.ShowImages ? mailSettings.ShowImages : 0, SHOW_IMAGES.REMOTE);

    const { trackers, numberOfTrackers } = useMemo(() => getTrackers(message), [message]);

    const hasFailLoadSomeImgThroughProxy =
        message.messageImages?.hasRemoteImages &&
        (message.messageImages.showRemoteImages || true) &&
        hasToSkipProxy(message.messageImages?.images);

    /*
     * If email protection is OFF and we do not load the image automatically, the user is aware about the need of protection.
     * From our side, we want to inform him that he can also turn on protection mode in the settings.
     */
    const needsMoreProtection = !hasProtection && !hasShowImage;

    useEffect(() => {
        let nextTitle;
        let nextModalText;

        if (needsMoreProtection) {
            nextTitle = c('Info').t`Email tracker protection is disabled`;
            nextModalText = c('Info')
                .t`Email trackers can violate your privacy. Turn on tracker protection to prevent senders from knowing whether and when you have opened a message.`;
        } else if (hasProtection && numberOfTrackers === 0) {
            nextTitle = hasFailLoadSomeImgThroughProxy
                ? c('Info').t`No trackers found, but some images could not be loaded with tracking protection`
                : c('Info').t`No email trackers found`;
            nextModalText = c('Info')
                .t`Email trackers can violate your privacy. Proton did not find any trackers on this message.`;
        } else {
            nextTitle = c('Info').ngettext(
                msgid`${numberOfTrackers} email tracker blocked`,
                `${numberOfTrackers} email trackers blocked`,
                numberOfTrackers
            );
            nextModalText = c('Info').ngettext(
                msgid`Email trackers can violate your privacy. Proton found and blocked ${numberOfTrackers} tracker.`,
                `Email trackers can violate your privacy. Proton found and blocked ${numberOfTrackers} trackers.`,
                numberOfTrackers
            );
        }

        if (nextTitle !== title || nextModalText !== modalText) {
            setTitle(nextTitle);
            setModalText(nextModalText);
        }
    }, [numberOfTrackers, needsMoreProtection, hasProtection, isDetails, hasFailLoadSomeImgThroughProxy]);

    return { hasProtection, hasShowImage, numberOfTrackers, needsMoreProtection, title, modalText, trackers };
};

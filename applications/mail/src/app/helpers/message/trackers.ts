import { c, msgid } from 'ttag';

import { Tracker } from '../../hooks/message/useMessageTrackers';
import { MessageState } from '../../logic/messages/messagesTypes';

export const getImageTrackersFromMessage = (message: MessageState) => {
    const trackersImages = message.messageImages?.images.filter((image) => {
        return image.tracker;
    });

    const trackers: Tracker[] = [];
    trackersImages?.forEach((trackerImage) => {
        const elExists = trackers.findIndex((tracker) => tracker.name === trackerImage.tracker);

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

export const getUTMTrackersFromMessage = (message: MessageState) => {
    return { trackers: message.messageUTMTrackers || [], numberOfTrackers: message.messageUTMTrackers?.length || 0 };
};

export const getImageTrackerText = (numberOfImageTrackers: number) => {
    if (numberOfImageTrackers === 0) {
        return c('Info').t`No trackers found`;
    }
    return c('Info').ngettext(
        msgid`${numberOfImageTrackers} tracker blocked`,
        `${numberOfImageTrackers} trackers blocked`,
        numberOfImageTrackers
    );
};

export const getUTMTrackerText = (numberOfUTMTrackers: number) => {
    if (numberOfUTMTrackers === 0) {
        return c('Info').t`No links cleaned`;
    }
    return c('Info').ngettext(
        msgid`${numberOfUTMTrackers} link cleaned`,
        `${numberOfUTMTrackers} links cleaned`,
        numberOfUTMTrackers
    );
};

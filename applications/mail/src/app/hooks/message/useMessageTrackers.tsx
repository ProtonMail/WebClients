import { useMemo } from 'react';

import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { IMAGE_PROXY_FLAGS } from '@proton/shared/lib/mail/mailSettings';

import useMailModel from 'proton-mail/hooks/useMailModel';

import {
    getImageTrackerText,
    getImageTrackersFromMessage,
    getUTMTrackerText,
    getUTMTrackersFromMessage,
} from '../../helpers/message/trackers';

export interface Tracker {
    name: string;
    urls: string[];
}

export const useMessageTrackers = (message: MessageState) => {
    const mailSettings = useMailModel('MailSettings');

    const hasProtection =
        (mailSettings.ImageProxy ? mailSettings.ImageProxy : IMAGE_PROXY_FLAGS.NONE) > IMAGE_PROXY_FLAGS.NONE;

    const { trackers: imageTrackers, numberOfTrackers: numberOfImageTrackers } = useMemo(
        () => getImageTrackersFromMessage(message),
        [message]
    );

    const imageTrackerText = useMemo(() => getImageTrackerText(numberOfImageTrackers), [numberOfImageTrackers]);

    const imageTrackersLoaded = useMemo(() => {
        return message.messageImages?.trackersStatus === 'loaded';
    }, [message.messageImages?.trackersStatus]);

    const { trackers: utmTrackers, numberOfTrackers: numberOfUTMTrackers } = getUTMTrackersFromMessage(message);

    const utmTrackerText = useMemo(() => getUTMTrackerText(numberOfUTMTrackers), [numberOfUTMTrackers]);

    return {
        // Image trackers
        numberOfImageTrackers,
        needsMoreProtection: !hasProtection,
        imageTrackerText,
        imageTrackers,
        imageTrackersLoaded,
        hasImageTrackers: numberOfImageTrackers > 0,

        // UTM trackers
        utmTrackers,
        numberOfUTMTrackers,
        utmTrackerText,
        hasUTMTrackers: numberOfUTMTrackers > 0,

        // Shared
        hasTrackers: numberOfImageTrackers + numberOfUTMTrackers > 0,
    };
};

import { useMemo } from 'react';

import { FeatureCode, useFeature, useMailSettings } from '@proton/components';
import { IMAGE_PROXY_FLAGS } from '@proton/shared/lib/constants';

import {
    getImageTrackerText,
    getImageTrackersFromMessage,
    getUTMTrackerText,
    getUTMTrackersFromMessage,
} from '../../helpers/message/trackers';
import { MessageState } from '../../logic/messages/messagesTypes';

export interface Tracker {
    name: string;
    urls: string[];
}

export const useMessageTrackers = (message: MessageState) => {
    const [mailSettings] = useMailSettings();
    const { feature } = useFeature(FeatureCode.CleanUTMTrackers);

    const hasProtection = (mailSettings?.ImageProxy ? mailSettings.ImageProxy : 0) > IMAGE_PROXY_FLAGS.NONE;

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
        canCleanUTMTrackers: !!feature?.Value,
        utmTrackers,
        numberOfUTMTrackers,
        utmTrackerText,
        hasUTMTrackers: numberOfUTMTrackers > 0,

        // Shared
        hasTrackers: numberOfImageTrackers + numberOfUTMTrackers > 0,
    };
};

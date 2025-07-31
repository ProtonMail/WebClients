import { useCallback } from 'react';

import { Room } from 'livekit-client';
import { c } from 'ttag';

import { qualityConstants } from '../qualityConstants';
import { QualityScenarios } from '../types';
import { getE2EEOptions } from '../utils/getE2EEOptions';
import { useMeetingSetup } from './srp/useMeetingSetup';
import { useQualityLevel } from './useQualityLevel';

const ROOM_KEY = process.env.LIVEKIT_ROOM_KEY as string;

export const useMeetingJoin = () => {
    const defaultQuality = useQualityLevel();

    const defaultResolution = qualityConstants[QualityScenarios.SmallView][defaultQuality];

    const { getAcccessDetails } = useMeetingSetup();

    const handleJoin = useCallback(
        async (participantName: string, meetingid: string) => {
            try {
                const e2eeOptions = await getE2EEOptions(ROOM_KEY);

                const room = new Room({
                    ...e2eeOptions,
                    videoCaptureDefaults: {
                        resolution: defaultResolution.resolution,
                    },
                    publishDefaults: {
                        videoEncoding: defaultResolution.encoding,
                    },
                });

                const { websocketUrl, accessToken } = await getAcccessDetails({
                    displayName: participantName,
                    token: meetingid,
                });

                await room.connect(websocketUrl, accessToken);

                return room;
            } catch (error) {
                console.error(error);
                throw new Error(c('l10n_nightly Error').t`Failed to join meeting`);
            }
        },
        [defaultResolution, getAcccessDetails]
    );

    return handleJoin;
};

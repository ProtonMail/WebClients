import { useCallback } from 'react';

import type { RoomOptions } from '@proton-meet/livekit-client';
import { type ExternalE2EEKeyProvider, Room } from '@proton-meet/livekit-client';
import { c } from 'ttag';

import { qualityConstants } from '../qualityConstants';
import { QualityScenarios } from '../types';
import { getE2EEOptions } from '../utils/getE2EEOptions';
import { useMeetingSetup } from './srp/useMeetingSetup';
import { useQualityLevel } from './useQualityLevel';

export const useMeetingJoin = () => {
    const defaultQuality = useQualityLevel();

    const defaultResolution = qualityConstants[QualityScenarios.SmallView][defaultQuality];

    const { getAcccessDetails } = useMeetingSetup();

    const handleJoin = useCallback(
        async ({
            participantName,
            meetingId,
            setupMls,
            setupKeyUpdate,
        }: {
            participantName: string;
            meetingId: string;
            setupMls?: (meetingId: string, accessToken: string) => Promise<{ key: string; epoch: bigint } | undefined>;
            setupKeyUpdate?: (keyProvider: ExternalE2EEKeyProvider) => Promise<void>;
        }) => {
            const STATIC_ROOM_KEY = process.env.LIVEKIT_ROOM_KEY as string;

            try {
                const { websocketUrl, accessToken } = await getAcccessDetails({
                    displayName: participantName,
                    token: meetingId,
                });

                let e2eeOptions: RoomOptions;

                if (setupMls) {
                    const { key: groupKey, epoch } = (await setupMls(meetingId, accessToken)) || {};

                    e2eeOptions = await getE2EEOptions(groupKey as string, epoch);
                } else {
                    e2eeOptions = await getE2EEOptions(STATIC_ROOM_KEY);
                }

                if (setupKeyUpdate) {
                    // @ts-ignore
                    await setupKeyUpdate(e2eeOptions.e2ee?.keyProvider as ExternalE2EEKeyProvider);
                }

                const room = new Room({
                    ...e2eeOptions,
                    videoCaptureDefaults: {
                        resolution: defaultResolution.resolution,
                    },
                    publishDefaults: {
                        videoEncoding: defaultResolution.encoding,
                    },
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

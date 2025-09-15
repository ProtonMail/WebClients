import type { ExternalE2EEKeyProvider } from '@proton-meet/livekit-client';
import { Room } from '@proton-meet/livekit-client';
import { MeetCoreErrorEnum } from '@proton-meet/proton-meet-core';
import { c } from 'ttag';

import { qualityConstants } from '../qualityConstants';
import { QualityScenarios } from '../types';
import { getE2EEOptions } from '../utils/getE2EEOptions';
import { useMeetingSetup } from './srp/useMeetingSetup';

export const useMeetingJoin = () => {
    const defaultResolution = qualityConstants[QualityScenarios.SmallView];

    const { getAccessDetails } = useMeetingSetup();

    const handleJoin = async ({
        participantName,
        meetingId,
        setupMls,
        setupKeyUpdate,
    }: {
        participantName: string;
        meetingId: string;
        setupMls: (meetingId: string, accessToken: string) => Promise<{ key: string; epoch: bigint } | undefined>;
        setupKeyUpdate?: (keyProvider: ExternalE2EEKeyProvider) => Promise<void>;
    }) => {
        try {
            const { websocketUrl, accessToken } = await getAccessDetails({
                displayName: participantName,
                token: meetingId,
            });

            const { key: groupKey, epoch } = (await setupMls(meetingId, accessToken)) || {};

            const e2eeOptions = await getE2EEOptions(groupKey as string, epoch);

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
        } catch (error: any) {
            switch (error) {
                // TODO: Show a custom error message to the user for each error
                case MeetCoreErrorEnum.MlsServerVersionNotSupported:
                    throw new Error(c('Error').t`This meeting is on an older version, the host must end it and refresh Meet to restart with the latest version.`);
                case MeetCoreErrorEnum.MaxRetriesReached:
                case MeetCoreErrorEnum.MlsGroupError:
                case MeetCoreErrorEnum.HttpClientError:
                default:
                    console.error(error);
                    throw new Error(c('Error').t`Failed to join meeting. Please try again later.`);
            }
        }
    };

    return handleJoin;
};

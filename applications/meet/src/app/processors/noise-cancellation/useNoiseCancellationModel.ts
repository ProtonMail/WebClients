import { useCallback, useEffect, useState } from 'react';

import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectKrispDebug } from '@proton/meet/store/slices/devToolsSlice';
import { useFlag } from '@proton/unleash/useFlag';

import { createDtlnModel } from './models/dtln';
import { createKrispModel } from './models/krisp';
import { nativeModel } from './models/native';
import type { NoiseCancellationModel } from './types';

/** Highest priority model that can run in the current browser and room. */
export const useNoiseCancellationModel = (): NoiseCancellationModel => {
    const room = useRoomContext();
    const isKrispDebugEnabled = useMeetSelector(selectKrispDebug);
    const isDtlnPerfMonitorEnabled = useFlag('MeetDtlnPerfMonitor');
    const { reportMeetError } = useMeetErrorReporting();

    const getNoiseCancellationModel = useCallback(() => {
        const candidates = [
            createKrispModel(room, isKrispDebugEnabled),
            createDtlnModel({ isDtlnPerfMonitorEnabled, reportError: reportMeetError }),
            nativeModel,
        ];
        return candidates.find((model) => model.isSupported()) ?? nativeModel;
    }, [room, isKrispDebugEnabled, isDtlnPerfMonitorEnabled, reportMeetError]);

    const [noiseCancellationModel, setNoiseCancellationModel] = useState<NoiseCancellationModel>(() =>
        getNoiseCancellationModel()
    );

    useEffect(() => {
        const handleConnected = () => {
            setNoiseCancellationModel(getNoiseCancellationModel());
        };

        room.on(RoomEvent.Connected, handleConnected);

        return () => {
            room.off(RoomEvent.Connected, handleConnected);
        };
    }, [getNoiseCancellationModel, room]);

    return noiseCancellationModel;
};

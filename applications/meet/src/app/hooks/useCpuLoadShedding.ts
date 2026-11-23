import { useEffect, useRef } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { LocalVideoTrack } from 'livekit-client';
import { ConnectionState } from 'livekit-client';

import { useMeetDispatch, useMeetStore } from '@proton/meet/store/hooks';
import {
    CPU_LOAD_DROPS_IN_APPLY_ORDER,
    resetCpuLoad,
    selectCpuLoadDropCount,
    selectIsCpuLoadDropActive,
    setCpuLoadDropCount,
} from '@proton/meet/store/slices/cpuLoadSlice';
import { meetingLogger } from '@proton/meet/utils/meetingLogger';
import { useFlag } from '@proton/unleash/useFlag';

import { useMediaManagementContext } from '../contexts/MediaManagementProvider/MediaManagementContext';
import { syncCameraPerformanceMode } from '../utils/cpuLoad/cameraPerformanceMode';
import type { CpuLoadStepperState } from '../utils/cpuLoad/cpuLoadStepper';
import { createCpuLoadStepperState, pauseCpuLoad, stepCpuLoad } from '../utils/cpuLoad/cpuLoadStepper';
import { createCpuPressureSignal } from '../utils/cpuLoad/cpuPressureSignal';
import { createLiveKitCpuConstraintSignal } from '../utils/cpuLoad/liveKitCpuConstraintSignal';

export const CPU_LOAD_TICK_MS = 5000;

export const useCpuLoadShedding = () => {
    const room = useRoomContext();
    const dispatch = useMeetDispatch();
    const store = useMeetStore();
    const isEnabled = useFlag('MeetCpuLoadShedding');
    const { republishCamera } = useMediaManagementContext();
    const prioritizedCameraTracks = useRef(new WeakSet<LocalVideoTrack>());

    useEffect(() => {
        const syncCamera = (isPrioritized: boolean) => {
            syncCameraPerformanceMode({
                room,
                isPrioritized,
                prioritizedTracks: prioritizedCameraTracks.current,
                republishCamera,
            }).catch((error) => {
                meetingLogger.error('[cpu-load] Failed to update the published camera layers', error);
            });
        };

        if (!isEnabled) {
            dispatch(resetCpuLoad());
            syncCamera(false);
            // A muted, reconnecting or busy camera cannot be republished yet
            const retryInterval = setInterval(() => syncCamera(false), CPU_LOAD_TICK_MS);
            return () => clearInterval(retryInterval);
        }

        const { localParticipant } = room;
        const cpuPressure = createCpuPressureSignal();
        const liveKitCpuConstraint = createLiveKitCpuConstraintSignal(localParticipant);
        let stepper: CpuLoadStepperState | null = null;

        const tick = () => {
            if (room.state === ConnectionState.Reconnecting || room.state === ConnectionState.SignalReconnecting) {
                stepper = stepper && pauseCpuLoad(stepper, Date.now());
                return;
            }
            if (room.state !== ConnectionState.Connected) {
                stepper = null;
                return;
            }
            void liveKitCpuConstraint.refresh();

            const now = Date.now();
            const previous = stepper ?? createCpuLoadStepperState(now, selectCpuLoadDropCount(store.getState()));
            stepper = stepCpuLoad(previous, {
                level: liveKitCpuConstraint.isCritical() ? 'critical' : cpuPressure.level(),
                now,
                maxDrops: CPU_LOAD_DROPS_IN_APPLY_ORDER.length,
            });

            if (stepper.dropCount !== previous.dropCount) {
                const isApplied = stepper.dropCount > previous.dropCount;
                const drop = CPU_LOAD_DROPS_IN_APPLY_ORDER[isApplied ? stepper.dropCount - 1 : stepper.dropCount];
                meetingLogger.info(
                    `[cpu-load] ${isApplied ? 'applied' : 'reverted'} ${drop}, drops=${stepper.dropCount}`
                );
                dispatch(setCpuLoadDropCount(stepper.dropCount));
            }
            // Every tick, so a camera published, unmuted or busy toggling since the last change catches up
            syncCamera(selectIsCpuLoadDropActive(store.getState(), 'publishedHighLayer'));
        };
        const interval = setInterval(tick, CPU_LOAD_TICK_MS);

        return () => {
            clearInterval(interval);
            cpuPressure.stop();
            liveKitCpuConstraint.stop();
        };
    }, [room, dispatch, store, isEnabled, republishCamera]);
};

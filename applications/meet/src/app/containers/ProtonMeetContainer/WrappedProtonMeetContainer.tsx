import { useEffect, useRef } from 'react';

import { RoomContext } from '@livekit/components-react';
import { ExternalE2EEKeyProvider, LogLevel, Room, setLogExtension } from '@proton-meet/livekit-client';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';

import { MediaManagementProvider } from '../../contexts/MediaManagementProvider';
import { qualityConstants } from '../../qualityConstants';
import { QualityScenarios } from '../../types';
import { ProtonMeetContainer } from './ProtonMeetContainer';

const defaultResolution = qualityConstants[QualityScenarios.SmallView];

const keyProvider = new ExternalE2EEKeyProvider();

const worker = new Worker(new URL('@proton-meet/livekit-client/e2ee-worker', import.meta.url));

export const WrappedProtonMeetContainer = ({ guestMode }: { guestMode?: boolean }) => {
    const roomRef = useRef<Room>();

    const reportMeetError = useMeetErrorReporting();

    const isLogExtensionSetup = useRef(false);

    // Set up logging in useEffect, not during render
    useEffect(() => {
        if (!isLogExtensionSetup.current) {
            isLogExtensionSetup.current = true;

            setLogExtension((level, msg, context) => {
                if (level === LogLevel.error) {
                    reportMeetError(`[LiveKit] ${msg}`, {
                        level: 'error',
                        extra: { context },
                    });
                } else if (level === LogLevel.warn) {
                    reportMeetError(`[LiveKit Warning] ${msg}`, {
                        level: 'warning',
                        extra: { context },
                    });
                }
            });
        }
    }, []);

    if (!roomRef.current) {
        roomRef.current = new Room({
            e2ee: {
                keyProvider,
                worker,
            },
            videoCaptureDefaults: {
                resolution: defaultResolution.resolution,
            },
            publishDefaults: {
                videoEncoding: defaultResolution.encoding,
            },
        });
    }

    return (
        <RoomContext.Provider value={roomRef.current}>
            <MediaManagementProvider>
                <ProtonMeetContainer guestMode={guestMode} room={roomRef.current} keyProvider={keyProvider} />
            </MediaManagementProvider>
        </RoomContext.Provider>
    );
};

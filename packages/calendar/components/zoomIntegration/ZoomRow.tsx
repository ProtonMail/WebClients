import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useOAuthToken } from '@proton/activation';
import { OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { Button, CircleLoader } from '@proton/atoms';
import { Icon, IconRow, ZoomUpsellModal, useApi, useModalStateObject } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { IcVideoCamera } from '@proton/icons';
import { createZoomMeeting } from '@proton/shared/lib/api/calendars';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import type { EventModel, VideoConferenceMeetingCreation } from '@proton/shared/lib/interfaces/calendar';
import clsx from '@proton/utils/clsx';

import { VideoConferencingWidget } from '../videoConferencing/VideoConferencingWidget';
import type { ZoomAccessLevel } from '../videoConferencing/constants';
import { VIDEO_CONF_API_ERROR_CODES, VIDEO_CONF_SERVICES } from '../videoConferencing/constants';
import { VideoConferenceZoomIntegration, useVideoConfTelemetry } from '../videoConferencing/useVideoConfTelemetry';
import { useZoomOAuth } from './useZoomOAuth';

type ZoomIntegrationState =
    | 'loadingConfig'
    | 'disconnected'
    | 'connected'
    | 'loading'
    | 'meeting-present'
    | 'meeting-deleted';

const getIcon = (state: ZoomIntegrationState) => {
    switch (state) {
        case 'disconnected':
        case 'connected':
        case 'meeting-deleted':
            return <span />;
        case 'meeting-present':
            return <IcVideoCamera />;
        case 'loading':
        case 'loadingConfig':
            return <CircleLoader className="color-primary h-4 w-4" />;
    }
};

interface Props {
    model: EventModel;
    setModel: (value: EventModel) => void;
    accessLevel: ZoomAccessLevel;
}

export const ZoomRow = ({ model, setModel, accessLevel }: Props) => {
    const [user] = useUser();

    const [oAuthToken, oauthTokenLoading] = useOAuthToken();
    const isUserConnectedToZoom = oAuthToken?.some(({ Provider }) => Provider === OAUTH_PROVIDER.ZOOM);

    const [processState, setProcessState] = useState<ZoomIntegrationState>('loading');

    const { sendEventVideoConferenceZoomIntegration } = useVideoConfTelemetry();

    const api = useApi();
    const [, withLoading] = useLoading();

    const { loadingConfig, triggerZoomOAuth } = useZoomOAuth();

    const zoomUpsellModal = useModalStateObject();

    useEffect(() => {
        if (loadingConfig || oauthTokenLoading) {
            setProcessState('loadingConfig');
        } else if (model.conferenceUrl && !model.isConferenceTmpDeleted) {
            setProcessState('meeting-present');
        } else {
            // We don't want to change the state while something is loading
            if (processState !== 'loading') {
                setProcessState(isUserConnectedToZoom ? 'connected' : 'disconnected');
            }
        }
    }, [loadingConfig, oauthTokenLoading]);

    useEffect(() => {
        if (model.conferenceUrl && !model.isConferenceTmpDeleted) {
            setProcessState('meeting-present');
        }
    }, [processState]);

    if (accessLevel === 'limited-access' && processState !== 'meeting-present') {
        // Paid MAIL users with setting disabled will have limited access only if meeting present
        return;
    }

    const createVideoConferenceMeeting = async (silentCall = false) => {
        try {
            setProcessState('loading');

            // We make the call silent when we assume the user should be able to create a meeting
            // This way we don't show an error if the request fails and open the oauth modal without the user knowing
            const data = await withLoading(
                api<VideoConferenceMeetingCreation>({ ...createZoomMeeting(), silence: silentCall })
            );

            setModel({
                ...model,
                conferenceId: data?.VideoConference?.ID,
                conferenceUrl: data?.VideoConference?.URL,
                conferencePassword: data?.VideoConference?.Password,
                conferenceHost: user.Email,
            });
            setProcessState('meeting-present');
            sendEventVideoConferenceZoomIntegration(VideoConferenceZoomIntegration.create_zoom_meeting);
        } catch (e) {
            const { code } = getApiError(e);
            sendEventVideoConferenceZoomIntegration(
                VideoConferenceZoomIntegration.create_zoom_meeting_failed,
                String(code)
            );

            if (code === VIDEO_CONF_API_ERROR_CODES.MEETING_PROVIDER_ERROR) {
                void triggerZoomOAuth(() => createVideoConferenceMeeting());
                return;
            }

            // In case of error, we reset the state of the button to connected
            setProcessState('connected');
        }
    };

    const handleClick = async () => {
        sendEventVideoConferenceZoomIntegration(VideoConferenceZoomIntegration.add_zoom_meeting_button);

        if (!user.hasPaidMail) {
            sendEventVideoConferenceZoomIntegration(VideoConferenceZoomIntegration.free_mail_users_upsell);
            zoomUpsellModal.openModal(true);
            return;
        }

        if (processState === 'disconnected') {
            sendEventVideoConferenceZoomIntegration(VideoConferenceZoomIntegration.oauth_modal_displayed);
            void triggerZoomOAuth(() => createVideoConferenceMeeting());
        } else if (model.conferenceUrl && model.isConferenceTmpDeleted) {
            setModel({
                ...model,
                isConferenceTmpDeleted: false,
            });
            setProcessState('meeting-present');
        } else {
            // We assume the user can create a meeting so we make a silent API call
            await createVideoConferenceMeeting(true);
        }
    };

    const handleDelete = async () => {
        setModel({
            ...model,
            isConferenceTmpDeleted: true,
        });
        setProcessState('meeting-deleted');
    };

    if (processState === 'meeting-present') {
        return (
            <div className="flex flex-nowrap justify-space-between items-start">
                <VideoConferencingWidget
                    location="event-form"
                    handleDelete={handleDelete}
                    data={{
                        service: VIDEO_CONF_SERVICES.ZOOM,
                        meetingId: model.conferenceId,
                        meetingUrl: model.conferenceUrl,
                        password: model.conferencePassword,
                        meetingHost: model.conferenceHost,
                    }}
                />
            </div>
        );
    }

    return (
        <>
            {zoomUpsellModal.render && <ZoomUpsellModal modalProps={zoomUpsellModal.modalProps} />}
            <IconRow
                icon={getIcon(processState)}
                labelClassName={clsx((processState === 'loadingConfig' || processState === 'loading') && 'my-auto p-0')}
            >
                {(processState === 'connected' ||
                    processState === 'disconnected' ||
                    processState === 'meeting-deleted') && (
                    <div className="flex items-center gap-1">
                        {(accessLevel === 'show-upsell' || accessLevel === 'full-access') && (
                            <Button
                                onClick={handleClick}
                                disabled={loadingConfig || oauthTokenLoading}
                                loading={loadingConfig || oauthTokenLoading}
                                shape="underline"
                                className="p-0"
                                color="norm"
                                size="small"
                            >
                                {c('Zoom integration').t`Add Zoom meeting`}
                            </Button>
                        )}
                        {!user.hasPaidMail && <Icon name="upgrade" className="color-primary" />}
                    </div>
                )}

                {(processState === 'loading' || processState === 'loadingConfig') && (
                    <Button disabled shape="ghost" className="p-0" color="norm" size="small">
                        {loadingConfig
                            ? c('Zoom integration').t`Loading Zoom configuration`
                            : c('Zoom integration').t`Adding conferencing details`}
                    </Button>
                )}
            </IconRow>
        </>
    );
};

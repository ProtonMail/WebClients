import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useOAuthToken } from '@proton/activation';
import { OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { Button, CircleLoader } from '@proton/atoms';
import { Icon, IconRow, ZoomUpsellModal, useApi, useModalStateObject, useNotifications } from '@proton/components';
import { IcVideoCamera } from '@proton/icons';
import { createZoomMeeting } from '@proton/shared/lib/api/calendars';
import { getApiError, getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { EventModel, VideoConferenceMeetingCreation } from '@proton/shared/lib/interfaces/calendar';
import clsx from '@proton/utils/clsx';

import { VideoConferencingWidget } from '../videoConferencing/VideoConferencingWidget';
import type { ZoomAccessLevel } from '../videoConferencing/constants';
import { VIDEO_CONF_API_ERROR_CODES, VIDEO_CONF_SERVICES } from '../videoConferencing/constants';
import { VideoConferenceZoomIntegration, useVideoConfTelemetry } from '../videoConferencing/useVideoConfTelemetry';
import { shouldReconnectToZoom, shouldSeeLoadingButton, shouldSeeLoginButton } from './ZoomRowHelpers';
import type { ZoomIntegrationState } from './interface';
import { useZoomOAuth } from './useZoomOAuth';

const getIcon = (state?: ZoomIntegrationState) => {
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

    return <span />;
};

interface Props {
    model: EventModel;
    setModel: (value: EventModel) => void;
    accessLevel: ZoomAccessLevel;
    onRowClick?: () => void;
    hasZoomError: boolean;
}

export const ZoomRow = ({ model, setModel, accessLevel, onRowClick, hasZoomError }: Props) => {
    const [user] = useUser();

    const [oAuthToken, oauthTokenLoading] = useOAuthToken();
    const isUserConnectedToZoom = oAuthToken?.some(({ Provider }) => Provider === OAUTH_PROVIDER.ZOOM);

    const [processState, setProcessState] = useState<ZoomIntegrationState | undefined>(undefined);

    const { sendEventVideoConferenceZoomIntegration } = useVideoConfTelemetry();

    const { loadingConfig, triggerZoomOAuth } = useZoomOAuth();
    const { createNotification } = useNotifications();

    const api = useApi();
    const silentApi = getSilentApi(api);

    const zoomUpsellModal = useModalStateObject();

    useEffect(() => {
        if (hasZoomError) {
            setProcessState('zoom-reconnection-error');
            return;
        }

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
    }, [loadingConfig, oauthTokenLoading, hasZoomError]);

    useEffect(() => {
        if (model.conferenceUrl && !model.isConferenceTmpDeleted && processState !== 'zoom-reconnection-error') {
            setProcessState('meeting-present');
        }
    }, [processState]);

    if (accessLevel === 'limited-access' && processState !== 'meeting-present') {
        // Paid MAIL users with setting disabled will have limited access only if meeting present
        return;
    }

    const createVideoConferenceMeeting = async () => {
        try {
            let currentProcessState = processState;
            setProcessState('loading');

            const data = await silentApi<VideoConferenceMeetingCreation>(createZoomMeeting());

            setModel({
                ...model,
                conferenceId: data?.VideoConference?.ID,
                conferenceUrl: data?.VideoConference?.URL,
                conferencePassword: data?.VideoConference?.Password,
                conferenceHost: user.Email,
            });

            if (currentProcessState !== 'zoom-reconnection-error') {
                setProcessState('meeting-present');
            }

            sendEventVideoConferenceZoomIntegration(VideoConferenceZoomIntegration.create_zoom_meeting);
        } catch (e) {
            const { code } = getApiError(e);
            sendEventVideoConferenceZoomIntegration(
                VideoConferenceZoomIntegration.create_zoom_meeting_failed,
                String(code)
            );

            if (code === VIDEO_CONF_API_ERROR_CODES.MEETING_PROVIDER_ERROR) {
                setProcessState('disconnected-error');
                return;
            } else {
                createNotification({
                    text: getApiErrorMessage(e) || c('Error').t`Failed to create meeting`,
                    type: 'error',
                });
            }

            // In case of error, we reset the state of the button to connected
            setProcessState('connected');
        }
    };

    const handleReconnect = (shouldCreateMeeting: boolean) => {
        sendEventVideoConferenceZoomIntegration(VideoConferenceZoomIntegration.oauth_modal_displayed);
        void triggerZoomOAuth(() => {
            if (shouldCreateMeeting) {
                void createVideoConferenceMeeting();
                setProcessState('meeting-present');
            } else {
                createNotification({
                    text: c('Error').t`You are reconnected to Zoom. You can save your event now.`,
                });
            }
        });
    };

    const handleClick = async () => {
        sendEventVideoConferenceZoomIntegration(VideoConferenceZoomIntegration.add_zoom_meeting_button);
        onRowClick?.();

        if (!user.hasPaidMail) {
            sendEventVideoConferenceZoomIntegration(VideoConferenceZoomIntegration.free_mail_users_upsell);
            zoomUpsellModal.openModal(true);
            return;
        }

        if (shouldReconnectToZoom(processState)) {
            handleReconnect(true);
        } else if (model.conferenceUrl && model.isConferenceTmpDeleted) {
            setModel({
                ...model,
                isConferenceTmpDeleted: false,
            });
            setProcessState('meeting-present');
        } else {
            await createVideoConferenceMeeting();
        }
    };

    const handleDelete = async () => {
        sendEventVideoConferenceZoomIntegration(VideoConferenceZoomIntegration.remove_zoom_meeting_button);

        setModel({
            ...model,
            isConferenceTmpDeleted: true,
        });
        setProcessState('meeting-deleted');
    };

    if (processState === 'zoom-reconnection-error') {
        return (
            <>
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
                        overrideJoinButton={
                            <Button
                                shape="solid"
                                color="norm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleReconnect(false);
                                }}
                            >
                                {c('Action').t`Reconnect to Zoom`}
                            </Button>
                        }
                    />
                </div>
                <IconRow
                    icon={<Icon name="exclamation-circle" className="color-danger" />}
                    containerClassName="grow"
                    labelClassName="my-auto p-0"
                    className="w-full"
                >
                    <Button color="danger" shape="underline" onClick={() => handleReconnect(false)}>
                        {c('Action').t`Reconnect to Zoom`}
                    </Button>
                </IconRow>
            </>
        );
    }

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
                labelClassName={clsx(shouldSeeLoadingButton(processState) && 'my-auto p-0')}
            >
                {shouldSeeLoginButton(processState) && (
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
                                {c('Action').t`Add Zoom meeting`}
                            </Button>
                        )}
                        {!user.hasPaidMail && <Icon name="upgrade" className="color-primary" />}
                    </div>
                )}

                {shouldSeeLoadingButton(processState) && (
                    <Button disabled shape="ghost" className="p-0" color="norm" size="small">
                        {loadingConfig
                            ? c('Action').t`Loading Zoom configuration`
                            : c('Action').t`Adding conferencing details`}
                    </Button>
                )}
            </IconRow>
        </>
    );
};

import { useRef, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useOAuthToken } from '@proton/activation/index';
import { OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { useApi, useModalStateObject, useNotifications } from '@proton/components';
import { createZoomMeeting } from '@proton/shared/lib/api/calendars';
import { getApiError, getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { VideoConferenceMeetingCreation } from '@proton/shared/lib/interfaces/calendar';
import { type EventModel, VIDEO_CONFERENCE_PROVIDER } from '@proton/shared/lib/interfaces/calendar';

import { VIDEO_CONF_API_ERROR_CODES } from '../videoConferencing/constants';
import { VideoConferenceZoomIntegration, useVideoConfTelemetry } from '../videoConferencing/useVideoConfTelemetry';
import { shouldReconnectToZoom } from './ZoomRowHelpers';
import type { ZoomIntegrationState } from './interface';
import { useZoomOAuth } from './useZoomOAuth';

interface UseZoomIntegrationParams {
    hasZoomError: boolean;
    model: EventModel;
    setModel: (model: EventModel) => void;
    onRowClick?: () => void;
    setActiveProvider: (provider: VIDEO_CONFERENCE_PROVIDER | null) => void;
}

export const useZoomIntegration = ({
    hasZoomError,
    model,
    setModel,
    onRowClick,
    setActiveProvider,
}: UseZoomIntegrationParams) => {
    const [user] = useUser();

    const [oAuthToken, oauthTokenLoading] = useOAuthToken();
    const isUserConnectedToZoom = oAuthToken?.some(({ Provider }) => Provider === OAUTH_PROVIDER.ZOOM);

    const { sentEventZoom } = useVideoConfTelemetry();

    const { loadingConfig, triggerZoomOAuth } = useZoomOAuth();
    const { createNotification } = useNotifications();

    const api = useApi();
    const silentApi = getSilentApi(api);

    const zoomUpsellModal = useModalStateObject();

    const [isLoading, setIsLoading] = useState(false);
    const [disconnectedError, setDisconnectedError] = useState(false);

    const zoomConferenceDetails = useRef<{
        conferenceId: string;
        conferenceUrl: string;
        conferencePassword: string | undefined;
    }>({
        conferenceId: '',
        conferenceUrl: '',
        conferencePassword: undefined,
    });

    const deriveProcessState = (): ZoomIntegrationState => {
        if (isLoading) {
            return 'loading';
        }

        if (hasZoomError) {
            return 'zoom-reconnection-error';
        }

        if (disconnectedError) {
            return 'disconnected-error';
        }

        if (loadingConfig || oauthTokenLoading) {
            return 'loadingConfig';
        }

        if (!isUserConnectedToZoom) {
            return 'disconnected';
        }

        if (model.conferenceUrl) {
            // In case of removing the meeting we actually keep it, but set a flag
            return model.isConferenceTmpDeleted ? 'meeting-deleted' : 'meeting-present';
        }

        return 'connected';
    };

    const derivedProcessState = deriveProcessState();

    const createVideoConferenceMeeting = async () => {
        try {
            setIsLoading(true);

            setActiveProvider(VIDEO_CONFERENCE_PROVIDER.ZOOM);

            const data = await silentApi<VideoConferenceMeetingCreation>(createZoomMeeting());

            zoomConferenceDetails.current = {
                conferenceId: data?.VideoConference?.ID,
                conferenceUrl: data?.VideoConference?.URL,
                conferencePassword: data?.VideoConference?.Password,
            };

            setModel({
                ...model,
                conferenceId: data?.VideoConference?.ID,
                conferenceUrl: data?.VideoConference?.URL,
                conferencePassword: data?.VideoConference?.Password,
                conferenceHost: user.Email,
                conferenceProvider: VIDEO_CONFERENCE_PROVIDER.ZOOM,
                isConferenceTmpDeleted: false,
            });

            setDisconnectedError(false);

            sentEventZoom(VideoConferenceZoomIntegration.create_zoom_meeting);
        } catch (e) {
            const { code } = getApiError(e);
            sentEventZoom(VideoConferenceZoomIntegration.create_zoom_meeting_failed, String(code));

            if (code === VIDEO_CONF_API_ERROR_CODES.MEETING_PROVIDER_ERROR) {
                setActiveProvider(null);
                setDisconnectedError(true);
                void triggerZoomOAuth(() => {
                    void createVideoConferenceMeeting();
                });
                return;
            } else {
                createNotification({
                    text: getApiErrorMessage(e) || c('Error').t`Failed to create meeting`,
                    type: 'error',
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleReconnect = (shouldCreateMeeting: boolean) => {
        sentEventZoom(VideoConferenceZoomIntegration.oauth_modal_displayed);
        void triggerZoomOAuth(() => {
            if (shouldCreateMeeting) {
                void createVideoConferenceMeeting();
            } else {
                setDisconnectedError(false);
                createNotification({
                    text: c('Error').t`You are reconnected to Zoom. You can save your event now.`,
                });
            }
        });
    };

    const handleClick = async () => {
        sentEventZoom(VideoConferenceZoomIntegration.add_zoom_meeting_button);
        onRowClick?.();

        if (!user.hasPaidMail) {
            sentEventZoom(VideoConferenceZoomIntegration.free_mail_users_upsell);
            zoomUpsellModal.openModal(true);
            return;
        }

        if (shouldReconnectToZoom(derivedProcessState)) {
            handleReconnect(true);
        } else if (model.isConferenceTmpDeleted && zoomConferenceDetails.current.conferenceUrl) {
            setActiveProvider(VIDEO_CONFERENCE_PROVIDER.ZOOM);
            setModel({
                ...model,
                conferenceId: zoomConferenceDetails.current.conferenceId,
                conferenceUrl: zoomConferenceDetails.current.conferenceUrl,
                conferencePassword: zoomConferenceDetails.current.conferencePassword,
                conferenceProvider: VIDEO_CONFERENCE_PROVIDER.ZOOM,
                isConferenceTmpDeleted: false,
            });
        } else {
            await createVideoConferenceMeeting();
        }
    };

    const handleDelete = async () => {
        sentEventZoom(VideoConferenceZoomIntegration.remove_zoom_meeting_button);

        setModel({
            ...model,
            isConferenceTmpDeleted: true,
        });
        setActiveProvider(null);
    };

    return {
        handleDelete,
        handleClick,
        handleReconnect,
        processState: derivedProcessState,
        zoomUpsellModal,
        loadingConfig,
        oauthTokenLoading,
    };
};

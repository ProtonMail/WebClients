import { useEffect, useState } from 'react';

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

    const [processState, setProcessState] = useState<ZoomIntegrationState | undefined>(undefined);

    const { sentEventZoom } = useVideoConfTelemetry();

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
                conferenceProvider: VIDEO_CONFERENCE_PROVIDER.ZOOM,
            });

            if (currentProcessState !== 'zoom-reconnection-error') {
                setProcessState('meeting-present');
            }

            sentEventZoom(VideoConferenceZoomIntegration.create_zoom_meeting);
        } catch (e) {
            const { code } = getApiError(e);
            sentEventZoom(VideoConferenceZoomIntegration.create_zoom_meeting_failed, String(code));

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
        sentEventZoom(VideoConferenceZoomIntegration.oauth_modal_displayed);
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
        sentEventZoom(VideoConferenceZoomIntegration.add_zoom_meeting_button);
        onRowClick?.();

        if (!user.hasPaidMail) {
            sentEventZoom(VideoConferenceZoomIntegration.free_mail_users_upsell);
            zoomUpsellModal.openModal(true);
            return;
        }

        if (shouldReconnectToZoom(processState)) {
            handleReconnect(true);
        } else if (model.conferenceUrl && model.isConferenceTmpDeleted) {
            setActiveProvider(VIDEO_CONFERENCE_PROVIDER.ZOOM);
            setModel({
                ...model,
                isConferenceTmpDeleted: false,
            });
            setProcessState('meeting-present');
        } else {
            setActiveProvider(VIDEO_CONFERENCE_PROVIDER.ZOOM);
            await createVideoConferenceMeeting();
        }
    };

    const handleDelete = async () => {
        sentEventZoom(VideoConferenceZoomIntegration.remove_zoom_meeting_button);

        setModel({
            ...model,
            isConferenceTmpDeleted: true,
        });
        setProcessState('meeting-deleted');
        setActiveProvider(null);
    };

    return {
        handleDelete,
        handleClick,
        handleReconnect,
        processState,
        zoomUpsellModal,
        loadingConfig,
        oauthTokenLoading,
    };
};

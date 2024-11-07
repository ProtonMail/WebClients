import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useOAuthToken } from '@proton/activation';
import { createToken } from '@proton/activation/src/api';
import useOAuthPopup from '@proton/activation/src/hooks/useOAuthPopup';
import type { OAuthProps } from '@proton/activation/src/interface';
import { EASY_SWITCH_SOURCES, ImportType, OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { oauthTokenActions } from '@proton/activation/src/logic/oauthToken';
import { Button, CircleLoader } from '@proton/atoms';
import { Icon, IconRow, ZoomUpsellModal, useApi, useModalStateObject } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { IcVideoCamera } from '@proton/icons';
import { useDispatch } from '@proton/redux-shared-store';
import { createZoomMeeting } from '@proton/shared/lib/api/calendars';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import type { EventModel, VideoConferenceMeetingCreation } from '@proton/shared/lib/interfaces/calendar';
import clsx from '@proton/utils/clsx';

import { VideoConferencingWidget } from '../videoConferencing/VideoConferencingWidget';
import { VIDEO_CONF_API_ERROR_CODES, VIDEO_CONF_SERVICES } from '../videoConferencing/constants';
import { VideoConferenceZoomIntegration, useVideoConfTelemetry } from '../videoConferencing/useVideoConfTelemetry';

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
}

export const ZoomRow = ({ model, setModel }: Props) => {
    const [user] = useUser();
    const dispatch = useDispatch();

    const [oAuthToken, oauthTokenLoading] = useOAuthToken();
    const isUserConnectedToZoom = oAuthToken?.some(({ Provider }) => Provider === OAUTH_PROVIDER.ZOOM);

    const [processState, setProcessState] = useState<ZoomIntegrationState>('loading');

    const { sendEventVideoConferenceZoomIntegration } = useVideoConfTelemetry();

    const api = useApi();
    const [, withLoading] = useLoading();
    const { triggerOAuthPopup, loadingConfig } = useOAuthPopup({
        errorMessage: c('Error').t`Failed to load oauth modal.`,
    });

    const zoomUpsellModal = useModalStateObject();

    useEffect(() => {
        if (loadingConfig || oauthTokenLoading) {
            setProcessState('loadingConfig');
        } else if (model.conferenceUrl && !model.isConferenceTmpDeleted) {
            setProcessState('meeting-present');
        } else {
            setProcessState(isUserConnectedToZoom ? 'connected' : 'disconnected');
        }
    }, [loadingConfig, oauthTokenLoading]);

    useEffect(() => {
        if (model.conferenceUrl && !model.isConferenceTmpDeleted) {
            setProcessState('meeting-present');
        }
    }, [processState]);

    const handleOAuthConnection = async (oAuthProps: OAuthProps) => {
        const { Code, Provider, RedirectUri } = oAuthProps;

        const tokens = await api(
            createToken({
                Provider,
                Code,
                RedirectUri,
                Source: EASY_SWITCH_SOURCES.CALENDAR_WEB_CREATE_EVENT,
                Products: [ImportType.CALENDAR],
            })
        );

        dispatch(oauthTokenActions.updateTokens(tokens.Tokens));
    };

    const createVideoConferenceMeeting = async () => {
        try {
            setProcessState('loading');
            const data = await withLoading(api<VideoConferenceMeetingCreation>(createZoomMeeting()));

            setModel({
                ...model,
                conferenceId: data?.VideoConference?.ID,
                conferenceUrl: data?.VideoConference?.URL,
                conferencePasscode: data?.VideoConference?.Password,
                conferenceHost: user.Email,
            });
            setProcessState('meeting-present');
            sendEventVideoConferenceZoomIntegration(VideoConferenceZoomIntegration.create_zoom_meeting);
        } catch (e) {
            const { code } = getApiError(e);
            sendEventVideoConferenceZoomIntegration(VideoConferenceZoomIntegration.create_zoom_meeting_failed, code);

            if (code === VIDEO_CONF_API_ERROR_CODES.MEETING_PROVIDER_ERROR) {
                setProcessState('disconnected');

                triggerOAuthPopup({
                    provider: OAUTH_PROVIDER.ZOOM,
                    scope: '',
                    callback: handleOAuthConnection,
                });

                return;
            }
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
            triggerOAuthPopup({
                provider: OAUTH_PROVIDER.ZOOM,
                scope: '',
                callback: async (oauthProps) => {
                    await handleOAuthConnection(oauthProps);
                    await createVideoConferenceMeeting();
                },
            });
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
                        password: model.conferencePasscode,
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

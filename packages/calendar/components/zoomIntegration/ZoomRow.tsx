import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useOAuthToken } from '@proton/activation';
import { createToken } from '@proton/activation/src/api';
import useOAuthPopup from '@proton/activation/src/hooks/useOAuthPopup';
import type { OAuthProps } from '@proton/activation/src/interface';
import { EASY_SWITCH_SOURCES, ImportType, OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { Button, CircleLoader } from '@proton/atoms';
import { Icon, IconRow, ZoomUpsellModal, useApi, useModalStateObject } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { IcVideoCamera } from '@proton/icons';
import { createZoomMeeting } from '@proton/shared/lib/api/calendars';
import type { EventModel, VideoConferenceMeetingCreation } from '@proton/shared/lib/interfaces/calendar';
import clsx from '@proton/utils/clsx';

import { VideoConferencingWidget } from '../videoConferencing/VideoConferencingWidget';
import { VIDEO_CONF_SERVICES } from '../videoConferencing/constants';

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
    const [oAuthToken, oauthTokenLoading] = useOAuthToken();
    const isUserConnectedToZoom = oAuthToken?.some(({ Provider }) => Provider === OAUTH_PROVIDER.ZOOM);

    const [processState, setProcessState] = useState<ZoomIntegrationState>('loadingConfig');

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

    const createVideoConferenceMeeting = async () => {
        setProcessState('loading');
        const data = await withLoading(api<VideoConferenceMeetingCreation>(createZoomMeeting()));

        setModel({
            ...model,
            conferenceId: data?.VideoConference?.ID,
            conferenceUrl: data?.VideoConference?.URL,
            conferencePasscode: data?.VideoConference?.Password,
            conferenceCreator: user.ID,
            conferenceHost: user.Email,
        });
        setProcessState('meeting-present');
    };

    const handleOAuthConnection = async (oAuthProps: OAuthProps) => {
        const { Code, Provider, RedirectUri } = oAuthProps;

        await api(
            createToken({
                Provider,
                Code,
                RedirectUri,
                Source: EASY_SWITCH_SOURCES.CALENDAR_WEB_CREATE_EVENT,
                Products: [ImportType.CALENDAR],
            })
        );
        await createVideoConferenceMeeting();
    };

    const handleClick = async () => {
        if (!user.hasPaidMail) {
            zoomUpsellModal.openModal(true);
            return;
        }

        if (processState === 'disconnected') {
            triggerOAuthPopup({
                provider: OAUTH_PROVIDER.ZOOM,
                scope: '',
                callback: handleOAuthConnection,
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
                    location="calendar"
                    data={{
                        service: VIDEO_CONF_SERVICES.ZOOM,
                        meetingId: model.conferenceId,
                        meetingUrl: model.conferenceUrl,
                        password: model.conferencePasscode,
                    }}
                />
                {processState === 'meeting-present' && (
                    <Button
                        icon
                        shape="ghost"
                        size="small"
                        className="flex items-start shrink-0"
                        onClick={handleDelete}
                    >
                        <Icon name="cross-big" alt={c('Action').t`Remove zoom meeting`} />
                    </Button>
                )}
            </div>
        );
    }

    return (
        <>
            {zoomUpsellModal.render && <ZoomUpsellModal modalProps={zoomUpsellModal.modalProps} />}
            <IconRow icon={getIcon(processState)} labelClassName={clsx(processState === 'loading' && 'my-auto p-0')}>
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

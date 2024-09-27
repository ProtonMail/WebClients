import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button, CircleLoader } from '@proton/atoms';
import { Icon, IconRow, useApi } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { createZoomMeeting } from '@proton/shared/lib/api/calendars';
import type { EventModel, VideoConferenceMeetingCreation } from '@proton/shared/lib/interfaces/calendar';
import zoomLogo from '@proton/styles/assets/img/video-conferencing/zoom.svg';
import clsx from '@proton/utils/clsx';

import { VideoConferencingWidget } from '../videoConferencing/VideoConferencingWidget';
import { VIDEO_CONF_SERVICES } from '../videoConferencing/constants';

type ZoomIntegrationState = 'disconnected' | 'connected' | 'loading' | 'meeting-present';

const getIcon = (state: ZoomIntegrationState) => {
    switch (state) {
        case 'disconnected':
        case 'connected':
            return <img src={zoomLogo} className="h-6 w-6 hidden" alt="" />;
        case 'meeting-present':
            return <img src={zoomLogo} className="h-6 w-6" alt="" />;
        case 'loading':
            return <CircleLoader className="color-primary h-4 w-4" />;
    }
};

interface Props {
    model: EventModel;
    setModel: (value: EventModel) => void;
}

export const ZoomRow = ({ model, setModel }: Props) => {
    const [user] = useUser();
    const [processState, setProcessState] = useState<ZoomIntegrationState>('disconnected');

    const api = useApi();
    const [, withLoading] = useLoading();

    useEffect(() => {
        if (model.conferenceUrl) {
            setProcessState('meeting-present');
        }
    }, []);

    const handleClick = async () => {
        if (user.isFree) {
            // TODO display upsell for Zoom, will be done in a separate MR
            alert('Display upsell for zoom');
            return;
        }

        if (processState === 'disconnected') {
            // TODO open OAuth window
        }

        setProcessState('loading');
        const data = await withLoading(api<VideoConferenceMeetingCreation>(createZoomMeeting()));

        setModel({
            ...model,
            conferenceId: data?.VideoConference?.ID,
            conferenceUrl: data?.VideoConference?.URL,
            conferencePasscode: data?.VideoConference?.Password,
            conferenceCreator: user.ID,
        });
        setProcessState('meeting-present');
    };

    if (processState === 'meeting-present') {
        return (
            <VideoConferencingWidget
                location="calendar"
                data={{
                    service: VIDEO_CONF_SERVICES.ZOOM,
                    meetingId: model.conferenceId,
                    meetingUrl: model.conferenceUrl,
                    password: model.conferencePasscode,
                }}
            />
        );
    }

    return (
        <IconRow icon={getIcon(processState)} labelClassName={clsx(processState === 'loading' && 'my-auto p-0')}>
            {(processState === 'connected' || processState === 'disconnected') && (
                <div className="flex items-center gap-1">
                    <Button onClick={handleClick} shape="underline" className="p-0" color="norm" size="small">
                        {c('Zoom integration').t`Add Zoom meeting`}
                    </Button>
                    {user.isFree && <Icon name="upgrade" className="color-primary" />}
                </div>
            )}

            {processState === 'loading' && (
                <Button disabled shape="ghost" className="p-0" color="norm" size="small">{c('Zoom integration')
                    .t`Adding conferencing details`}</Button>
            )}
        </IconRow>
    );
};

import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import type { ModalStateReturnObj } from '@proton/components';
import { Icon, IconRow } from '@proton/components';
import { IcVideoCamera } from '@proton/icons';
import type { EventModel } from '@proton/shared/lib/interfaces/calendar';
import clsx from '@proton/utils/clsx';

import { VideoConferencingWidget } from '../videoConferencing/VideoConferencingWidget';
import type { ZoomAccessLevel } from '../videoConferencing/constants';
import { VIDEO_CONF_SERVICES } from '../videoConferencing/constants';
import { shouldSeeLoadingButton } from './ZoomRowHelpers';
import type { ZoomIntegrationState } from './interface';

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
    processState?: ZoomIntegrationState;
    handleDelete: () => void;
    handleReconnect: (shouldCreateMeeting: boolean) => void;
    zoomUpsellModal: ModalStateReturnObj;
    handleClick: () => void;
    loadingConfig: boolean;
    oauthTokenLoading: boolean;
}

export const ZoomRow = ({ model, accessLevel, processState, handleDelete, handleReconnect, loadingConfig }: Props) => {
    if (accessLevel === 'limited-access' && processState !== 'meeting-present') {
        // Paid MAIL users with setting disabled will have limited access only if meeting present
        return;
    }

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
            <IconRow
                icon={getIcon(processState)}
                labelClassName={clsx(shouldSeeLoadingButton(processState) && 'my-auto p-0')}
                title={c('Label').t`Video conference`}
            >
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

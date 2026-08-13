import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import IconRow from '@proton/components/components/iconRow/IconRow';
import { IcVideoCamera } from '@proton/icons/icons/IcVideoCamera';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import type { EventModel } from '@proton/shared/lib/interfaces/calendar/Event';

import { ProtonMeetMeetingDetails } from './ProtonMeetMeetingDetails';
import type { IntegrationState } from './types';

const getIcon = (state?: IntegrationState) => {
    if (state === 'meeting-present') {
        return <IcVideoCamera />;
    }

    if (state === 'loading') {
        return <CircleLoader className="color-primary h-4 w-4" />;
    }

    return <span />;
};

interface ProtonMeetRowProps {
    model: EventModel;
    processState?: IntegrationState;
    createVideoConferenceMeeting: () => Promise<void>;
    deleteProtonMeet: () => void;
}

export const ProtonMeetRow = ({
    model,
    processState,
    createVideoConferenceMeeting,
    deleteProtonMeet,
}: ProtonMeetRowProps) => {
    if (processState === 'meeting-present') {
        return <ProtonMeetMeetingDetails model={model} deleteMeeting={deleteProtonMeet} />;
    }

    return (
        <IconRow icon={getIcon(processState)} labelClassName={'my-auto p-0'} title={c('Label').t`Video conference`}>
            {processState === 'loading' ? (
                <Button disabled shape="ghost" className="p-0" color="norm" size="small">
                    {c('Action').t`Adding conferencing details`}
                </Button>
            ) : (
                <div className="flex items-center gap-1">
                    <Button
                        onClick={createVideoConferenceMeeting}
                        disabled={false}
                        loading={false}
                        shape="underline"
                        className="p-0"
                        color="norm"
                        size="small"
                    >
                        {c('Action').t`Join with ${MEET_APP_NAME}`}
                    </Button>
                </div>
            )}
        </IconRow>
    );
};

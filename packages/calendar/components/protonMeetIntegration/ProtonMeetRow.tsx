import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import IconRow from '@proton/components/components/iconRow/IconRow';
import { IcVideoCamera } from '@proton/icons';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';
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
    handlePassphraseSave: (passphrase: string) => Promise<void>;
    createVideoConferenceMeeting: () => Promise<void>;
    deleteProtonMeet: () => void;
    meetingObject: Meeting | null;
    meetingDetails: {
        id: string;
        passwordBase: string;
        passphrase: string;
        failed: boolean;
        hidePassphrase: boolean;
    };
    setup: () => Promise<void>;
}

export const ProtonMeetRow = ({
    model,
    processState,
    handlePassphraseSave,
    createVideoConferenceMeeting,
    meetingDetails,
    deleteProtonMeet,
    setup,
}: ProtonMeetRowProps) => {
    if (processState === 'meeting-present') {
        return (
            <ProtonMeetMeetingDetails
                passphrase={meetingDetails.passphrase}
                model={model}
                savePassphrase={handlePassphraseSave}
                deleteMeeting={deleteProtonMeet}
                refetchMeeting={setup}
                fetchingDetailsFailed={meetingDetails.failed}
                hidePassphrase={meetingDetails.hidePassphrase || !meetingDetails.id}
            />
        );
    }

    return (
        <IconRow icon={getIcon(processState)} labelClassName={'my-auto p-0'}>
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

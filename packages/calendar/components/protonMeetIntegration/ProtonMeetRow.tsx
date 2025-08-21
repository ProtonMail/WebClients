import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import IconRow from '@proton/components/components/iconRow/IconRow';
import { IcVideoCamera } from '@proton/icons';
import { type Meeting } from '@proton/meet';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import { type EventModel } from '@proton/shared/lib/interfaces/calendar/Event';

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
    setModel: (value: EventModel) => void;
    processState?: IntegrationState;
    resetProcessState: () => void;
    handlePassphraseSave: (passphrase: string) => Promise<void>;
    createVideoConferenceMeeting: () => Promise<void>;
    deleteProtonMeet: (meetingId: string) => Promise<true | undefined>;
    meetingObject: Meeting | null;
    meetingDetails: {
        id: string;
        passwordBase: string;
        passphrase: string;
    };
}

export const ProtonMeetRow = ({
    model,
    setModel,
    processState,
    resetProcessState,
    handlePassphraseSave,
    createVideoConferenceMeeting,
    deleteProtonMeet,
    meetingObject,
    meetingDetails,
}: ProtonMeetRowProps) => {
    if (processState === 'meeting-present') {
        return (
            <ProtonMeetMeetingDetails
                passphrase={meetingDetails.passphrase}
                model={model}
                savePassphrase={handlePassphraseSave}
                deleteMeeting={() => {
                    setModel({
                        ...model,
                        conferenceId: '',
                        conferenceUrl: '',
                        conferenceHost: '',
                        conferenceProvider: undefined,
                        isConferenceTmpDeleted: true,
                    });

                    void deleteProtonMeet(meetingObject?.ID as string);

                    resetProcessState();
                }}
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

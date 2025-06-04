import { useState } from 'react';

import { Button } from '@proton/atoms';
import { InputFieldStacked, InputFieldStackedGroup, InputFieldTwo } from '@proton/components';

import './PreJoinDetails.scss';

interface PreJoinDetailsProps {
    defaultMeetingLink: string;
    displayName: string;
    onDisplayNameChange: (displayName: string) => void;
    onJoinMeeting: ({ meetingLink, displayName }: { meetingLink: string; displayName: string }) => void;
}

export const PreJoinDetails = ({
    defaultMeetingLink,
    displayName,
    onDisplayNameChange,
    onJoinMeeting,
}: PreJoinDetailsProps) => {
    const [meetingLink, setMeetingLink] = useState(defaultMeetingLink);

    return (
        <div className="flex flex-nowrap flex-column gap-4 w-custom" style={{ '--w-custom': '22.625rem' }}>
            <h1 className="h2 text-center">Join Meeting</h1>
            <p className="text-center color-weak">
                Our end‑to‑end encrypted meeting app gives communication privacy and freedom to all.
            </p>
            <InputFieldStackedGroup classname="mb-4 w-full">
                <InputFieldStacked isGroupElement>
                    <InputFieldTwo
                        label="Meeting link"
                        type="text"
                        unstyled
                        inputClassName="rounded-none"
                        value={meetingLink}
                        onChange={(e) => setMeetingLink(e.target.value)}
                    />
                </InputFieldStacked>
                <InputFieldStacked isGroupElement>
                    <InputFieldTwo
                        label="Display name"
                        type="text"
                        unstyled
                        inputClassName="rounded-none"
                        value={displayName}
                        onChange={(e) => onDisplayNameChange(e.target.value)}
                    />
                </InputFieldStacked>
            </InputFieldStackedGroup>
            <Button
                className="p-5 rounded-full"
                color="norm"
                size="large"
                fullWidth
                onClick={() => onJoinMeeting({ meetingLink, displayName })}
                disabled={!meetingLink || !displayName}
            >
                Ask to join
            </Button>
        </div>
    );
};

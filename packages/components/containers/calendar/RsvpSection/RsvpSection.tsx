import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import TextAreaTwo from '@proton/components/components/v2/input/TextArea';
import { ATTENDEE_COMMENT_TYPE, ICAL_ATTENDEE_STATUS } from '@proton/shared/lib/calendar/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { AttendeeComment, PartstatData } from '@proton/shared/lib/interfaces/calendar';
import clsx from '@proton/utils/clsx';

import CalendarInviteButtons from '../CalendarInviteButtons';

interface Props {
    handleChangePartstat: (partstatData: PartstatData, save: boolean) => Promise<void>;
    userPartstat: ICAL_ATTENDEE_STATUS;
    userComment?: AttendeeComment;
    disabled: boolean;
}

const RsvpSection = ({ handleChangePartstat, userPartstat, userComment, disabled }: Props) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [model, setModel] = useState<PartstatData>({
        Status: userPartstat,
        Comment: userComment,
    });

    const handleResponse = (status: ICAL_ATTENDEE_STATUS) => {
        if (isExpanded) {
            // record temp selection
            // send on button click alogn with the note
            setModel({
                ...model,
                Status: status,
            });
        }

        return handleChangePartstat(
            {
                ...model,
                Status: status,
            },
            !isExpanded
        );
    };

    const handleNote = (note: string) => {
        setModel({
            ...model,
            Comment: { Message: note, Type: ATTENDEE_COMMENT_TYPE.CLEAR }, // todo enctypted?
        });
    };

    const handleSend = () => {
        // send response & comment
        return handleChangePartstat(model, true);
    };

    const handleCancel = () => {
        // reset model
        setModel({
            Status: userPartstat,
            Comment: userComment,
        });
        setIsExpanded(!isExpanded);
    };

    const cancelButton = <Button shape="ghost" onClick={handleCancel}>{c('Action').t`Cancel`}</Button>;

    const sendButton = (
        <Button color="norm" onClick={handleSend} disabled={isExpanded && !model.Comment}>{c('Action').t`Send`}</Button>
    );

    return (
        <ModalTwoFooter>
            <div className={clsx('flex')}>
                <div className="flex flex-auto items-start md:items-center justify-space-between gap-4 flex-column md:flex-row">
                    <strong>{c('Calendar invite buttons label').t`Attending?`}</strong>
                    <CalendarInviteButtons
                        actions={{
                            accept: () => handleResponse(ICAL_ATTENDEE_STATUS.ACCEPTED),
                            acceptTentatively: () => handleResponse(ICAL_ATTENDEE_STATUS.TENTATIVE),
                            decline: () => handleResponse(ICAL_ATTENDEE_STATUS.DECLINED),
                            retryCreateEvent: () => wait(0),
                            retryUpdateEvent: () => wait(0),
                        }}
                        partstat={userPartstat}
                        disabled={disabled}
                    />
                </div>
                {!isExpanded && (
                    <Button
                        className="flex flex-auto justify-end text-small color-weak"
                        shape="underline"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {c('Action').t`Reply with a note`}
                    </Button>
                )}
                {isExpanded && (
                    <InputFieldTwo
                        className="mt-4"
                        assistContainerClassName="m-0"
                        id="rsvp-modal"
                        as={TextAreaTwo}
                        rows={5}
                        placeholder={c('Placeholder').t`Leave a note for all participants`}
                        value={model.Comment?.Message}
                        onValue={handleNote}
                    />
                )}
                {isExpanded && (
                    <div className="gap-4 flex flex-auto justify-end">
                        {cancelButton}
                        {sendButton}
                    </div>
                )}
            </div>
        </ModalTwoFooter>
    );
};

export default RsvpSection;

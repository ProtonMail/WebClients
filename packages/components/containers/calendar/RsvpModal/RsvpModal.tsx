import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import { InputFieldTwo, TextAreaTwo } from '@proton/components/index';
import { ICAL_ATTENDEE_STATUS } from '@proton/shared/lib/calendar/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import clsx from '@proton/utils/clsx';

import CalendarInviteButtons from '../CalendarInviteButtons';

interface Props {
    handleChangePartstat: (partstat: ICAL_ATTENDEE_STATUS, comment?: string) => Promise<void>;
    userPartstat: ICAL_ATTENDEE_STATUS;
    userComment?: string;
    disabled: boolean;
}

interface PartstatData {
    Status: ICAL_ATTENDEE_STATUS;
    Comment?: string;
}

const RsvpModal = ({ handleChangePartstat, userPartstat, userComment, disabled }: Props) => {
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
        } else {
            return handleChangePartstat(status);
        }
    };

    const handleNote = (note: string) => {
        setModel({
            ...model,
            Comment: note,
        });
    };

    const handleSend = () => {
        // send response & comment
        return handleChangePartstat(model.Status, model.Comment);
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
        <ModalFooter>
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
                        value={model.Comment}
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
        </ModalFooter>
    );
};

export default RsvpModal;

import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import TextAreaTwo from '@proton/components/components/v2/input/TextArea';
import useLoading from '@proton/hooks/useLoading';
import { ATTENDEE_COMMENT_ENCRYPTION_TYPE, ICAL_ATTENDEE_STATUS } from '@proton/shared/lib/calendar/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { PartstatData } from '@proton/shared/lib/interfaces/calendar';

import CalendarInviteButtons from '../CalendarInviteButtons';
import { DeleteNoteButton, EditNoteButton } from './RsvpSectionButtons';

interface Props {
    handleChangePartstat: (partstatData: PartstatData, save: boolean) => Promise<void>;
    userPartstat: ICAL_ATTENDEE_STATUS;
    userComment?: string;
    disabled: boolean;
    isSearchView: boolean;
}

const RsvpSection = ({ handleChangePartstat, userPartstat, userComment, disabled, isSearchView }: Props) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [model, setModel] = useState<PartstatData>({
        Status: userPartstat,
        Comment: userComment ? { Message: userComment, Type: ATTENDEE_COMMENT_ENCRYPTION_TYPE.CLEARTEXT } : undefined,
    });
    const [loadingDelete, withLoadingDelete] = useLoading();
    const [loadingSend, withLoadingSend] = useLoading();

    const handleResponse = (status: ICAL_ATTENDEE_STATUS) => {
        if (isExpanded) {
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
            Comment: { Message: note, Type: ATTENDEE_COMMENT_ENCRYPTION_TYPE.CLEARTEXT }, // type will be overridden after it's being enrypted
        });
    };

    const handleSend = () => {
        return withLoadingSend(handleChangePartstat(model, true));
    };

    const handleCancel = () => {
        setModel({
            Status: userPartstat,
            Comment: userComment
                ? { Message: userComment, Type: ATTENDEE_COMMENT_ENCRYPTION_TYPE.CLEARTEXT }
                : undefined,
        });
        setIsExpanded(!isExpanded);
    };

    const handleDelete = () => {
        return withLoadingDelete(
            handleChangePartstat(
                {
                    ...model,
                    Comment: undefined,
                },
                true
            )
        );
    };

    const cancelButton = <Button shape="ghost" onClick={handleCancel}>{c('Action').t`Cancel`}</Button>;

    const sendButton = (
        <Button color="norm" onClick={handleSend} loading={loadingSend} disabled={isExpanded && !model.Comment}>{c(
            'Action'
        ).t`Send`}</Button>
    );

    const hasUserComment = !!model.Comment?.Message;

    return (
        <>
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
                    originalPatstat={userPartstat}
                    partstat={model.Status}
                    disabled={disabled}
                />
            </div>
            {!isExpanded && !hasUserComment && !isSearchView && (
                <Button
                    className="flex flex-auto justify-end text-sm color-weak"
                    shape="underline"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {c('Action').t`Reply with a note`}
                </Button>
            )}
            {!isExpanded && hasUserComment && (
                <div className="mt-2 flex flex-auto justify-space-between flex-nowrap items-center gap-2">
                    <label className="text-ellipsis color-weak text-sm">
                        <span className="text-bold color-weak">{c('Note').t`Note: `}</span>
                        {userComment}
                    </label>
                    {!isSearchView && (
                        <div className="flex flex-none">
                            <EditNoteButton onEdit={() => setIsExpanded(!isExpanded)} />
                            <DeleteNoteButton onDelete={handleDelete} loading={loadingDelete} />
                        </div>
                    )}
                </div>
            )}
            {isExpanded && (
                <>
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
                    <div className="gap-4 flex flex-auto justify-end">
                        {cancelButton}
                        {sendButton}
                    </div>
                </>
            )}
        </>
    );
};

export default RsvpSection;

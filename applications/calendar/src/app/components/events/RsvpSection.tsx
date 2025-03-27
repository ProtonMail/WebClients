import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { CalendarInviteButtons } from '@proton/components';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import TextAreaWithCounter from '@proton/components/components/v2/input/TextAreaWithCounter';
import {
    DeleteNoteButton,
    EditNoteButton,
} from '@proton/components/containers/calendar/RsvpSection/RsvpSectionButtons';
import useLoading from '@proton/hooks/useLoading';
import { ICAL_ATTENDEE_STATUS } from '@proton/shared/lib/calendar/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { PartstatData } from '@proton/shared/lib/interfaces/calendar';

import { INVITE_ACTION_TYPES } from '../../interfaces/Invite';
import { RsvpSpotlight } from './RsvpSpotlight';

interface Props {
    handleChangePartstat: (
        type: INVITE_ACTION_TYPES.CHANGE_PARTSTAT,
        partstatData: PartstatData,
        save: boolean
    ) => Promise<void>;
    userPartstat: ICAL_ATTENDEE_STATUS;
    userComment?: string;
    disabled: boolean;
    isSearchView: boolean;
}

const RsvpButtons = ({
    handleResponse,
    userPartstat,
    disabled,
    attendeeStatus,
}: {
    attendeeStatus: ICAL_ATTENDEE_STATUS;
    handleResponse: (attendeeStatus: ICAL_ATTENDEE_STATUS) => Promise<void>;
} & Pick<Props, 'userPartstat' | 'disabled'>) => {
    return (
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
                partstat={attendeeStatus}
                disabled={disabled}
            />
        </div>
    );
};

const RsvpSection = ({ handleChangePartstat, userPartstat, userComment, disabled, isSearchView }: Props) => {
    const [displayNoteOverlay, setDisplayNoteOverlay] = useState(false);
    const [model, setModel] = useState<PartstatData>({
        Status: userPartstat,
        Comment: userComment ?? undefined,
    });

    const [loadingDelete, withLoadingDelete] = useLoading();
    const [loadingSend, withLoadingSend] = useLoading();

    const isUnchanged = model.Status === userPartstat && model.Comment === userComment;

    const handleResponse = (status: ICAL_ATTENDEE_STATUS) => {
        if (displayNoteOverlay) {
            setModel({
                ...model,
                Status: status,
            });
        }

        return handleChangePartstat(
            INVITE_ACTION_TYPES.CHANGE_PARTSTAT,
            {
                Status: status,
            },
            !displayNoteOverlay
        );
    };

    const handleNote = (note: string) => {
        setModel({
            ...model,
            Comment: note,
        });
    };

    const handleSend = () => {
        const commentChanged = model.Comment !== userComment;
        const partStatChanged = model.Status !== userPartstat;

        if (commentChanged && partStatChanged) {
            return withLoadingSend(handleChangePartstat(INVITE_ACTION_TYPES.CHANGE_PARTSTAT, model, true));
        } else if (commentChanged && !partStatChanged) {
            return withLoadingSend(handleChangePartstat(INVITE_ACTION_TYPES.CHANGE_PARTSTAT, model, true));
        } else {
            return withLoadingSend(handleChangePartstat(INVITE_ACTION_TYPES.CHANGE_PARTSTAT, model, true));
        }
    };

    const handleCancel = () => {
        setModel({
            Status: userPartstat,
            Comment: userComment ?? undefined,
        });
        setDisplayNoteOverlay(false);
    };

    const handleDeleteComment = () => {
        return withLoadingDelete(
            handleChangePartstat(
                INVITE_ACTION_TYPES.CHANGE_PARTSTAT,
                {
                    ...model,
                    Comment: undefined,
                },
                true
            )
        );
    };

    const cancelButton = <Button shape="outline" onClick={handleCancel}>{c('Action').t`Cancel`}</Button>;

    const sendButton = (
        <Button
            color="norm"
            onClick={handleSend}
            loading={loadingSend}
            disabled={
                displayNoteOverlay &&
                (isUnchanged || !model.Comment || model.Status === ICAL_ATTENDEE_STATUS.NEEDS_ACTION)
            }
        >{c('Action').t`Send`}</Button>
    );

    const hasUserComment = !!model.Comment;
    const canReplyWithNote = !hasUserComment && !isSearchView;

    return (
        <>
            <RsvpButtons
                handleResponse={handleResponse}
                userPartstat={userPartstat}
                disabled={disabled}
                // As no inner state required for this part i'm
                // not passing model.Status and rely on parent state
                attendeeStatus={userPartstat}
            />

            {canReplyWithNote && (
                <RsvpSpotlight>
                    <Button
                        className="flex flex-auto justify-end text-sm color-weak"
                        shape="underline"
                        onClick={() => setDisplayNoteOverlay(true)}
                    >
                        {c('Action').t`Reply with a note`}
                    </Button>
                </RsvpSpotlight>
            )}

            {hasUserComment && (
                <div className="mt-2 flex flex-auto justify-space-between flex-nowrap items-center gap-2">
                    <div className="text-ellipsis color-weak text-sm">
                        <span className="text-bold color-weak">{c('Note').t`Note: `}</span>
                        {userComment}
                    </div>
                    {!isSearchView && (
                        <div className="flex flex-none">
                            <EditNoteButton onEdit={() => setDisplayNoteOverlay(!displayNoteOverlay)} />
                            <DeleteNoteButton onDelete={handleDeleteComment} loading={loadingDelete} />
                        </div>
                    )}
                </div>
            )}

            {displayNoteOverlay && (
                <div className="absolute bg-norm event-popover-rsvp-section border-top py-4">
                    <RsvpButtons
                        handleResponse={handleResponse}
                        userPartstat={userPartstat}
                        disabled={disabled}
                        attendeeStatus={model.Status}
                    />
                    <InputFieldTwo
                        className="mt-4 resize-none"
                        assistContainerClassName="m-0"
                        id="rsvp-modal"
                        as={TextAreaWithCounter}
                        rows={3}
                        placeholder={c('Placeholder').t`Leave a note for all participants`}
                        value={model.Comment}
                        onValue={handleNote}
                        maxCharacterCount={128}
                        showCharacterCount={true}
                        counterPosition="bottom-left"
                    />
                    <div className="gap-4 flex flex-auto justify-end">
                        {cancelButton}
                        {sendButton}
                    </div>
                </div>
            )}
        </>
    );
};

export default RsvpSection;

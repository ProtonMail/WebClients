import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { CalendarInviteButtons, Spotlight, useActiveBreakpoint } from '@proton/components';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import TextAreaWithCounter from '@proton/components/components/v2/input/TextAreaWithCounter';
import {
    DeleteNoteButton,
    EditNoteButton,
} from '@proton/components/containers/calendar/RsvpSection/RsvpSectionButtons';
import useLoading from '@proton/hooks/useLoading';
import { ICAL_ATTENDEE_STATUS, VIEWS } from '@proton/shared/lib/calendar/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { PartstatData } from '@proton/shared/lib/interfaces/calendar';
import clsx from '@proton/utils/clsx';

import { getIsCalendarAppInDrawer } from '../../helpers/views';
import { useUrlifyString } from '../../hooks/useUrlifyString';
import { INVITE_ACTION_TYPES } from '../../interfaces/Invite';
import { RSVPSpotlightContent, useRSVPSpotlight } from './RsvpSpotlight';

interface Props {
    handleChangePartstat: (
        type: INVITE_ACTION_TYPES.CHANGE_PARTSTAT,
        partstatData: PartstatData,
        save: boolean,
        oldPartstatData?: PartstatData
    ) => Promise<void>;
    userPartstat: ICAL_ATTENDEE_STATUS;
    userComment?: string;
    disabled: boolean;
    view: VIEWS;
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
                originalPartstat={userPartstat}
                partstat={attendeeStatus}
                disabled={disabled}
            />
        </div>
    );
};

const RsvpSection = ({ handleChangePartstat, userPartstat, userComment, disabled, view }: Props) => {
    const [displayNoteOverlay, setDisplayNoteOverlay] = useState(false);
    const activeBreakpoint = useActiveBreakpoint();
    const isDrawerOrResponsiveView = getIsCalendarAppInDrawer(view) || activeBreakpoint.viewportWidth['<=small'];
    const isSearchView = view === VIEWS.SEARCH;

    const [model, setModel] = useState<PartstatData>({
        Status: userPartstat,
        Comment: userComment ?? undefined,
    });

    const rsvpSpotlight = useRSVPSpotlight();

    const [loadingDelete, withLoadingDelete] = useLoading();
    const [loadingSend, withLoadingSend] = useLoading();

    const formattedUserComment = useUrlifyString({ text: userComment });

    const isUnchanged = model.Status === userPartstat && model.Comment === userComment;

    const handleResponse = (status: ICAL_ATTENDEE_STATUS) => {
        if (displayNoteOverlay) {
            setModel({
                ...model,
                Status: status,
            });
        }

        // Create oldPartstatData when changing status
        const oldPartstatData = {
            Status: userPartstat,
            Comment: userComment ?? undefined,
        };

        return handleChangePartstat(
            INVITE_ACTION_TYPES.CHANGE_PARTSTAT,
            {
                Status: status,
            },
            !displayNoteOverlay,
            oldPartstatData
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

        // Create oldPartstatData to track changes
        const oldPartstatData = {
            Status: userPartstat,
            Comment: userComment ?? undefined,
        };

        if (commentChanged && partStatChanged) {
            return withLoadingSend(
                handleChangePartstat(INVITE_ACTION_TYPES.CHANGE_PARTSTAT, model, true, oldPartstatData)
            );
        } else if (commentChanged && !partStatChanged) {
            return withLoadingSend(
                handleChangePartstat(INVITE_ACTION_TYPES.CHANGE_PARTSTAT, model, true, oldPartstatData)
            );
        } else {
            return withLoadingSend(
                handleChangePartstat(INVITE_ACTION_TYPES.CHANGE_PARTSTAT, model, true, oldPartstatData)
            );
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
        // Include old data when deleting comment
        const oldPartstatData = {
            Status: userPartstat,
            Comment: userComment ?? undefined,
        };

        return withLoadingDelete(
            handleChangePartstat(
                INVITE_ACTION_TYPES.CHANGE_PARTSTAT,
                {
                    ...model,
                    Comment: undefined,
                },
                true,
                oldPartstatData
            )
        );
    };

    useEffect(() => {
        if (userPartstat !== model.Status) {
            setModel((currentModel) => ({
                ...currentModel,
                Status: userPartstat,
            }));
        }
    }, [userPartstat]);

    useEffect(() => {
        // Update user comment in background only if not actively editing
        if (userPartstat !== model.Status && !displayNoteOverlay) {
            setModel((currentModel) => ({
                ...currentModel,
                Comment: userComment,
            }));
        }
    }, [userComment]);

    // Rely on userComment instead of model.Comment to avoid line jump
    const canReplyWithNote = !userComment && !isSearchView;

    const handleReplyWithNote = () => {
        setDisplayNoteOverlay(true);
        rsvpSpotlight.onClose();
    };

    return (
        <>
            {
                // We display it all the time when we're not in drawer to avoid line jump when open/close note overlay
                // If in drawer app and notes are opened we hide it to not duplicate content
                (!isDrawerOrResponsiveView || (isDrawerOrResponsiveView && !displayNoteOverlay)) && (
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
                            <Spotlight
                                show={rsvpSpotlight.shouldShowSpotlight}
                                content={<RSVPSpotlightContent />}
                                onDisplayed={rsvpSpotlight.onDisplayed}
                                onClose={rsvpSpotlight.onClose}
                                originalPlacement="right"
                                className="ml-3"
                                isAboveModal
                            >
                                <div className={isDrawerOrResponsiveView ? 'text-left' : 'text-right'}>
                                    <Button
                                        className={clsx('text-sm color-weak', isDrawerOrResponsiveView && 'mt-2')}
                                        shape="underline"
                                        onClick={handleReplyWithNote}
                                    >
                                        {c('Action').t`Reply with a note`}
                                    </Button>
                                </div>
                            </Spotlight>
                        )}

                        {!!formattedUserComment && (
                            <div className="mt-2 flex flex-auto justify-space-between flex-nowrap items-center gap-2">
                                <div className="text-ellipsis color-weak text-sm">
                                    <span className="text-bold color-weak">{c('Note').t`Note:`} </span>
                                    <span dangerouslySetInnerHTML={{ __html: formattedUserComment }} />
                                </div>
                                {!isSearchView && (
                                    <div className="flex flex-none">
                                        <EditNoteButton onEdit={() => setDisplayNoteOverlay(!displayNoteOverlay)} />
                                        <DeleteNoteButton onDelete={handleDeleteComment} loading={loadingDelete} />
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )
            }

            {displayNoteOverlay && (
                <div
                    className={clsx(
                        'bg-norm',
                        !isDrawerOrResponsiveView && 'py-4 absolute border-top event-popover-rsvp-section'
                    )}
                >
                    <RsvpButtons
                        handleResponse={handleResponse}
                        userPartstat={userPartstat}
                        disabled={disabled}
                        attendeeStatus={model.Status}
                    />
                    <InputFieldTwo
                        autoFocus
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
                        <Button shape="outline" onClick={handleCancel}>{c('Action').t`Cancel`}</Button>
                        <Button
                            color="norm"
                            onClick={handleSend}
                            loading={loadingSend}
                            disabled={
                                displayNoteOverlay &&
                                (isUnchanged ||
                                    !model.Comment?.trim() ||
                                    model.Status === ICAL_ATTENDEE_STATUS.NEEDS_ACTION)
                            }
                        >{c('Action').t`Send`}</Button>
                    </div>
                </div>
            )}
        </>
    );
};

export default RsvpSection;

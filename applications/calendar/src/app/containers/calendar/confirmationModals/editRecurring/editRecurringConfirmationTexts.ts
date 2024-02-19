import { c } from 'ttag';

import { RECURRING_TYPES } from '@proton/shared/lib/calendar/constants';

import { INVITE_ACTION_TYPES, InviteActions } from '../../../../interfaces/Invite';

const getDefaultTexts = () => {
    return {
        title: c('Title').t`Update recurring event`,
        confirm: c('Action').t`Update`,
        cancel: c('Action').t`Cancel`,
        alertText: c('Info').t`Which event would you like to update?`,
    };
};

export const getTexts = (types: RECURRING_TYPES[], inviteActions: InviteActions) => {
    const { type: inviteType, addedAttendees, removedAttendees, hasRemovedAllAttendees } = inviteActions;
    const hasAddedAttendees = !!addedAttendees?.length;
    const hasRemovedAttendees = !!removedAttendees?.length;
    const isSendInviteType = [INVITE_ACTION_TYPES.SEND_INVITATION, INVITE_ACTION_TYPES.SEND_UPDATE].includes(
        inviteType
    );

    const defaultTexts = getDefaultTexts();
    const saveText = c('Title').t`Save`;
    const saveChangesText = c('Title').t`Save changes`;

    if (types.length !== 1) {
        if (isSendInviteType) {
            return {
                ...defaultTexts,
                alertText: c('Info')
                    .t`An invitation will be sent to all participants. Which event would you like to update?`,
            };
        }
        return defaultTexts;
    }
    if (types[0] === RECURRING_TYPES.SINGLE) {
        if (inviteType === INVITE_ACTION_TYPES.CHANGE_PARTSTAT) {
            return {
                ...defaultTexts,
                alertText: c('Info')
                    .t`This event has been updated by the organizer. Would you like to change your answer only for this occurrence in this series?`,
            };
        }
        return {
            ...defaultTexts,
            alertText: c('Info').t`Would you like to update this event?`,
        };
    }
    if (types[0] === RECURRING_TYPES.ALL) {
        if (inviteType === INVITE_ACTION_TYPES.CHANGE_PARTSTAT) {
            return {
                ...defaultTexts,
                alertText: c('Info').t`Would you like to change your answer for all the events in this series?`,
            };
        }
        if (inviteType === INVITE_ACTION_TYPES.SEND_INVITATION) {
            if (hasAddedAttendees && hasRemovedAttendees) {
                return {
                    ...defaultTexts,
                    title: saveChangesText,
                    confirm: saveText,
                    alertText: c('Info')
                        .t`Added and removed participants will be notified about all the events in this series.`,
                };
            }
            if (hasAddedAttendees) {
                return {
                    ...defaultTexts,
                    title: c('Title').t`Add participants`,
                    confirm: c('Action').t`Add`,
                    alertText: c('Success')
                        .t`An invitation will be sent to added participants for all the events in this series.`,
                };
            }
            if (hasRemovedAttendees) {
                return {
                    ...defaultTexts,
                    title: c('Title').t`Remove participants`,
                    confirm: c('Action').t`Remove`,
                    alertText: c('Success')
                        .t`A cancellation email will be sent to removed participants for all the events in this series.`,
                };
            }
            // should never fall here
            throw new Error('Inconsistent invite actions');
        }
        if (inviteType === INVITE_ACTION_TYPES.SEND_UPDATE) {
            if (hasAddedAttendees && hasRemovedAttendees) {
                if (hasRemovedAllAttendees) {
                    return {
                        ...defaultTexts,
                        title: saveChangesText,
                        confirm: saveText,
                        alertText: c('Info')
                            .t`You will update all the events in this series. Added and removed participants will be notified.`,
                    };
                }
                return {
                    ...defaultTexts,
                    title: saveChangesText,
                    confirm: saveText,
                    alertText: c('Info')
                        .t`You will update all the events in this series. Existent, added and removed participants will be notified.`,
                };
            }
            if (hasAddedAttendees) {
                return {
                    ...defaultTexts,
                    title: saveChangesText,
                    confirm: saveText,
                    alertText: c('Info')
                        .t`You will update all the events in this series. Existent and added participants will be notified.`,
                };
            }
            if (hasRemovedAllAttendees) {
                return {
                    ...defaultTexts,
                    title: saveChangesText,
                    confirm: saveText,
                    alertText: c('Info')
                        .t`You will update all the events in this series. Removed participants will be notified.`,
                };
            }
            if (hasRemovedAttendees) {
                return {
                    ...defaultTexts,
                    title: saveChangesText,
                    confirm: saveText,
                    alertText: c('Info')
                        .t`You will update all the events in this series. Existent and removed participants will be notified.`,
                };
            }
            return {
                ...defaultTexts,
                alertText: c('Info')
                    .t`You will update all the events in this series. An invitation will be sent to the event participants.`,
            };
        }
        return {
            ...defaultTexts,
            alertText: c('Info').t`Would you like to update all events in this series?`,
        };
    }
    // should never fall here
    throw new Error('Unknown confirmation type');
};

export const getRecurringWarningText = ({
    inviteActions,
    hasPreviousSingleEdits,
    hasPreviousSingleDeletes,
    isOrganizer,
    isBreakingChange,
    canEditOnlyPersonalPart,
}: {
    inviteActions: InviteActions;
    hasPreviousSingleEdits: boolean;
    hasPreviousSingleDeletes: boolean;
    isOrganizer: boolean;
    isBreakingChange: boolean;
    canEditOnlyPersonalPart: boolean;
}) => {
    if (!hasPreviousSingleEdits && !hasPreviousSingleDeletes) {
        return '';
    }
    if (inviteActions.resetSingleEditsPartstat) {
        return c('Info').t`Some of your answers to occurrences previously updated by the organizer will be lost.`;
    }
    if (canEditOnlyPersonalPart) {
        return '';
    }
    if (isOrganizer && !isBreakingChange) {
        return '';
    }
    return c('Info').t`Previous modifications on this series will be lost.`;
};

export const getRruleWarningText = () => {
    return c('Info').t`Frequency modifications will be lost.`;
};

export const getCalendarChangeForbiddenTexts = () => {
    const { title, cancel } = getDefaultTexts();
    return {
        title,
        cancel,
        alertText: c('Info')
            .t`The organizer has updated some of the events in this series. Changing the calendar is not supported yet for this type of recurring events.`,
    };
};

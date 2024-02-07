import { ICAL_ATTENDEE_STATUS, RECURRING_TYPES } from '@proton/shared/lib/calendar/constants';
import { buildVcalAttendee } from '@proton/shared/lib/calendar/vcalConverter';

import { INVITE_ACTION_TYPES } from '../../../../interfaces/Invite';
import { getRecurringWarningText, getTexts } from './editRecurringConfirmationTexts';

describe('getRecurringWarningText()', () => {
    test('Attendee gets no warning when answering a simple recurring series', () => {
        const inviteActions = {
            type: INVITE_ACTION_TYPES.CHANGE_PARTSTAT,
            partstat: ICAL_ATTENDEE_STATUS.TENTATIVE,
            resetSingleEditsPartstat: false,
        };
        const combinations = [];
        for (let i = 0; i < 2 ** 4; i++) {
            const isOrganizer = !!(1 & i);
            const isBreakingChange = !!(2 & i);
            const canEditOnlyPersonalPart = !!(4 & i);

            combinations.push({ isOrganizer, isBreakingChange, canEditOnlyPersonalPart });
        }
        combinations.forEach(({ isOrganizer, isBreakingChange, canEditOnlyPersonalPart }) => {
            expect(
                getRecurringWarningText({
                    inviteActions,
                    hasPreviousSingleDeletes: false,
                    hasPreviousSingleEdits: false,
                    isOrganizer,
                    isBreakingChange,
                    canEditOnlyPersonalPart,
                })
            ).toEqual('');
        });
    });

    test('Organizer gets no warning when editing a simple recurring series', () => {
        const inviteActions = {
            type: INVITE_ACTION_TYPES.SEND_UPDATE,
        };
        const combinations = [];
        for (let i = 0; i < 2 ** 1; i++) {
            const isBreakingChange = !!(1 & i);

            combinations.push({ isBreakingChange });
        }
        combinations.forEach(({ isBreakingChange }) => {
            expect(
                getRecurringWarningText({
                    inviteActions,
                    hasPreviousSingleDeletes: false,
                    hasPreviousSingleEdits: false,
                    isOrganizer: true,
                    isBreakingChange,
                    canEditOnlyPersonalPart: false,
                })
            ).toEqual('');
        });
    });

    test('Organizer gets no warning when deleting a simple recurring series', () => {
        const inviteActions = {
            type: INVITE_ACTION_TYPES.CANCEL_INVITATION,
        };
        const combinations = [];
        for (let i = 0; i < 2 ** 1; i++) {
            const isBreakingChange = !!(1 & i);

            combinations.push({ isBreakingChange });
        }
        combinations.forEach(({ isBreakingChange }) => {
            expect(
                getRecurringWarningText({
                    inviteActions,
                    hasPreviousSingleDeletes: false,
                    hasPreviousSingleEdits: false,
                    isOrganizer: true,
                    isBreakingChange,
                    canEditOnlyPersonalPart: false,
                })
            ).toEqual('');
        });
    });

    test('Attendee gets a warning when partstats of single edits will be reset', () => {
        const inviteActions = {
            type: INVITE_ACTION_TYPES.CHANGE_PARTSTAT,
            partstat: ICAL_ATTENDEE_STATUS.TENTATIVE,
            resetSingleEditsPartstat: true,
        };
        const combinations = [];
        for (let i = 0; i < 2 ** 3; i++) {
            const hasPreviousSingleDeletes = !!(1 & i);
            const isBreakingChange = !!(2 & i);
            const canEditOnlyPersonalPart = !!(4 & i);

            combinations.push({ hasPreviousSingleDeletes, isBreakingChange, canEditOnlyPersonalPart });
        }
        combinations.forEach(({ hasPreviousSingleDeletes, isBreakingChange, canEditOnlyPersonalPart }) => {
            expect(
                getRecurringWarningText({
                    inviteActions,
                    hasPreviousSingleDeletes,
                    hasPreviousSingleEdits: true,
                    isOrganizer: false,
                    isBreakingChange,
                    canEditOnlyPersonalPart,
                })
            ).toEqual('Some of your answers to occurrences previously updated by the organizer will be lost.');
        });
    });

    test('Attendee gets no warning when editing personal part', () => {
        const inviteActions = {
            type: INVITE_ACTION_TYPES.NONE,
        };
        const combinations = [];
        for (let i = 0; i < 2 ** 3; i++) {
            const hasPreviousSingleDeletes = !!(1 & i);
            const hasPreviousSingleEdits = !!(2 & i);
            const isBreakingChange = !!(4 & i);

            combinations.push({ hasPreviousSingleDeletes, hasPreviousSingleEdits, isBreakingChange });
        }
        combinations.forEach(({ hasPreviousSingleDeletes, hasPreviousSingleEdits, isBreakingChange }) => {
            expect(
                getRecurringWarningText({
                    inviteActions,
                    hasPreviousSingleDeletes,
                    hasPreviousSingleEdits,
                    isOrganizer: false,
                    isBreakingChange,
                    canEditOnlyPersonalPart: true,
                })
            ).toEqual('');
        });
    });

    test('Organizer gets no warning when editing series with single deletions if the change is non-breaking and there are no single edits', () => {
        const inviteActions = {
            type: INVITE_ACTION_TYPES.SEND_UPDATE,
        };
        const combinations = [];
        for (let i = 0; i < 2 ** 2; i++) {
            const hasPreviousSingleEdits = !!(1 & i);
            const isBreakingChange = !!(2 & i);

            combinations.push({ hasPreviousSingleEdits, isBreakingChange });
        }
        combinations.forEach(({ hasPreviousSingleEdits, isBreakingChange }) => {
            const result =
                !isBreakingChange && !hasPreviousSingleEdits
                    ? ''
                    : 'Previous modifications on this series will be lost.';
            expect(
                getRecurringWarningText({
                    inviteActions,
                    hasPreviousSingleDeletes: true,
                    hasPreviousSingleEdits,
                    isOrganizer: true,
                    isBreakingChange,
                    canEditOnlyPersonalPart: false,
                })
            ).toEqual(result);
        });
    });

    test('Organizer gets a warning when editing series with single edits', () => {
        const inviteActions = {
            type: INVITE_ACTION_TYPES.SEND_INVITATION,
        };
        const combinations = [];
        for (let i = 0; i < 2 ** 2; i++) {
            const hasPreviousSingleDeletes = !!(1 & i);
            const isBreakingChange = !!(2 & i);

            combinations.push({ hasPreviousSingleDeletes, isBreakingChange });
        }
        combinations.forEach(({ hasPreviousSingleDeletes, isBreakingChange }) => {
            expect(
                getRecurringWarningText({
                    inviteActions,
                    hasPreviousSingleDeletes,
                    hasPreviousSingleEdits: true,
                    isOrganizer: true,
                    isBreakingChange,
                    canEditOnlyPersonalPart: false,
                })
            ).toEqual('Previous modifications on this series will be lost.');
        });
    });
});

describe('getTexts()', () => {
    describe('when there is more than one edit type option', () => {
        test('User gets asked which event to update when more than one edit type option', () => {
            const types = [RECURRING_TYPES.SINGLE, RECURRING_TYPES.ALL];
            const inviteActions = {
                type: INVITE_ACTION_TYPES.NONE,
            };
            expect(getTexts(types, inviteActions)).toEqual({
                title: 'Update recurring event',
                confirm: 'Update',
                cancel: 'Cancel',
                alertText: 'Which event would you like to update?',
            });
        });

        test('Organizer gets asked which event to update when more than one edit type option', () => {
            const types = [RECURRING_TYPES.SINGLE, RECURRING_TYPES.ALL];
            const inviteActions = {
                type: INVITE_ACTION_TYPES.SEND_INVITATION,
            };
            expect(getTexts(types, inviteActions)).toEqual({
                title: 'Update recurring event',
                confirm: 'Update',
                cancel: 'Cancel',
                alertText: 'An invitation will be sent to all participants. Which event would you like to update?',
            });
        });
    });

    describe('when only "edit this" is offered', () => {
        const types = [RECURRING_TYPES.SINGLE];

        test('Organizer gets asked to confirm editing "this event"', () => {
            const inviteActions = {
                type: INVITE_ACTION_TYPES.SEND_INVITATION,
            };
            expect(getTexts(types, inviteActions)).toEqual({
                title: 'Update recurring event',
                confirm: 'Update',
                cancel: 'Cancel',
                alertText: 'Would you like to update this event?',
            });
        });

        test('Attendee gets asked to confirm answering "this event"', () => {
            const inviteActions = {
                type: INVITE_ACTION_TYPES.CHANGE_PARTSTAT,
            };
            expect(getTexts(types, inviteActions)).toEqual({
                title: 'Update recurring event',
                confirm: 'Update',
                cancel: 'Cancel',
                alertText:
                    'This event has been updated by the organizer. Would you like to change your answer only for this occurrence in this series?',
            });
        });
    });

    describe('when only "edit all" is offered', () => {
        const types = [RECURRING_TYPES.ALL];

        describe('when the organizer is only adding or removing participants', () => {
            test('Organizer gets informed about new invitations for added attendees', () => {
                const inviteActions = {
                    type: INVITE_ACTION_TYPES.SEND_INVITATION,
                    addedAttendees: [buildVcalAttendee('test@pm.me')],
                };
                expect(getTexts(types, inviteActions)).toEqual({
                    title: 'Add participants',
                    confirm: 'Add',
                    cancel: 'Cancel',
                    alertText: 'An invitation will be sent to added participants for all the events in this series.',
                });
            });

            test('Organizer gets informed about cancellations for removed attendees', () => {
                const inviteActions = {
                    type: INVITE_ACTION_TYPES.SEND_INVITATION,
                    removedAttendees: [buildVcalAttendee('test@pm.me')],
                };
                expect(getTexts(types, inviteActions)).toEqual({
                    title: 'Remove participants',
                    confirm: 'Remove',
                    cancel: 'Cancel',
                    alertText:
                        'A cancellation email will be sent to removed participants for all the events in this series.',
                });
            });

            test('Organizer gets informed about changes for added and removed attendees', () => {
                const inviteActions = {
                    type: INVITE_ACTION_TYPES.SEND_INVITATION,
                    addedAttendees: [buildVcalAttendee('test@pm.me')],
                    removedAttendees: [buildVcalAttendee('test2@pm.me')],
                };
                expect(getTexts(types, inviteActions)).toEqual({
                    title: 'Save changes',
                    confirm: 'Save',
                    cancel: 'Cancel',
                    alertText: 'Added and removed participants will be notified about all the events in this series.',
                });
            });
        });

        describe('when the organizer is making changes to event details and maybe adding or removing participants', () => {
            test('when no participants are modified', () => {
                const inviteActions = {
                    type: INVITE_ACTION_TYPES.SEND_UPDATE,
                };
                expect(getTexts(types, inviteActions)).toEqual({
                    title: 'Update recurring event',
                    confirm: 'Update',
                    cancel: 'Cancel',
                    alertText:
                        'You will update all the events in this series. An invitation will be sent to the event participants.',
                });
            });

            test('when participants are added', () => {
                const inviteActions = {
                    type: INVITE_ACTION_TYPES.SEND_UPDATE,
                    addedAttendees: [buildVcalAttendee('test@pm.me')],
                };
                expect(getTexts(types, inviteActions)).toEqual({
                    title: 'Save changes',
                    confirm: 'Save',
                    cancel: 'Cancel',
                    alertText:
                        'You will update all the events in this series. Existent and added participants will be notified.',
                });
            });

            test('when participants are removed', () => {
                const inviteActions = {
                    type: INVITE_ACTION_TYPES.SEND_UPDATE,
                    removedAttendees: [buildVcalAttendee('test@pm.me')],
                };
                expect(getTexts(types, inviteActions)).toEqual({
                    title: 'Save changes',
                    confirm: 'Save',
                    cancel: 'Cancel',
                    alertText:
                        'You will update all the events in this series. Existent and removed participants will be notified.',
                });
            });

            test('when all participants are removed', () => {
                const inviteActions = {
                    type: INVITE_ACTION_TYPES.SEND_UPDATE,
                    removedAttendees: [buildVcalAttendee('test@pm.me')],
                    hasRemovedAllAttendees: true,
                };
                expect(getTexts(types, inviteActions)).toEqual({
                    title: 'Save changes',
                    confirm: 'Save',
                    cancel: 'Cancel',
                    alertText: 'You will update all the events in this series. Removed participants will be notified.',
                });
            });

            test('when participants are added and removed', () => {
                const inviteActions = {
                    type: INVITE_ACTION_TYPES.SEND_UPDATE,
                    addedAttendees: [buildVcalAttendee('test@pm.me')],
                    removedAttendees: [buildVcalAttendee('test2@pm.me')],
                };
                expect(getTexts(types, inviteActions)).toEqual({
                    title: 'Save changes',
                    confirm: 'Save',
                    cancel: 'Cancel',
                    alertText:
                        'You will update all the events in this series. Existent, added and removed participants will be notified.',
                });
            });

            test('when new participants are added and all the existing ones are removed', () => {
                const inviteActions = {
                    type: INVITE_ACTION_TYPES.SEND_UPDATE,
                    addedAttendees: [buildVcalAttendee('test@pm.me')],
                    removedAttendees: [buildVcalAttendee('test2@pm.me')],
                    hasRemovedAllAttendees: true,
                };
                expect(getTexts(types, inviteActions)).toEqual({
                    title: 'Save changes',
                    confirm: 'Save',
                    cancel: 'Cancel',
                    alertText:
                        'You will update all the events in this series. Added and removed participants will be notified.',
                });
            });
        });

        test('Attendee gets asked to confirm answering "all events"', () => {
            const inviteActions = {
                type: INVITE_ACTION_TYPES.CHANGE_PARTSTAT,
            };
            expect(getTexts(types, inviteActions)).toEqual({
                title: 'Update recurring event',
                confirm: 'Update',
                cancel: 'Cancel',
                alertText: 'Would you like to change your answer for all the events in this series?',
            });
        });
    });
});

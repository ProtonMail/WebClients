import { ICAL_ATTENDEE_STATUS } from '@proton/shared/lib/calendar/constants';

import { INVITE_ACTION_TYPES } from '../../../../interfaces/Invite';
import { getRecurringWarningText } from './editRecurringConfirmationTexts';

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

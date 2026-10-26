import { renderHook } from '@testing-library/react';
import { addDays, subDays } from 'date-fns';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { ImportProvider } from '@proton/activation/src/interface';
import { TelemetryMailOnboardingEvents } from '@proton/shared/lib/api/telemetry';
import { ChecklistKey, ChecklistType } from '@proton/shared/lib/interfaces/Checklist';
import { tracker } from '@proton/telemetry-tracker/tracker';

import {
    CHECKLIST_ACTIONS,
    CHECKLIST_REDUCE_TRIGGERS,
    CHECKLIST_STEPS,
    type ChecklistTrackingContext,
    getChecklistItemStep,
    useChecklistTracker,
} from './checklistEvents';

jest.mock('@proton/account/allSubscriptions/hooks');

jest.mock('@proton/telemetry-tracker/tracker', () => ({
    tracker: { emit: jest.fn() },
}));

const NOW = new Date('2026-10-25T12:00:00Z');

const getLastEmit = () => {
    const [event, payload] = jest.mocked(tracker.emit).mock.calls.at(-1) ?? [];

    return { name: event?.event, dimensions: payload?.dimensions, values: payload?.values };
};

const renderTracker = (overrides: Partial<ChecklistTrackingContext> = {}) =>
    renderHook(() =>
        useChecklistTracker({
            canDisplayChecklist: true,
            checklistType: ChecklistType.MailFreeUser,
            createdAt: subDays(NOW, 3),
            expiresAt: addDays(NOW, 27),
            ...overrides,
        })
    ).result.current;

describe('checklist tracking', () => {
    beforeEach(() => {
        jest.useFakeTimers({ now: NOW });
        jest.clearAllMocks();
        sessionStorage.clear();
        jest.mocked(useAllSubscriptions).mockReturnValue([[], false]);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('sends the provider the user selects on the importers screen', () => {
        renderTracker().trackProviderSelected(ImportProvider.GOOGLE);

        expect(getLastEmit()).toMatchObject({
            name: TelemetryMailOnboardingEvents.stepInteracted,
            dimensions: { step: 'importers_screen', action: 'select_provider', provider: 'google' },
        });
    });

    it('sends the close action of the sidebar', () => {
        renderTracker().trackStepInteracted(CHECKLIST_STEPS.sidebar, CHECKLIST_ACTIONS.close);

        expect(getLastEmit()).toMatchObject({
            name: TelemetryMailOnboardingEvents.stepInteracted,
            dimensions: { step: 'sidebar', action: 'close' },
        });
    });

    it('sends the checklist type, the plan and the age of the checklist', () => {
        renderTracker().trackStepCompleted(CHECKLIST_STEPS.import);

        expect(getLastEmit()).toEqual({
            name: TelemetryMailOnboardingEvents.stepCompleted,
            dimensions: { flow: 'checklist', step: 'import', plan: 'free', checklistType: 'mail_free' },
            values: { daysSinceCreated: 3, daysRemaining: 27 },
        });
    });

    it('does not send daysRemaining when the checklist never expires', () => {
        renderTracker({ checklistType: ChecklistType.MailPaidUser, expiresAt: undefined }).trackStepCompleted(
            CHECKLIST_STEPS.protectInbox
        );

        expect(getLastEmit().dimensions).toMatchObject({ checklistType: 'mail_paid' });
        expect(getLastEmit().values?.daysRemaining).toBeUndefined();
    });

    it('sends the reason the checklist moved to the sidebar', () => {
        renderTracker().trackChecklistReduced(CHECKLIST_REDUCE_TRIGGERS.inboxLimit);

        expect(getLastEmit()).toMatchObject({
            name: TelemetryMailOnboardingEvents.stepInteracted,
            dimensions: { step: 'sidebar', action: CHECKLIST_ACTIONS.reduce, trigger: 'inbox_limit' },
        });
    });

    it('sends the service the user selected', () => {
        renderTracker().trackServiceSelected('netflix');

        expect(getLastEmit().dimensions).toMatchObject({ action: 'select_service', service: 'netflix' });
    });

    it('sends flow_finished and flow_dismissed without a step on finish', () => {
        const checklist = renderTracker();

        checklist.trackFlowFinished();
        expect(getLastEmit().name).toBe(TelemetryMailOnboardingEvents.flowFinished);
        expect(getLastEmit().dimensions).not.toHaveProperty('step');

        checklist.trackFlowDismissed();
        expect(getLastEmit()).toMatchObject({
            name: TelemetryMailOnboardingEvents.flowDismissed,
            dimensions: { step: 'sidebar' },
        });
    });

    it('sends step_load once per screen in a browser session', () => {
        const checklist = renderTracker();

        checklist.trackStepLoaded(CHECKLIST_STEPS.importersScreen);
        checklist.trackStepLoaded(CHECKLIST_STEPS.importersScreen);
        checklist.trackStepLoaded(CHECKLIST_STEPS.accountsScreen);

        expect(tracker.emit).toHaveBeenCalledTimes(2);
    });

    it('reports the plan as unknown while the subscriptions load', () => {
        jest.mocked(useAllSubscriptions).mockReturnValue([undefined, true]);
        renderTracker().trackFlowFinished();

        expect(getLastEmit().dimensions).toMatchObject({ plan: 'unknown' });
    });

    it.each([
        ['the user cannot see the checklist', { canDisplayChecklist: false }],
        ['the checklist is not a mail one', { checklistType: ChecklistType.DriveUser }],
        ['there is no checklist', { checklistType: undefined }],
    ])('sends nothing when %s', (_, overrides) => {
        const checklist = renderTracker(overrides);

        checklist.trackStepCompleted(CHECKLIST_STEPS.import);
        checklist.trackFlowFinished();

        expect(tracker.emit).not.toHaveBeenCalled();
    });

    it('only maps the items displayed in the checklist to a step', () => {
        expect(getChecklistItemStep(ChecklistKey.MobileApp)).toBe(CHECKLIST_STEPS.mobileApp);
        expect(getChecklistItemStep(ChecklistKey.AccountLogin)).toBeUndefined();
    });
});

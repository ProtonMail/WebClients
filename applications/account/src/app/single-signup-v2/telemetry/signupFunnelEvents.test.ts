import { TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { APPS } from '@proton/shared/lib/constants';
import { mockTracker } from '@proton/telemetry-tracker/testing';

import {
    getSignupProduct,
    trackSignupAccountCreated,
    trackSignupDisplayNameCompleted,
    trackSignupPlanSelectionLoaded,
    trackSignupRecoveryLoaded,
} from './signupFunnelEvents';

describe('signup funnel events', () => {
    let recorder: ReturnType<typeof mockTracker>;

    beforeEach(() => {
        recorder = mockTracker();
    });

    afterEach(() => {
        recorder.restore();
    });

    it('only tracks the Mail and Calendar signups', () => {
        expect(getSignupProduct(undefined)).toBeUndefined();
        expect(getSignupProduct(APPS.PROTONMAIL)).toBe('mail');
        expect(getSignupProduct(APPS.PROTONCALENDAR)).toBe('calendar');
        expect(getSignupProduct(APPS.PROTONPASS)).toBeUndefined();
    });

    it('sends nothing for other products', () => {
        trackSignupPlanSelectionLoaded(APPS.PROTONDRIVE);
        trackSignupAccountCreated(APPS.PROTONDRIVE);
        trackSignupRecoveryLoaded(APPS.PROTONDRIVE, 'free');
        trackSignupDisplayNameCompleted(APPS.PROTONDRIVE, 'free');

        expect(recorder.reports).toHaveLength(0);
    });

    it('sends unauthenticated events to the PoC group, without plan before the account exists', () => {
        trackSignupPlanSelectionLoaded(APPS.PROTONMAIL);

        const [report] = recorder.reports;

        expect(report.measurementGroup).toBe(TelemetryMeasurementGroups.mailSignupOnboardingPoc);
        expect(report.event).toBe('step_load');
        expect(report.delay).toBe(false);
        expect(report.dimensions).toEqual({
            flow: 'signup',
            product: 'mail',
            authState: 'unauthenticated',
            step: 'plan_selection',
        });
    });

    it('flushes the account creation, as the user can be redirected right after', () => {
        trackSignupAccountCreated(APPS.PROTONMAIL);

        expect(recorder.reports[0]).toMatchObject({ event: 'step_completed', flushImmediately: true });
    });

    it('sends the plan once the account exists', () => {
        trackSignupRecoveryLoaded(APPS.PROTONCALENDAR, 'mail2022');

        expect(recorder.reports[0].dimensions).toMatchObject({
            product: 'calendar',
            plan: 'mail2022',
            step: 'recovery',
        });
    });

    it('finishes the flow after the display name and flushes the batch', () => {
        trackSignupDisplayNameCompleted(APPS.PROTONMAIL, 'free');

        expect(recorder.reports.map(({ event }) => event)).toEqual(['step_completed', 'flow_finished']);
        expect(recorder.reports[1].flushImmediately).toBe(true);
        expect(recorder.reports[1].values).toHaveProperty('activeMs');
    });
});

import { TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { mockTracker } from '@proton/telemetry-tracker/testing';

import { EASY_SWITCH_SOURCES, ImportProvider, ImportType, TIME_PERIOD } from '../interface';
import {
    getAccountImportBYOEStartedAt,
    resumeAccountImportBYOE,
    trackAccountImportBYOEAddressAction,
    trackAccountImportBYOEAuthenticated,
    trackAccountImportBYOEError,
    trackAccountImportBYOEFinished,
    trackAccountImportBYOESignInClicked,
    trackAccountImportBYOEStarted,
    trackAccountImportBYOEUpsellViewed,
    trackAccountImportClaimableAddressModalAction,
    trackAccountImportClaimableAddressModalShown,
    trackAccountImportEasySwitchCustomizeViewed,
    trackAccountImportEasySwitchError,
    trackAccountImportEasySwitchFinished,
    trackAccountImportEasySwitchInstructionsViewed,
    trackAccountImportEasySwitchProductsSubmitted,
    trackAccountImportEasySwitchStarted,
    trackAccountImportLinkedAddressModalAction,
    trackAccountImportLinkedAddressModalShown,
    trackAccountImportReportAction,
} from './accountImportFlow';
import { trackBYOECreationStarted } from './byoeCreationFunnel';
import { mockTrackerOfGroup } from './mockTrackerOfGroup';

const mockAccountImportFlowTracker = () => mockTrackerOfGroup(TelemetryMeasurementGroups.accountImportFlow);

describe('account import flow telemetry', () => {
    describe('BYOE', () => {
        it('describes the creation with flow, step and action, and times it from the first step', () => {
            const { reports } = mockAccountImportFlowTracker();

            trackAccountImportBYOEStarted({
                source: EASY_SWITCH_SOURCES.MAIL_WEB_CHECKLIST_BYOE,
                provider: 'google',
                isConversion: false,
                variant: 'treatment',
            });
            trackAccountImportBYOESignInClicked({
                provider: 'google',
                hasImportEmails: true,
                importPeriod: TIME_PERIOD.LAST_YEAR,
                variant: 'treatment',
            });
            trackAccountImportBYOEAuthenticated({ provider: 'google', variant: 'treatment' });
            trackAccountImportBYOEFinished({
                provider: 'google',
                hasImportEmails: true,
                importPeriod: TIME_PERIOD.LAST_YEAR,
                isUpsellShown: true,
                isClaimedAddress: false,
                variant: 'treatment',
            });
            trackAccountImportBYOEUpsellViewed({ provider: 'google', variant: 'treatment' });

            expect(reports.map(({ event }) => event)).toEqual([
                'step_load',
                'step_interacted',
                'step_completed',
                'flow_finished',
                'step_load',
            ]);
            expect(reports[0].dimensions).toEqual({
                flow: 'byoe',
                step: 'connect_modal',
                source: 'mail-web-checklist-byoe',
                provider: 'google',
                isConversion: 'false',
                variant: 'treatment',
            });
            expect(reports[1].dimensions).toEqual({
                flow: 'byoe',
                step: 'connect_modal',
                action: 'sign_in',
                provider: 'google',
                hasImportEmails: 'true',
                importPeriodSelected: 'last_year',
                variant: 'treatment',
            });
            expect(reports[2].dimensions).toEqual({
                flow: 'byoe',
                step: 'sign_in',
                provider: 'google',
                variant: 'treatment',
            });
            expect(reports[3].dimensions).toEqual({
                flow: 'byoe',
                provider: 'google',
                hasImportEmails: 'true',
                importPeriodSelected: 'last_year',
                isUpsellShown: 'true',
                isClaimedAddress: 'false',
                variant: 'treatment',
            });
            expect(reports[4].dimensions).toEqual({
                flow: 'byoe',
                step: 'upsell',
                provider: 'google',
                variant: 'treatment',
            });

            // Every step carries when it happened, and the time spent since the start while the flow runs
            reports.forEach((report) => expect(report.values).toHaveProperty('timestampMs'));
            [0, 1, 2, 3].forEach((index) => expect(reports[index].values).toHaveProperty('activeMs'));
            // The flow is over once the address exists
            expect(reports[4].values).not.toHaveProperty('activeMs');
        });

        it('has no period when the user does not import emails', () => {
            const { reports } = mockAccountImportFlowTracker();

            trackAccountImportBYOESignInClicked({
                provider: 'google',
                hasImportEmails: false,
                importPeriod: TIME_PERIOD.LAST_YEAR,
                variant: 'n/a',
            });

            expect(reports[0].dimensions).toMatchObject({ hasImportEmails: 'false', importPeriodSelected: 'n/a' });
        });

        it('reports an error with what stopped the flow, and keeps the timer for a retry', () => {
            const { reports } = mockAccountImportFlowTracker();

            trackAccountImportBYOEStarted({
                source: EASY_SWITCH_SOURCES.MAIL_WEB_CHECKLIST_BYOE,
                provider: 'google',
                isConversion: false,
                variant: 'n/a',
            });
            trackAccountImportBYOEError({ provider: 'google', errorStep: 'authentication', variant: 'n/a' });
            trackAccountImportBYOEAuthenticated({ provider: 'google', variant: 'n/a' });

            expect(reports[1].event).toBe('flow_error');
            expect(reports[1].dimensions).toEqual({
                flow: 'byoe',
                provider: 'google',
                errorStep: 'authentication',
                variant: 'n/a',
            });
            expect(reports[1].values).toHaveProperty('activeMs');
            expect(reports[2].values).toHaveProperty('activeMs');
        });

        it('sends the claim, linked and address modals as steps with actions, without a duration', () => {
            const { reports } = mockAccountImportFlowTracker();

            trackAccountImportClaimableAddressModalShown();
            trackAccountImportClaimableAddressModalAction('learn_more');
            trackAccountImportLinkedAddressModalShown();
            trackAccountImportLinkedAddressModalAction('got_it');
            trackAccountImportBYOEAddressAction('disconnect');

            expect(reports.map(({ event, dimensions }) => [event, dimensions])).toEqual([
                ['step_load', { flow: 'byoe', step: 'claimable_address_modal' }],
                ['step_interacted', { flow: 'byoe', step: 'claimable_address_modal', action: 'learn_more' }],
                ['step_load', { flow: 'byoe', step: 'linked_address_modal' }],
                ['step_interacted', { flow: 'byoe', step: 'linked_address_modal', action: 'got_it' }],
                [
                    'step_interacted',
                    { flow: 'byoe', step: 'address_management', action: 'disconnect', provider: 'google' },
                ],
            ]);
        });

        it('keeps the time across a page reload', () => {
            const now = jest.spyOn(Date, 'now').mockReturnValue(100_000);
            const { reports } = mockAccountImportFlowTracker();
            expect(getAccountImportBYOEStartedAt()).toBeUndefined();

            resumeAccountImportBYOE(100_000 - 12_000);
            expect(getAccountImportBYOEStartedAt()).toBe(88_000);
            trackAccountImportBYOEAuthenticated({ provider: 'google', variant: 'n/a' });

            expect(reports[0].values).toMatchObject({ activeMs: 12_000, timestampMs: 100_000 });
            now.mockRestore();
        });
    });

    describe('Easy Switch', () => {
        it('describes the creation with flow, step and the products', () => {
            const { reports } = mockAccountImportFlowTracker();
            const products = [ImportType.MAIL, ImportType.CONTACTS];
            const source = EASY_SWITCH_SOURCES.MAIL_WEB_CHECKLIST_BYOE;

            trackAccountImportEasySwitchStarted({ source, provider: ImportProvider.OUTLOOK });
            trackAccountImportEasySwitchProductsSubmitted({ source, provider: ImportProvider.OUTLOOK, products });
            trackAccountImportEasySwitchInstructionsViewed({ provider: ImportProvider.OUTLOOK, products });
            trackAccountImportEasySwitchCustomizeViewed({
                provider: ImportProvider.DEFAULT,
                products,
                importPeriod: undefined,
            });
            trackAccountImportEasySwitchError({
                provider: ImportProvider.DEFAULT,
                products,
                errorStep: 'import_start',
            });
            trackAccountImportEasySwitchFinished({
                provider: ImportProvider.DEFAULT,
                products,
                importPeriod: TIME_PERIOD.LAST_MONTH,
            });

            expect(reports.map(({ event }) => event)).toEqual([
                'step_load',
                'step_completed',
                'step_load',
                'step_load',
                'flow_error',
                'flow_finished',
            ]);
            expect(reports[0].dimensions).toEqual({
                flow: 'easy_switch',
                step: 'import_modal',
                source,
                provider: 'outlook',
            });
            const productDimensions = {
                importsMail: 'true',
                importsCalendar: 'false',
                importsContacts: 'true',
                importsDrive: 'false',
            };
            expect(reports[1].dimensions).toEqual({
                flow: 'easy_switch',
                step: 'import_modal',
                source,
                provider: 'outlook',
                ...productDimensions,
            });
            expect(reports[3].dimensions).toEqual({
                flow: 'easy_switch',
                step: 'customize_import',
                // "More import options"
                provider: 'imap',
                ...productDimensions,
                importPeriodSelected: 'n/a',
            });
            expect(reports[4].dimensions).toMatchObject({ flow: 'easy_switch', errorStep: 'import_start' });
            expect(reports[5].dimensions).toMatchObject({ importPeriodSelected: 'last_month' });
            reports.forEach((report) => {
                expect(report.values).toHaveProperty('timestampMs');
                expect(report.values).toHaveProperty('activeMs');
            });
        });

        it('does not borrow the time of a BYOE flow left running, for a step sent without its own start', () => {
            const { reports } = mockAccountImportFlowTracker();

            // The BYOE flow is abandoned or failed: its timer keeps running
            trackAccountImportBYOEStarted({
                source: EASY_SWITCH_SOURCES.MAIL_WEB_CHECKLIST_BYOE,
                provider: 'google',
                isConversion: false,
                variant: 'n/a',
            });
            // Drive-only imports never send the start of the Easy Switch flow
            trackAccountImportEasySwitchProductsSubmitted({
                source: EASY_SWITCH_SOURCES.MAIL_WEB_CHECKLIST_BYOE,
                provider: ImportProvider.GOOGLE,
                products: [ImportType.DRIVE],
            });

            expect(reports[0].values).toHaveProperty('activeMs');
            expect(reports[1].dimensions).toMatchObject({ flow: 'easy_switch', step: 'import_modal' });
            expect(reports[1].values).not.toHaveProperty('activeMs');
            expect(reports[1].values).toHaveProperty('timestampMs');
        });

        it('sends the actions on an import row as a step', () => {
            const { reports } = mockAccountImportFlowTracker();

            trackAccountImportReportAction({
                action: 'resume_import',
                isBYOE: true,
                provider: 'google',
                product: 'mail',
            });

            expect(reports[0].event).toBe('step_interacted');
            expect(reports[0].dimensions).toEqual({
                flow: 'easy_switch',
                step: 'import_report',
                action: 'resume_import',
                isBYOE: 'true',
                provider: 'google',
                product: 'mail',
            });
        });
    });

    it('is sent next to the BYOE creation funnel, which keeps its events', () => {
        const { reports } = mockTracker();

        trackBYOECreationStarted({
            source: EASY_SWITCH_SOURCES.MAIL_WEB_CHECKLIST_BYOE,
            isConversion: false,
            variant: 'control',
        });

        expect(reports.map(({ measurementGroup }) => measurementGroup)).toEqual([
            TelemetryMeasurementGroups.byoeCreationFunnel,
            TelemetryMeasurementGroups.accountImportFlow,
        ]);
    });
});

import { EASY_SWITCH_SOURCES, TIME_PERIOD } from '../interface';
import {
    getBYOECreationStartedAt,
    resumeBYOECreation,
    trackBYOEAuthenticated,
    trackBYOECreationError,
    trackBYOECreationStarted,
    trackBYOEGoogleSignInClicked,
    trackBYOEImporterCreated,
    trackBYOEUpsellModalViewed,
} from './byoeCreationFunnel';
import { mockBYOECreationFunnelTracker } from './mockTrackerOfGroup';

describe('BYOE creation funnel telemetry', () => {
    it('sends one event per step, with the duration on every step after the start', () => {
        const { reports } = mockBYOECreationFunnelTracker();

        trackBYOECreationStarted({ source: EASY_SWITCH_SOURCES.MAIL_WEB_CHECKLIST_BYOE, isConversion: false });
        trackBYOEGoogleSignInClicked({ hasImportEmails: true, importPeriod: TIME_PERIOD.LAST_YEAR });
        trackBYOEAuthenticated();
        trackBYOEImporterCreated({
            hasImportEmails: true,
            importPeriod: TIME_PERIOD.LAST_YEAR,
            isUpsellShown: true,
            isClaimedAddress: false,
        });
        trackBYOEUpsellModalViewed();

        expect(reports.map((report) => report.event)).toEqual([
            'creation_started',
            'google_sign_in_clicked',
            'authenticated',
            'importer_created',
            'upsell_modal_viewed',
        ]);
        expect(reports[0].dimensions).toEqual({
            source: 'mail-web-checklist-byoe',
            provider: 'google',
            isConversion: 'false',
            variant: 'n/a',
        });
        expect(reports[0].values).toEqual({});
        expect(reports[1].dimensions).toEqual({
            provider: 'google',
            hasImportEmails: 'true',
            importPeriodSelected: 'last_year',
            variant: 'n/a',
        });
        [1, 2, 3].forEach((index) => expect(reports[index].values).toHaveProperty('durationMs'));
        // The creation is over once the address exists, the upsell modal comes after
        expect(reports[4].values).toEqual({});
    });

    it('sends the variant of the experiment on every step', () => {
        const { reports } = mockBYOECreationFunnelTracker();

        trackBYOECreationStarted({
            source: EASY_SWITCH_SOURCES.MAIL_WEB_CHECKLIST_BYOE,
            isConversion: false,
            variant: 'treatment',
        });
        trackBYOEGoogleSignInClicked({ hasImportEmails: true, importPeriod: TIME_PERIOD.LAST_YEAR });
        trackBYOEAuthenticated();
        trackBYOECreationError('address_creation');
        trackBYOEImporterCreated({
            hasImportEmails: true,
            importPeriod: TIME_PERIOD.LAST_YEAR,
            isUpsellShown: true,
            isClaimedAddress: false,
        });
        trackBYOEUpsellModalViewed();

        expect(reports).toHaveLength(6);
        reports.forEach((report) => expect(report.dimensions).toHaveProperty('variant', 'treatment'));

        // A new creation starts without a variant unless told otherwise
        trackBYOECreationStarted({ source: EASY_SWITCH_SOURCES.MAIL_WEB_CHECKLIST_BYOE, isConversion: false });
        expect(reports[6].dimensions).toHaveProperty('variant', 'n/a');
    });

    it('keeps the duration across a page reload', () => {
        const now = jest.spyOn(Date, 'now').mockReturnValue(100_000);
        const { reports } = mockBYOECreationFunnelTracker();
        expect(getBYOECreationStartedAt()).toBeUndefined();

        // Back on a fresh page: the in-memory timer is gone, it is restored from the saved timestamp
        resumeBYOECreation(100_000 - 12_000);
        now.mockReturnValue(100_000);
        trackBYOEAuthenticated();
        trackBYOECreationError('authentication');

        expect(reports.map((report) => report.event)).toEqual(['authenticated', 'creation_error']);
        reports.forEach((report) => expect(report.values?.durationMs).toBeGreaterThanOrEqual(12_000));
        expect(getBYOECreationStartedAt()).toBeLessThanOrEqual(88_000);
    });

    it('does not start a timer when there is no saved timestamp', () => {
        const { reports } = mockBYOECreationFunnelTracker();
        resumeBYOECreation(undefined);
        trackBYOEAuthenticated();
        expect(reports[0].values).toEqual({});
    });

    it('has no period when the user does not import emails or could not choose one', () => {
        const { reports } = mockBYOECreationFunnelTracker();

        trackBYOEGoogleSignInClicked({ hasImportEmails: false, importPeriod: TIME_PERIOD.BIG_BANG });
        trackBYOEGoogleSignInClicked({ hasImportEmails: true, importPeriod: undefined });

        expect(reports[0].dimensions).toMatchObject({ importPeriodSelected: 'n/a' });
        expect(reports[1].dimensions).toMatchObject({ importPeriodSelected: 'n/a' });
    });

    it('flushes every event right away so they keep their order', () => {
        const { reports } = mockBYOECreationFunnelTracker();

        trackBYOECreationStarted({ source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS, isConversion: false });
        trackBYOEGoogleSignInClicked({ hasImportEmails: true, importPeriod: undefined });
        trackBYOEAuthenticated();
        trackBYOEUpsellModalViewed();
        trackBYOEImporterCreated({
            hasImportEmails: true,
            importPeriod: undefined,
            isUpsellShown: false,
            isClaimedAddress: false,
        });
        trackBYOECreationError('authentication');

        expect(reports).toHaveLength(6);
        reports.forEach((report) => expect(report.flushImmediately).toBe(true));
    });

    it('keeps the timer running after an error so a retry is still timed, and restarts it on a new creation', () => {
        const { reports } = mockBYOECreationFunnelTracker();

        trackBYOECreationStarted({ source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS, isConversion: true });
        trackBYOECreationError('address_creation');
        trackBYOEImporterCreated({
            hasImportEmails: true,
            importPeriod: undefined,
            isUpsellShown: false,
            isClaimedAddress: false,
        });
        trackBYOECreationError('address_creation');

        expect(reports[1].values).toHaveProperty('durationMs');
        expect(reports[2].values).toHaveProperty('durationMs');
        expect(reports[3].values?.durationMs).toBeUndefined();

        trackBYOECreationStarted({ source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS, isConversion: false });
        trackBYOEAuthenticated();
        expect(reports[5].values).toHaveProperty('durationMs');
    });
});

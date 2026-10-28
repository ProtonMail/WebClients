import { EASY_SWITCH_SOURCES, ImportProvider, ImportType, TIME_PERIOD } from '../interface';
import {
    getTelemetryImportPeriod,
    getTelemetryProducts,
    trackEasySwitchCreationError,
    trackEasySwitchCreationStarted,
    trackEasySwitchImporterCreated,
    trackEasySwitchInstructionsViewed,
    trackEasySwitchPrepareImportViewed,
    trackEasySwitchProductsSubmitted,
} from './easySwitchCreationFunnel';
import { mockEasySwitchCreationFunnelTracker } from './mockTrackerOfGroup';

describe('easy switch creation funnel telemetry', () => {
    describe('getTelemetryProducts', () => {
        it('sets one boolean per product', () => {
            expect(getTelemetryProducts([ImportType.CONTACTS, ImportType.MAIL])).toEqual({
                importsMail: true,
                importsCalendar: false,
                importsContacts: true,
                importsDrive: false,
            });
        });

        it('sets every boolean to false when there is no product', () => {
            const none = { importsMail: false, importsCalendar: false, importsContacts: false, importsDrive: false };
            expect(getTelemetryProducts([])).toEqual(none);
            expect(getTelemetryProducts(undefined)).toEqual(none);
        });
    });

    it('returns n/a when the import period is unknown', () => {
        expect(getTelemetryImportPeriod(undefined)).toBe('n/a');
        expect(getTelemetryImportPeriod(TIME_PERIOD.LAST_YEAR)).toBe('last_year');
    });

    it('sends one event per step, and the duration on every step after the start', () => {
        const { reports } = mockEasySwitchCreationFunnelTracker();
        const provider = ImportProvider.DEFAULT;
        const products = [ImportType.MAIL];

        trackEasySwitchCreationStarted({ source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS, provider });
        trackEasySwitchProductsSubmitted({ source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS, provider, products });
        trackEasySwitchInstructionsViewed({ provider, products });
        trackEasySwitchPrepareImportViewed({ provider, products, importPeriod: TIME_PERIOD.BIG_BANG });
        trackEasySwitchImporterCreated({ provider, products, importPeriod: TIME_PERIOD.LAST_MONTH });

        expect(reports.map((report) => report.event)).toEqual([
            'creation_started',
            'products_submitted',
            'instructions_viewed',
            'prepare_import_viewed',
            'importer_created',
        ]);
        // Flushed one by one: batched events share the same timestamp and cannot be ordered
        reports.forEach((report) => expect(report.flushImmediately).toBe(true));
        expect(reports[0].dimensions).toEqual({ source: 'account-web-settings', provider: 'imap' });
        expect(reports[0].values).toEqual({});
        reports.slice(1).forEach((report) => expect(report.values).toHaveProperty('durationMs'));
        expect(reports[4].dimensions).toEqual({
            provider: 'imap',
            importsMail: 'true',
            importsCalendar: 'false',
            importsContacts: 'false',
            importsDrive: 'false',
            importPeriodSelected: 'last_month',
        });
    });

    it('stops the timer on importer_created, and keeps it running after an error so a retry is still timed', () => {
        const { reports } = mockEasySwitchCreationFunnelTracker();
        const context = { provider: ImportProvider.YAHOO, products: [ImportType.MAIL] };

        trackEasySwitchCreationStarted({
            source: EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS,
            provider: context.provider,
        });
        trackEasySwitchCreationError({ ...context, errorStep: 'import_start' });
        trackEasySwitchImporterCreated({ ...context, importPeriod: undefined });
        trackEasySwitchCreationError({ ...context, errorStep: 'import_start' });

        expect(reports[1].values).toHaveProperty('durationMs');
        expect(reports[2].values).toHaveProperty('durationMs');
        // Timer already stopped: no duration instead of a wrong one
        expect(reports[3].values?.durationMs).toBeUndefined();
    });

    it('ignores the steps of drive-only imports after the products are submitted', () => {
        const { reports } = mockEasySwitchCreationFunnelTracker();
        const context = { provider: ImportProvider.GOOGLE, products: [ImportType.DRIVE] };

        trackEasySwitchProductsSubmitted({ source: EASY_SWITCH_SOURCES.DRIVE_WEB_SIDEBAR, ...context });
        // Sent on purpose: the product selection modal sends creation_started before the products are known
        expect(reports.map((report) => report.event)).toEqual(['products_submitted']);
        expect(reports[0].dimensions).toMatchObject({ importsDrive: 'true', importsMail: 'false' });

        trackEasySwitchInstructionsViewed(context);
        trackEasySwitchPrepareImportViewed({ ...context, importPeriod: undefined });
        trackEasySwitchImporterCreated({ ...context, importPeriod: undefined });
        trackEasySwitchCreationError({ ...context, errorStep: 'importer_creation' });

        expect(reports).toHaveLength(1);
    });
});

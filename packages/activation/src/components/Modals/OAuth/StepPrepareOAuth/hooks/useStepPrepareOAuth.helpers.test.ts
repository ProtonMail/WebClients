import { MailImportFolder } from '@proton/activation/src/helpers/MailImportFoldersParser/MailImportFoldersParser';
import {
    ImportType,
    MailImportDestinationFolder,
    MailImportGmailCategories,
    TIME_PERIOD,
} from '@proton/activation/src/interface';
import { ImporterCalendar, ImporterData } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.interface';
import { generateMockAddress } from '@proton/activation/src/tests/data/addresses';
import { Label } from '@proton/shared/lib/interfaces';
import { Folder } from '@proton/shared/lib/interfaces/Folder';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import { generateOwnedPersonalCalendars } from '@proton/testing/lib/builders';

import { getMailCustomLabel, importerHasErrors } from './useStepPrepareOAuth.helpers';

const dummyCalendar: ImporterCalendar = {
    source: 'source',
    description: 'description',
    id: 'id 1',
    checked: true,
};

const dummyFolder: MailImportFolder = {
    id: 'id',
    checked: true,
    color: 'test color',
    isSystemFolderChild: false,
    folderChildIDS: [''],
    protonPath: [
        'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean m',
    ],
    providerPath: ['providerPath'],
    separator: '/',
    size: 0,
    category: undefined,
    folderParentID: '',
    systemFolder: MailImportDestinationFolder.ARCHIVE,
};

const dummyShortPathFolder: MailImportFolder = {
    id: 'id',
    checked: true,
    color: 'test color',
    isSystemFolderChild: false,
    folderChildIDS: [''],
    protonPath: ['Lorem'],
    providerPath: ['providerPath'],
    separator: '/',
    size: 0,
    category: undefined,
    folderParentID: '',
    systemFolder: MailImportDestinationFolder.ARCHIVE,
};

describe('getMailCustomLabel', () => {
    it('Should return the appropriate mail label', () => {
        const labelBigBang = getMailCustomLabel(TIME_PERIOD.BIG_BANG);
        expect(labelBigBang).toBe('Emails (all messages)');
        const labelLastYear = getMailCustomLabel(TIME_PERIOD.LAST_YEAR);
        expect(labelLastYear).toBe('Emails (last 12 months)');
        const label3Month = getMailCustomLabel(TIME_PERIOD.LAST_3_MONTHS);
        expect(label3Month).toBe('Emails (last 3 months)');
        const label1Month = getMailCustomLabel(TIME_PERIOD.LAST_MONTH);
        expect(label1Month).toBe('Emails (last month)');
        const labelDefault = getMailCustomLabel();
        expect(labelDefault).toBe('Email');
    });
});

describe('importerHasErrors calendar tests', () => {
    it('Should return an error if number of calendars exceed MAX_CALENDARS_PAID for paid user (max 25)', () => {
        const dummyCalendarArray = Array(20).fill(dummyCalendar);
        const products: ImportType[] = [ImportType.CALENDAR];
        const importerData: ImporterData = {
            importedEmail: 'test@proton.me',
            importerId: '1',
            calendars: { calendars: dummyCalendarArray },
        };
        const labels: Label[] = [];
        const folders: Folder[] = [];
        const calendars: VisualCalendar[] = generateOwnedPersonalCalendars(10);
        const mailChecked = false;
        const calendarChecked = true;
        const isFreeUser = false;

        const errors = importerHasErrors(
            products,
            importerData,
            labels,
            folders,
            calendars,
            mailChecked,
            calendarChecked,
            true,
            isFreeUser
        );

        expect(errors).toBe(true);
    });

    it('Should NOT return an error if number of calendars is below MAX_CALENDARS_PAID for paid user (max 25)', () => {
        const dummyCalendarArray = Array(20).fill(dummyCalendar);
        const products: ImportType[] = [ImportType.CALENDAR];
        const importerData: ImporterData = {
            importedEmail: 'test@proton.me',
            importerId: '1',
            calendars: { calendars: dummyCalendarArray },
        };
        const labels: Label[] = [];
        const folders: Folder[] = [];
        const calendars: VisualCalendar[] = generateOwnedPersonalCalendars(2);
        const mailChecked = false;
        const calendarChecked = true;
        const isFreeUser = false;

        const errors = importerHasErrors(
            products,
            importerData,
            labels,
            folders,
            calendars,
            mailChecked,
            calendarChecked,
            true,
            isFreeUser
        );

        expect(errors).toBe(false);
    });

    it('Should return an error if number of calendars exceed MAX_CALENDARS_FREE for free user (max 3)', () => {
        const dummyCalendarArray = Array(25).fill(dummyCalendar);
        const products: ImportType[] = [ImportType.CALENDAR];
        const importerData: ImporterData = {
            importedEmail: 'test@proton.me',
            importerId: '1',
            calendars: { calendars: dummyCalendarArray },
        };
        const labels: Label[] = [];
        const folders: Folder[] = [];
        const calendars: VisualCalendar[] = generateOwnedPersonalCalendars(10);
        const mailChecked = false;
        const calendarChecked = true;
        const isFreeUser = true;

        const errors = importerHasErrors(
            products,
            importerData,
            labels,
            folders,
            calendars,
            mailChecked,
            calendarChecked,
            true,
            isFreeUser
        );

        expect(errors).toBe(true);
    });

    it('Should NOT return an error if number of calendars is below MAX_CALENDARS_FREE for paid user (max 3)', () => {
        const dummyCalendarArray = Array(1).fill(dummyCalendar);
        const products: ImportType[] = [ImportType.CALENDAR];
        const importerData: ImporterData = {
            importedEmail: 'test@proton.me',
            importerId: '1',
            calendars: { calendars: dummyCalendarArray },
        };
        const labels: Label[] = [];
        const folders: Folder[] = [];
        const calendars: VisualCalendar[] = generateOwnedPersonalCalendars(1);
        const mailChecked = false;
        const calendarChecked = true;
        const isFreeUser = true;

        const errors = importerHasErrors(
            products,
            importerData,
            labels,
            folders,
            calendars,
            mailChecked,
            calendarChecked,
            true,
            isFreeUser
        );

        expect(errors).toBe(false);
    });
});

describe('importerHasErrors test check and general behavior', () => {
    it('Should not return an error if number of calendars exceed MAX_CALENDARS_PAID but no calendar product', () => {
        const dummyCalendarArray = Array(20).fill(dummyCalendar);
        const products: ImportType[] = [ImportType.CONTACTS];
        const importerData: ImporterData = {
            importedEmail: 'test@proton.me',
            importerId: '1',
            calendars: { calendars: dummyCalendarArray },
        };
        const labels: Label[] = [];
        const folders: Folder[] = [];
        const calendars: VisualCalendar[] = generateOwnedPersonalCalendars(1);
        const mailChecked = false;
        const calendarChecked = true;

        const errors = importerHasErrors(
            products,
            importerData,
            labels,
            folders,
            calendars,
            mailChecked,
            calendarChecked,
            true,
            true
        );

        expect(errors).toBe(false);
    });

    it('Should not return an error if number of calendars exceed MAX_CALENDARS_PAID but calendar not checked', () => {
        const dummyCalendarArray = Array(20).fill(dummyCalendar);
        const products: ImportType[] = [ImportType.CALENDAR];
        const importerData: ImporterData = {
            importedEmail: 'test@proton.me',
            importerId: '1',
            calendars: { calendars: dummyCalendarArray },
        };
        const labels: Label[] = [];
        const folders: Folder[] = [];
        const calendars: VisualCalendar[] = generateOwnedPersonalCalendars(1);
        const mailChecked = false;
        const calendarChecked = false;

        const errors = importerHasErrors(
            products,
            importerData,
            labels,
            folders,
            calendars,
            mailChecked,
            calendarChecked,
            true,
            false
        );

        expect(errors).toBe(false);
    });

    it('Should return no errors', () => {
        const products: ImportType[] = [ImportType.CONTACTS];
        const importerData: ImporterData = { importedEmail: 'test@proton.me', importerId: '1' };
        const labels: Label[] = [];
        const folders: Folder[] = [];
        const calendars: VisualCalendar[] = [];
        const mailChecked = false;
        const calendarChecked = false;

        const errors = importerHasErrors(
            products,
            importerData,
            labels,
            folders,
            calendars,
            mailChecked,
            calendarChecked,
            true,
            true
        );
        expect(errors).toBe(false);
    });

    it('Should return an error if email mapping has errors', () => {
        const products: ImportType[] = [ImportType.MAIL];
        const importerData: ImporterData = {
            importedEmail: 'test@proton.me',
            importerId: '1',
            emails: {
                fields: {
                    importAddress: generateMockAddress(0, true),
                    mapping: [dummyFolder, dummyFolder],
                    importPeriod: TIME_PERIOD.BIG_BANG,
                    importLabel: { Color: 'red', Name: 'name', Type: 1 },
                    importCategoriesDestination: MailImportDestinationFolder.ALL_DRAFTS,
                },
            },
        };
        const labels: Label[] = [];
        const folders: Folder[] = [
            {
                ID: 'id',
                Name: 'path',
                Color: 'red',
                Path: 'path',
                Expanded: 1,
                Type: 1,
                Order: 1,
                ParentID: '',
                Notify: 1,
            },
        ];
        const calendars: VisualCalendar[] = [];
        const mailChecked = true;
        const calendarChecked = false;

        const errors = importerHasErrors(
            products,
            importerData,
            labels,
            folders,
            calendars,
            mailChecked,
            calendarChecked,
            true,
            false
        );
        expect(errors).toBe(true);
    });

    it('Should not return an error if email mapping has errors but is not in products', () => {
        const products: ImportType[] = [ImportType.CONTACTS];
        const importerData: ImporterData = {
            importedEmail: 'test@proton.me',
            importerId: '1',
            emails: {
                fields: {
                    importAddress: generateMockAddress(0, true),
                    mapping: [dummyFolder, dummyFolder],
                    importPeriod: TIME_PERIOD.BIG_BANG,
                    importLabel: { Color: 'red', Name: 'name', Type: 1 },
                    importCategoriesDestination: MailImportDestinationFolder.ALL_DRAFTS,
                },
            },
        };
        const labels: Label[] = [];
        const folders: Folder[] = [
            {
                ID: 'id',
                Name: 'path',
                Color: 'red',
                Path: 'path',
                Expanded: 1,
                Type: 1,
                Order: 1,
                ParentID: '',
                Notify: 1,
            },
        ];
        const calendars: VisualCalendar[] = [];
        const mailChecked = false;
        const calendarChecked = false;

        const errors = importerHasErrors(
            products,
            importerData,
            labels,
            folders,
            calendars,
            mailChecked,
            calendarChecked,
            true,
            false
        );
        expect(errors).toBe(false);
    });

    it('Should not return an error if email mapping has errors but is unchecked', () => {
        const products: ImportType[] = [ImportType.MAIL];
        const importerData: ImporterData = {
            importedEmail: 'test@proton.me',
            importerId: '1',
            emails: {
                fields: {
                    importAddress: generateMockAddress(0, true),
                    mapping: [dummyFolder, dummyFolder],
                    importPeriod: TIME_PERIOD.BIG_BANG,
                    importLabel: { Color: 'red', Name: 'name', Type: 1 },
                    importCategoriesDestination: MailImportDestinationFolder.ALL_DRAFTS,
                },
            },
        };
        const labels: Label[] = [];
        const folders: Folder[] = [
            {
                ID: 'id',
                Name: 'path',
                Color: 'red',
                Path: 'path',
                Expanded: 1,
                Type: 1,
                Order: 1,
                ParentID: '',
                Notify: 1,
            },
        ];
        const calendars: VisualCalendar[] = [];
        const mailChecked = false;
        const calendarChecked = false;

        const errors = importerHasErrors(
            products,
            importerData,
            labels,
            folders,
            calendars,
            mailChecked,
            calendarChecked,
            true,
            false
        );
        expect(errors).toBe(false);
    });

    it('Should not return an error if email mapping has errors but no mapping', () => {
        const products: ImportType[] = [ImportType.MAIL];
        const importerData: ImporterData = {
            importedEmail: 'test@proton.me',
            importerId: '1',
        };
        const labels: Label[] = [];
        const folders: Folder[] = [
            {
                ID: 'id',
                Name: 'path',
                Color: 'red',
                Path: 'path',
                Expanded: 1,
                Type: 1,
                Order: 1,
                ParentID: '',
                Notify: 1,
            },
        ];
        const calendars: VisualCalendar[] = [];
        const mailChecked = false;
        const calendarChecked = false;

        const errors = importerHasErrors(
            products,
            importerData,
            labels,
            folders,
            calendars,
            mailChecked,
            calendarChecked,
            true,
            false
        );
        expect(errors).toBe(false);
    });
});

describe('importerHasErrors test for Gmail imports', () => {
    const socialFolder = {
        id: 'id',
        checked: true,
        color: 'test color',
        isSystemFolderChild: false,
        folderChildIDS: [''],
        protonPath: ['Social'],
        providerPath: ['Social'],
        separator: '/',
        size: 0,
        category: MailImportGmailCategories.SOCIAL,
        folderParentID: '',
        systemFolder: MailImportDestinationFolder.ARCHIVE,
    };

    it('Should not return an error when Social folder and label exists when Gmail import', () => {
        const products: ImportType[] = [ImportType.MAIL];

        const importerData: ImporterData = {
            importedEmail: 'test@proton.me',
            importerId: '1',
            emails: {
                fields: {
                    importAddress: generateMockAddress(0, true),
                    mapping: [dummyShortPathFolder, dummyShortPathFolder, socialFolder],
                    importPeriod: TIME_PERIOD.BIG_BANG,
                    importLabel: { Color: 'red', Name: 'name', Type: 1 },
                    importCategoriesDestination: MailImportDestinationFolder.ALL_DRAFTS,
                },
            },
        };
        const labels: Label[] = [
            {
                ID: 'id',
                Name: 'Social',
                Color: 'color',
                Type: 1,
                Order: 1,
                Path: 'Social',
            },
        ];
        const folders: Folder[] = [
            {
                ID: 'id',
                Name: 'Social',
                Color: 'red',
                Path: '/Social',
                Expanded: 1,
                Type: 1,
                Order: 1,
                ParentID: '',
                Notify: 1,
            },
        ];
        const calendars: VisualCalendar[] = [];
        const mailChecked = true;
        const calendarChecked = false;

        const errors = importerHasErrors(
            products,
            importerData,
            labels,
            folders,
            calendars,
            mailChecked,
            calendarChecked,
            true,
            false
        );

        expect(errors).toBe(false);
    });

    it('Should not return an error when Social folder and label exists when non Gmail import', () => {
        const products: ImportType[] = [ImportType.MAIL];

        const importerData: ImporterData = {
            importedEmail: 'test@proton.me',
            importerId: '1',
            emails: {
                fields: {
                    importAddress: generateMockAddress(0, true),
                    mapping: [dummyShortPathFolder, dummyShortPathFolder, socialFolder],
                    importPeriod: TIME_PERIOD.BIG_BANG,
                    importLabel: { Color: 'red', Name: 'name', Type: 1 },
                    importCategoriesDestination: MailImportDestinationFolder.ALL_DRAFTS,
                },
            },
        };
        const labels: Label[] = [
            {
                ID: 'id',
                Name: 'Social',
                Color: 'color',
                Type: 1,
                Order: 1,
                Path: 'Social',
            },
        ];
        const folders: Folder[] = [
            {
                ID: 'id',
                Name: 'Social',
                Color: 'red',
                Path: '/Social',
                Expanded: 1,
                Type: 1,
                Order: 1,
                ParentID: '',
                Notify: 1,
            },
        ];
        const calendars: VisualCalendar[] = [];
        const mailChecked = true;
        const calendarChecked = false;

        const errors = importerHasErrors(
            products,
            importerData,
            labels,
            folders,
            calendars,
            mailChecked,
            calendarChecked,
            false,
            false
        );

        expect(errors).toBe(true);
    });
});

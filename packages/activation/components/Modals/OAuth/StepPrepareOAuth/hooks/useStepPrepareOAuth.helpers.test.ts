import { MailImportFolder } from '@proton/activation/helpers/MailImportFoldersParser/MailImportFoldersParser';
import { ImportType, MailImportDestinationFolder, TIME_PERIOD } from '@proton/activation/interface';
import { ImporterCalendar, ImporterData } from '@proton/activation/logic/draft/oauthDraft/oauthDraft.interface';
import { mockAddresses } from '@proton/activation/tests/data/addresses';
import { CALENDAR_TYPE } from '@proton/shared/lib/calendar/constants';
import { Label } from '@proton/shared/lib/interfaces';
import { Folder } from '@proton/shared/lib/interfaces/Folder';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';

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

describe('useStepPrepare tests', () => {
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

    it('Should return no errors', () => {
        const products: ImportType[] = [ImportType.CONTACTS];
        const importerData: ImporterData = { importedEmail: 'test@proton.me', importerId: '1' };
        const labels: Label[] = [];
        const folders: Folder[] = [];
        const calendars: Calendar[] = [];
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
            true
        );
        expect(errors).toBe(false);
    });

    it('Should return an error if number of calendars exceed MAX_CALENDARS_PAID', () => {
        const dummyCalendarArray = Array(20).fill(dummyCalendar);
        const products: ImportType[] = [ImportType.CALENDAR];
        const importerData: ImporterData = {
            importedEmail: 'test@proton.me',
            importerId: '1',
            calendars: { calendars: dummyCalendarArray },
        };
        const labels: Label[] = [];
        const folders: Folder[] = [];
        const calendars: Calendar[] = [{ ID: 'id', Type: CALENDAR_TYPE.PERSONAL }];
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
            true
        );

        expect(errors).toBe(true);
    });

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
        const calendars: Calendar[] = [{ ID: 'id', Type: CALENDAR_TYPE.PERSONAL }];
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
        const calendars: Calendar[] = [{ ID: 'id', Type: CALENDAR_TYPE.PERSONAL }];
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
                    importAddress: mockAddresses[0],
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
        const calendars: Calendar[] = [];
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
            true
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
                    importAddress: mockAddresses[0],
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
        const calendars: Calendar[] = [];
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
            true
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
                    importAddress: mockAddresses[0],
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
        const calendars: Calendar[] = [];
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
            true
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
        const calendars: Calendar[] = [];
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
            true
        );
        expect(errors).toBe(false);
    });
});

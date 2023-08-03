import { differenceInMonths, fromUnixTime } from 'date-fns';

import { ApiMailImporterFolder } from '@proton/activation/src/api/api.interface';
import MailImportFoldersParser from '@proton/activation/src/helpers/MailImportFoldersParser/MailImportFoldersParser';
import { MailImportDestinationFolder, MailImportMapping, TIME_PERIOD } from '@proton/activation/src/interface';
import { standardFolderResponse } from '@proton/activation/src/tests/data/gmail.formattedResponse';
import { gmailImapResponse } from '@proton/activation/src/tests/data/gmail.imap.formattedResponse';
import gmailImapModalLabels from '@proton/activation/src/tests/data/gmail.imap.providerFolders';
import labels from '@proton/activation/src/tests/data/gmail.providerFolders';
import { ADDRESS_STATUS, ADDRESS_TYPE } from '@proton/shared/lib/constants';
import { Address } from '@proton/shared/lib/interfaces';

import { formatPrepareStepPayload } from './StepPrepareImap.helpers';
import { StepPrepareData } from './useStepPrepareImap';

// used in MailFoldersMapping.getRandomLabelColor.
jest.mock('@proton/utils/randomIntFromInterval', () => () => 0);

const address: Address = {
    DisplayName: 'Testing',
    DomainID: 'proton.ch',
    Email: 'testing@proton.ch',
    HasKeys: 1,
    ID: 'ID',
    Keys: [],
    SignedKeyList: null,
    Order: 1,
    Priority: 1,
    Receive: 1,
    Send: 1,
    Signature: 'Testing signature',
    Status: ADDRESS_STATUS.STATUS_ENABLED,
    Type: ADDRESS_TYPE.TYPE_ORIGINAL,
    ProtonMX: true,
};

const providerLabels = labels.map((label) => {
    return { ...label, Size: 1 } as ApiMailImporterFolder;
});

const correctData = {
    email: 'string',
    importerID: 'importerID',
    password: 'password',
};

const updatedFields = {
    updatedLabel: true,
    updatedPeriod: true,
    updatedMapping: true,
};

const isLabelMapping = true;
function getBaseFields(labels?: ApiMailImporterFolder[]) {
    return {
        mapping: new MailImportFoldersParser(labels ?? providerLabels, isLabelMapping).folders,
        importLabel: { Color: '#fff', Name: 'label', Type: 1 },
        importPeriod: TIME_PERIOD.BIG_BANG,
        importAddress: address,
        importCategoriesDestination: MailImportDestinationFolder.INBOX,
    };
}

describe('Step prepare helpers tests', () => {
    describe('formatPrepareStepPayload', () => {
        it('Should return a standard payload (All time)', () => {
            const fields: StepPrepareData['fields'] = getBaseFields();
            const res = formatPrepareStepPayload({ isLabelMapping, data: correctData, fields, updatedFields });
            expect(res).toEqual(standardFolderResponse);
        });

        it('Should return a standard payload (last year)', () => {
            const fieldsOneYear: StepPrepareData['fields'] = {
                ...getBaseFields(),
                importPeriod: TIME_PERIOD.LAST_YEAR,
            };
            const res = formatPrepareStepPayload({
                isLabelMapping,
                data: correctData,
                fields: fieldsOneYear,
                updatedFields,
            });
            const { StartTime } = res.Mail;

            let diff = -1;
            if (StartTime instanceof Date) {
                diff = differenceInMonths(new Date(), StartTime);
            } else {
                const start = fromUnixTime(StartTime!);
                diff = differenceInMonths(new Date(), start);
            }
            expect(diff).toBe(12);
        });

        it('Should return a standard payload (3 last months)', () => {
            const fieldsThreeMonts: StepPrepareData['fields'] = {
                ...getBaseFields(),
                importPeriod: TIME_PERIOD.LAST_3_MONTHS,
            };
            const res = formatPrepareStepPayload({
                isLabelMapping,
                data: correctData,
                fields: fieldsThreeMonts,
                updatedFields,
            });
            const { StartTime } = res.Mail;

            let diff = -1;
            if (StartTime instanceof Date) {
                diff = differenceInMonths(new Date(), StartTime);
            } else {
                const start = fromUnixTime(StartTime!);
                diff = differenceInMonths(new Date(), start);
            }
            expect(diff).toBe(3);
        });

        it('Should return a standard payload (last month)', () => {
            const fieldsOneMonth: StepPrepareData['fields'] = {
                ...getBaseFields(),
                importPeriod: TIME_PERIOD.LAST_MONTH,
            };
            const res = formatPrepareStepPayload({
                isLabelMapping,
                data: correctData,
                fields: fieldsOneMonth,
                updatedFields,
            });
            const { StartTime } = res.Mail;

            let diff = -1;
            if (StartTime instanceof Date) {
                diff = differenceInMonths(new Date(), StartTime);
            } else {
                const start = fromUnixTime(StartTime!);
                diff = differenceInMonths(new Date(), start);
            }
            expect(diff).toBe(1);
        });

        it('Should throw an error if importer ID is undefined ', () => {
            const fields: StepPrepareData['fields'] = getBaseFields();
            const faultyData = {
                email: 'string',
                providerFolders: providerLabels,
                importerID: undefined,
                password: 'password',
            };

            expect(() =>
                formatPrepareStepPayload({ isLabelMapping, data: faultyData, fields, updatedFields })
            ).toThrowError('Importer ID should be defined');
        });

        it('Should not submit unchecked folders', () => {
            const fields: StepPrepareData['fields'] = {
                ...getBaseFields(),
                mapping: new MailImportFoldersParser(providerLabels, isLabelMapping).folders.map((folder) => ({
                    ...folder,
                    checked: false,
                })),
            };

            expect(
                formatPrepareStepPayload({ isLabelMapping, data: correctData, fields, updatedFields }).Mail.Mapping
                    .length
            ).toBe(0);
        });

        it('Should send correctly formatted folders depth into payload', () => {
            const isLabelMapping = false;
            const fields: StepPrepareData['fields'] = {
                ...getBaseFields(),
                mapping: new MailImportFoldersParser(
                    ['dude 1', 'dude 1/dude 2', 'dude 1/dude 2/dude 3', 'dude 1/dude 2/dude 3/dude 4'].map(
                        (path) =>
                            ({
                                Source: path,
                                Separator: '/',
                            } as ApiMailImporterFolder)
                    ),
                    isLabelMapping
                ).folders,
            };

            expect(
                formatPrepareStepPayload({ isLabelMapping, data: correctData, fields, updatedFields }).Mail.Mapping.map(
                    (item) => item.Destinations.FolderPath
                )
            ).toEqual(['dude 1', 'dude 1/dude 2', 'dude 1/dude 2/dude 3', 'dude 1/dude 2/dude 3\\/dude 4']);
        });

        it('Should return correct payload when using Gmail account on IMAP modal', () => {
            const gmailImapLabels = gmailImapModalLabels.map((label) => {
                return { ...label, Size: 1 } as ApiMailImporterFolder;
            });
            const fields: StepPrepareData['fields'] = getBaseFields(gmailImapLabels);

            const res = formatPrepareStepPayload({
                isLabelMapping,
                data: correctData,
                fields,
                updatedFields,
            });
            expect(res).toEqual(gmailImapResponse);
        });

        describe('Should add `folderPath` and `label` on specific conditions', () => {
            const labels = getBaseFields(
                ['Inbox', 'dude 1', 'dude 1/dude 2'].map(
                    (path) =>
                        ({
                            Source: path,
                            Separator: '/',
                            ...(path === 'Inbox' ? { DestinationFolder: 'Inbox' } : {}),
                        } as ApiMailImporterFolder)
                )
            );
            const res = formatPrepareStepPayload({
                isLabelMapping,
                data: correctData,
                fields: labels,
                updatedFields,
            });

            it('should contain folderPath if destination folder', () => {
                const destinationFolder = res.Mail.Mapping.find(
                    (label) => label.Source === 'Inbox'
                ) as MailImportMapping;

                expect(destinationFolder.Source).toEqual('Inbox');
                expect('Labels' in destinationFolder.Destinations).toBe(false);
                expect('FolderPath' in destinationFolder.Destinations).toBe(true);
                expect(destinationFolder.Destinations.FolderPath).toBe('Inbox');
            });

            it('should contain Label if label', () => {
                const parentFolder = res.Mail.Mapping.find((label) => label.Source === 'dude 1') as MailImportMapping;

                expect(parentFolder.Source).toEqual('dude 1');
                expect('Labels' in parentFolder.Destinations).toBe(true);
                expect('FolderPath' in parentFolder.Destinations).toBe(false);
                expect(parentFolder.Destinations.Labels?.[0].Name).toBe('dude 1');
            });
        });
    });
});

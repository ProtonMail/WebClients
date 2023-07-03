import { getUnixTime, subMonths, subYears } from 'date-fns';

import { ApiStartImportParams } from '@proton/activation/src/api/api.interface';
import { GMAIL_CATEGORIES, MAX_FOLDERS_DEPTH } from '@proton/activation/src/constants';
import {
    CustomFieldsBitmap,
    ImportType,
    MailImportGmailCategories,
    MailImportMapping,
    TIME_PERIOD,
} from '@proton/activation/src/interface';
import { RequireSome } from '@proton/shared/lib/interfaces';

import { StepPrepareData } from './useStepPrepareImap';

const generateCustomFieldBitmap = ({
    updatedMapping,
    updatedLabel,
    updatedPeriod,
}: Record<'updatedMapping' | 'updatedLabel' | 'updatedPeriod', boolean>) => {
    let CustomFields = 0;

    if (updatedMapping) {
        CustomFields += CustomFieldsBitmap.Mapping;
    }
    if (updatedLabel) {
        CustomFields += CustomFieldsBitmap.Label;
    }
    if (updatedPeriod) {
        CustomFields += CustomFieldsBitmap.Period;
    }

    return CustomFields;
};

const getStartTimeFromTimePeriod = (importPeriod: TIME_PERIOD): number | undefined => {
    const now = new Date();
    let result: Date | undefined;

    switch (importPeriod) {
        case TIME_PERIOD.BIG_BANG:
            result = undefined;
            break;
        case TIME_PERIOD.LAST_YEAR:
            result = subYears(now, 1);
            break;
        case TIME_PERIOD.LAST_3_MONTHS:
            result = subMonths(now, 3);
            break;
        case TIME_PERIOD.LAST_MONTH:
            result = subMonths(now, 1);
            break;
        default:
            throw new Error('importPeriod should be specified');
    }

    return result ? getUnixTime(result) : undefined;
};

interface FormatProps {
    isLabelMapping: boolean;
    data: { email: string; importerID?: string; password?: string };
    fields: StepPrepareData['fields'];
    /** Fields used to generate a BITMAP for API */
    updatedFields: Record<'updatedMapping' | 'updatedLabel' | 'updatedPeriod', boolean>;
}

export const formatPrepareStepPayload = ({
    isLabelMapping,
    data,
    fields,
    updatedFields,
}: FormatProps): RequireSome<ApiStartImportParams, ImportType.MAIL> => {
    if (!data.importerID) {
        throw new Error('Importer ID should be defined');
    }

    const mapping = fields.mapping
        .filter((field) => field.checked)
        .map((folder) => {
            const Destinations: MailImportMapping['Destinations'] = (() => {
                let result = '';

                if (folder.category) {
                    result = fields.importCategoriesDestination;
                } else if (folder.systemFolder) {
                    result = folder.systemFolder;
                } else if (folder.protonPath.length < MAX_FOLDERS_DEPTH || folder.separator !== '/') {
                    result = folder.protonPath.join(folder.separator);
                }
                // Here separator is '/'
                else {
                    const itemsWithoutLast = folder.protonPath.slice(0, -1);
                    const escapedLastItem = (folder.protonPath.slice(-1).pop() || '').split('/').join('\\/');
                    result = [...itemsWithoutLast, escapedLastItem].join('/');
                }
                return { FolderPath: result };
            })();

            if (isLabelMapping && !folder.category && !folder.systemFolder) {
                Destinations.Labels = [
                    {
                        Name: folder.protonPath.join('-'),
                        Color: folder.color,
                    },
                ];

                // We delete the FolderPath if we're in folder mapping to avoid creating folders
                delete Destinations.FolderPath;
            }

            if (GMAIL_CATEGORIES.includes(folder.id as MailImportGmailCategories)) {
                Destinations.Category = folder.category;
            }

            return {
                Source: folder.id,
                Destinations,
                checked: true,
            };
        });

    return {
        ImporterID: data.importerID,
        [ImportType.MAIL]: {
            AddressID: fields.importAddress.ID,
            StartTime: getStartTimeFromTimePeriod(fields.importPeriod),
            Mapping: mapping,
            Code: data.password,
            CustomFields: generateCustomFieldBitmap(updatedFields),
            ImportLabel: fields.importLabel,
        },
    };
};

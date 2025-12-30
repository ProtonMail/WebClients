import isDeepEqual from 'lodash/isEqual';
import { c } from 'ttag';

import { startImportTask } from '@proton/activation/src/api';
import type { CalendarImportMapping, LaunchImportPayload } from '@proton/activation/src/interface';
import { ImportType, IsCustomCalendarMapping } from '@proton/activation/src/interface';
import { changeOAuthStep, resetOauthDraft } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.actions';
import type {
    ImporterCalendar,
    ImporterData,
} from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.interface';
import { createCalendar, updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import { setupCalendarKey } from '@proton/shared/lib/calendar/crypto/keys/setupCalendarKeys';
import { getRandomAccentColor } from '@proton/shared/lib/colors';
import { getTimezone } from '@proton/shared/lib/date/timezone';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { Address, Api } from '@proton/shared/lib/interfaces';
import type { Calendar } from '@proton/shared/lib/interfaces/calendar';
import type { GetAddressKeys } from '@proton/shared/lib/interfaces/hooks/GetAddressKeys';
import { getPrimaryKey } from '@proton/shared/lib/keys';
import isTruthy from '@proton/utils/isTruthy';

import { formatPrepareStepPayload } from '../../Imap/ImapMailModal/StepPrepareImap/StepPrepareImap.helpers';

interface StartImporterProps {
    api: Api;
    isLabelMapping: boolean;
    products: ImportType[];
    importerData: ImporterData;
    getAddressKeys: GetAddressKeys;
    availableAddresses: Address[];
    calendars: Calendar[];
    call: () => Promise<void>;
    dispatch: (val: any) => void;
    errorHandler: (data: any) => void;
    setIsCreatingCalendar: (val: boolean) => void;
    setIsCreatingImportTask: (val: boolean) => void;
    setCalendarsToBeCreated: (val: number) => void;
    increaseCalendarCount: () => void;
}

interface CreatedCalendarType extends ImporterCalendar {
    destination: string;
}

interface CreateCalendarProps {
    api: Api;
    calendars: ImporterCalendar[];
    hasNoCalendar: boolean;
    getAddressKeys: GetAddressKeys;
    increaseCreatedCalendarCount: () => void;
    activeAddresses?: Address[];
}

const createCalendars = async ({
    api,
    calendars,
    hasNoCalendar,
    getAddressKeys,
    activeAddresses,
    increaseCreatedCalendarCount,
}: CreateCalendarProps): Promise<CreatedCalendarType[]> => {
    if (!activeAddresses || !activeAddresses.length) {
        throw new Error(c('Error').t`No valid address found`);
    }

    const [{ ID: addressID }] = activeAddresses;
    const { privateKey: primaryAddressKey } = getPrimaryKey(await getAddressKeys(addressID)) || {};

    if (!primaryAddressKey) {
        throw new Error(c('Error').t`Primary address key is not decrypted.`);
    }

    const tempCalendars = await Promise.all(
        calendars.map(async (calendar) => {
            increaseCreatedCalendarCount();

            const { Calendar } = await api(
                createCalendar({
                    Name: calendar.source,
                    Color: getRandomAccentColor(),
                    Description: calendar.description,
                    Display: 1,
                    AddressID: addressID,
                    IsImport: 1,
                })
            );

            await setupCalendarKey({ api, calendarID: Calendar.ID, addressID, getAddressKeys });
            return { ...calendar, destination: Calendar.ID };
        })
    );

    if (hasNoCalendar) {
        await api(updateCalendarUserSettings({ PrimaryTimezone: getTimezone(), AutoDetectPrimaryTimezone: 1 }));
    }

    return tempCalendars;
};

export const createImporterTask = async ({
    isLabelMapping,
    products,
    importerData,
    api,
    getAddressKeys,
    dispatch,
    availableAddresses,
    calendars,
    call,
    errorHandler,
    setIsCreatingCalendar,
    setIsCreatingImportTask,
    setCalendarsToBeCreated,
    increaseCalendarCount,
}: StartImporterProps) => {
    if (!importerData || !products) {
        throw new Error('Importer data and products should be defined');
    }

    let createdCalendars: CreatedCalendarType[] = [];
    const importPayload: LaunchImportPayload = {
        ImporterID: importerData.importerId,
    };

    if (products.includes(ImportType.CALENDAR)) {
        setIsCreatingCalendar(true);

        const importerCalendar = importerData.calendars?.calendars;
        const initialCalendars = importerData.calendars?.initialFields;

        const calendarToCreate = importerCalendar?.filter((item) => item.checked && !item.mergedTo) ?? [];
        const calendarToBeMerged = importerCalendar?.filter((item) => item.mergedTo) ?? [];
        setCalendarsToBeCreated(calendarToCreate?.length);

        try {
            createdCalendars = await createCalendars({
                api,
                calendars: calendarToCreate,
                hasNoCalendar: !calendars.length,
                getAddressKeys,
                activeAddresses: availableAddresses,
                increaseCreatedCalendarCount: () => {
                    increaseCalendarCount();
                },
            });

            //Merge the mapping between created calendars and merged calendar before starting import task
            const mapping: CalendarImportMapping[] = [
                ...createdCalendars.map((calendar) => {
                    return {
                        Source: calendar.id,
                        Destination: calendar.destination,
                        NewCalendar: 1,
                    };
                }),
                ...calendarToBeMerged.map((calendar) => {
                    if (calendar.mergedTo?.ID) {
                        return {
                            Source: calendar.id,
                            Destination: calendar.mergedTo.ID,
                        };
                    }
                    return null;
                }),
            ].filter(isTruthy);

            const formattedInitial = initialCalendars?.map((item) => {
                return {
                    source: item.source,
                    description: item.description,
                    id: item.id,
                    checked: item.checked,
                };
            });
            const formattedCalendars = importerCalendar?.map((item) => {
                return {
                    source: item.source,
                    description: item.description,
                    id: item.id,
                    checked: item.checked,
                };
            });

            const CustomCalendarMapping = !isDeepEqual(formattedInitial, formattedCalendars)
                ? IsCustomCalendarMapping.TRUE
                : IsCustomCalendarMapping.FALSE;

            importPayload.Calendar = {
                Mapping: mapping,
                CustomCalendarMapping,
            };
            setIsCreatingCalendar(false);
        } catch (e) {
            //Rollback to previous state if an error occurred during calendar creation
            dispatch(changeOAuthStep('prepare-import'));
            captureMessage('Error while creating calendars', {
                extra: { message: e, importerID: importerData.importerId },
            });
            return;
        }
    }

    if (products.includes(ImportType.MAIL)) {
        const emailsFields = importerData.emails?.fields!;
        const emailsInitialFields = importerData.emails?.initialFields!;

        const isCustomPeriod = emailsInitialFields.importPeriod !== emailsFields?.importPeriod;
        const isCustomLabel = !isDeepEqual(emailsInitialFields?.importLabel, emailsFields?.importLabel);
        const isCustomMapping = !isDeepEqual(emailsInitialFields?.mapping, emailsFields?.mapping);

        const payload = formatPrepareStepPayload({
            isLabelMapping,
            data: {
                email: importerData.importedEmail,
                importerID: importerData.importerId,
            },
            fields: emailsFields,
            updatedFields: {
                updatedPeriod: isCustomPeriod,
                updatedLabel: isCustomLabel,
                updatedMapping: isCustomMapping,
            },
        });

        importPayload.Mail = payload.Mail;
    }

    if (products.includes(ImportType.CONTACTS)) {
        importPayload.Contacts = {};
    }

    try {
        setIsCreatingImportTask(true);
        await api(startImportTask(importPayload));
        await call();
        setIsCreatingImportTask(false);

        dispatch(changeOAuthStep('success'));
    } catch (error) {
        if (createdCalendars) {
            await call();
        }
        errorHandler(error);
        dispatch(resetOauthDraft());
    }
};

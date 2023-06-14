import { createAsyncThunk } from '@reduxjs/toolkit';
import { c } from 'ttag';

import {
    createImport,
    createToken,
    getCalendarImportData,
    getContactsImportData,
    getMailImportData,
} from '@proton/activation/src/api';
import { ApiMailImporterFolder } from '@proton/activation/src/api/api.interface';
import { MailImportFields } from '@proton/activation/src/components/Modals/CustomizeMailImportModal/CustomizeMailImportModal.interface';
import getDefaultLabel from '@proton/activation/src/components/Modals/Imap/ImapMailModal/StepPrepareImap/useStepPrepareImap.helpers';
import MailImportFoldersParser from '@proton/activation/src/helpers/MailImportFoldersParser/MailImportFoldersParser';
import { getDefaultImportCategoriesDestination } from '@proton/activation/src/helpers/getDefaultImportCategories';
import { getDefaultTimePeriod } from '@proton/activation/src/helpers/getDefaultTimePeriod';
import {
    AuthenticationMethod,
    CreateImportPayload,
    IMPORT_ERROR,
    ImportProvider,
    ImportToken,
    ImportType,
    ImportedCalendar,
    OAuthProps,
} from '@proton/activation/src/interface';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { MAX_CHARS_API } from '@proton/shared/lib/calendar/constants';
import { Address, UserModel } from '@proton/shared/lib/interfaces';
import truncate from '@proton/utils/truncate';

import { EasySwitchThunkExtra } from '../../store';
import { OAUTH_ACTION_PREFIX } from './oauthDraft.actions';
import { ImporterCalendar, ImporterData } from './oauthDraft.interface';

type Props = {
    oAuthProps: OAuthProps;
    source: string;
    defaultAddress: Address;
    user: UserModel;
};

interface ImportRawData {
    importType: ImportType;
    Folders?: ApiMailImporterFolder[];
    Contacts?: APIContacts;
    Calendars?: APICalendar[];
    error?: string;
}

interface APICalendar {
    Source: string;
    ID: string;
    Description: string;
}

interface APIContacts {
    NumContacts: number;
    NumGroups: number;
}

export enum Separator {
    Empty = '/',
}

export const createImporterThunk = createAsyncThunk<ImporterData, Props, EasySwitchThunkExtra>(
    `${OAUTH_ACTION_PREFIX}/createImporter`,
    async (props, thunkAPI) => {
        const { oAuthProps, source, defaultAddress, user } = props;
        const state = thunkAPI.getState();
        const products = state.oauthDraft.mailImport?.products!;
        const provider = state.oauthDraft.provider;

        const errors: any[] = [];
        const { Code, Provider, RedirectUri } = oAuthProps;
        const { Token }: { Token: ImportToken } = await thunkAPI.extra.api(
            createToken({
                Provider,
                Code,
                RedirectUri,
                Source: source,
                Products: products,
            })
        );
        const { Products, ID, Account } = Token;

        const createImportPayload: CreateImportPayload = { TokenID: ID, Source: source };

        if (Products.includes(ImportType.MAIL)) {
            createImportPayload[ImportType.MAIL] = {
                Account,
                Sasl: AuthenticationMethod.OAUTH,
            };
        }

        // Calendar and contacts need empty payload
        if (Products.includes(ImportType.CALENDAR)) {
            createImportPayload[ImportType.CALENDAR] = {};
        }

        if (Products.includes(ImportType.CONTACTS)) {
            createImportPayload[ImportType.CONTACTS] = {};
        }

        const { ImporterID } = await thunkAPI.extra.api(createImport(createImportPayload));

        const importsRawData: ImportRawData[] = await Promise.all(
            products.map(async (product: ImportType): Promise<ImportRawData> => {
                if (product === ImportType.MAIL) {
                    try {
                        const { Folders } = await thunkAPI.extra.api<{
                            Code: number;
                            Folders: ApiMailImporterFolder[];
                        }>({ ...getMailImportData(ImporterID), silence: true });
                        return {
                            importType: product,
                            Folders,
                        };
                    } catch (e) {
                        const { code, status } = getApiError(e);
                        if (status === 422 && code === IMPORT_ERROR.ACCOUNT_DOES_NOT_EXIST) {
                            errors.push([ImportType.MAIL, IMPORT_ERROR.ACCOUNT_DOES_NOT_EXIST]);
                            return {
                                importType: product,
                                error: c('Error').t`No emails found to import - the account does not have an inbox`,
                            };
                        } else {
                            throw e;
                        }
                    }
                }

                if (product === ImportType.CALENDAR) {
                    try {
                        const { Calendars } = await thunkAPI.extra.api<{
                            Code: number;
                            Calendars: ImportedCalendar[];
                        }>({ ...getCalendarImportData(ImporterID), silence: true });
                        return {
                            importType: product,
                            Calendars,
                        };
                    } catch (e) {
                        const { code, status } = getApiError(e);
                        if (status === 422 && code === IMPORT_ERROR.ACCOUNT_DOES_NOT_EXIST) {
                            errors.push([ImportType.CALENDAR, IMPORT_ERROR.ACCOUNT_DOES_NOT_EXIST]);
                            return {
                                importType: product,
                                error: c('Error').t`No calendars found to import`,
                            };
                        } else {
                            throw e;
                        }
                    }
                }

                if (product === ImportType.CONTACTS) {
                    try {
                        const { Contacts } = await thunkAPI.extra.api<{ Contacts: any }>({
                            ...getContactsImportData(ImporterID),
                            silence: true,
                        });
                        return {
                            importType: product,
                            Contacts,
                        };
                    } catch (e) {
                        const { code, status } = getApiError(e);
                        if (status === 422 && code === IMPORT_ERROR.ACCOUNT_DOES_NOT_EXIST) {
                            errors.push([ImportType.CONTACTS, IMPORT_ERROR.ACCOUNT_DOES_NOT_EXIST]);
                            return {
                                importType: product,
                                error: c('Error').t`No contacts found to import`,
                            };
                        } else {
                            throw e;
                        }
                    }
                }
                return { importType: product };
            })
        );
        const emailData = importsRawData.find((item) => item.importType === ImportType.MAIL);
        const contactData = importsRawData.find((item) => item.importType === ImportType.CONTACTS);
        const calendarData = importsRawData.find((item) => item.importType === ImportType.CALENDAR);

        const calendarResponse: ImporterCalendar[] | undefined = calendarData?.Calendars?.map(
            (item: APICalendar): ImporterCalendar => {
                return {
                    id: item.ID,
                    source: truncate(item.Source, MAX_CHARS_API.CALENDAR_NAME),
                    description: truncate(item.Description, MAX_CHARS_API.CALENDAR_DESCRIPTION),
                    checked: true,
                };
            }
        );

        const apiFolders = emailData?.Folders ?? [];
        const foldersMapping = new MailImportFoldersParser(apiFolders, provider === ImportProvider.GOOGLE).folders;
        const emailFields: MailImportFields = {
            mapping: foldersMapping,
            importLabel: getDefaultLabel(Account),
            importAddress: defaultAddress,
            importPeriod: getDefaultTimePeriod(user),
            importCategoriesDestination: getDefaultImportCategoriesDestination(foldersMapping),
        };

        return {
            importerId: ImporterID,
            importedEmail: Account,
            emails: { error: emailData?.error, fields: emailFields, initialFields: emailFields },
            calendars: { error: calendarData?.error, calendars: calendarResponse, initialFields: calendarResponse },
            contacts: {
                error: contactData?.error,
                numContact: contactData?.Contacts?.NumContacts ?? NaN,
                numGroups: contactData?.Contacts?.NumGroups ?? NaN,
            },
        };
    }
);

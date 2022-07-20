import { getVisualCalendars } from '@proton/shared/lib/calendar/calendar';
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { c } from 'ttag';

import isTruthy from '@proton/utils/isTruthy';
import { Address } from '@proton/shared/lib/interfaces';
import { toMap } from '@proton/shared/lib/helpers/object';
import { createCalendar, removeCalendar, updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import { setupCalendarKey } from '@proton/shared/lib/calendar/keys/setupCalendarKeys';
import { getPrimaryKey } from '@proton/shared/lib/keys';
import {
    createImport,
    createToken,
    startImportTask,
    getMailImportData,
    getCalendarImportData,
    getContactsImportData,
} from '@proton/shared/lib/api/easySwitch';
import {
    CheckedProductMap,
    IAOauthModalModel,
    IAOauthModalModelStep,
    OAuthProps,
    OAUTH_PROVIDER,
    ImportType,
    LaunchImportPayload,
    TIME_PERIOD,
    ImportToken,
    IAOauthModalModelImportData,
    CalendarImporterPayload,
    AuthenticationMethod,
    MailImporterPayload,
    MailImportMapping,
    CalendarImportMapping,
    CreateImportPayload,
    EASY_SWITCH_SOURCE,
    EasySwitchFeatureFlag,
    ImportedCalendar,
} from '@proton/shared/lib/interfaces/EasySwitch';
import { getActiveAddresses } from '@proton/shared/lib/helpers/address';
import { PRODUCT_NAMES, ACCENT_COLORS } from '@proton/shared/lib/constants';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';
import noop from '@proton/utils/noop';
import { getTimezone } from '@proton/shared/lib/date/timezone';
import { MAX_LENGTHS_API } from '@proton/shared/lib/calendar/constants';
import { getPersonalCalendars } from '@proton/shared/lib/calendar/subscribe/helpers';

import { Button, FormModal, PrimaryButton, useSettingsLink } from '../../components';

import {
    G_OAUTH_SCOPE_DEFAULT,
    G_OAUTH_SCOPE_MAIL,
    G_OAUTH_SCOPE_CONTACTS,
    G_OAUTH_SCOPE_CALENDAR,
    IA_PATHNAME_REGEX,
    CALENDAR_TO_BE_CREATED_PREFIX,
    IMAPS,
} from './constants';

import IASelectImportTypeStep from './steps/IASelectImportTypeStep';
import useOAuthPopup from '../../hooks/useOAuthPopup';
import ImportStartedStep from './steps/IAImportStartedStep';
import IAOauthInstructionsStep from './steps/IAOauthInstructionsStep';
import {
    useApi,
    useCalendars,
    useErrorHandler,
    useEventManager,
    useFolders,
    useGetAddressKeys,
    useLabels,
    useApiEnvironmentConfig,
} from '../../hooks';
import IALoadingStep from './steps/IALoadingStep';
import { dateToTimestamp } from './mail/helpers';

interface Props {
    addresses: Address[];
    onClose?: () => void;
    defaultCheckedTypes?: ImportType[];
    source: EASY_SWITCH_SOURCE;
    featureMap?: EasySwitchFeatureFlag;
}

const {
    MAIL,
    CALENDAR,
    CONTACTS,
    // DRIVE,
} = ImportType;

const { AUTHENTICATION, SELECT_IMPORT_TYPE, SUCCESS, OAUTH_INSTRUCTIONS } = IAOauthModalModelStep;

const DEFAULT_IMAP_PORT = 993;

// This function returns an array of ImportType give a checked product map
// e.g. { [MAIL]: true, [CALENDAR]: false } => [CALENDAR]
const getCheckedProducts = (checkedTypes: CheckedProductMap): ImportType[] =>
    (Object.keys(checkedTypes) as ImportType[]).reduce<ImportType[]>((acc, k) => {
        if (checkedTypes[k]) {
            return [...acc, k];
        }

        return acc;
    }, []);

const EasySwitchOauthModal = ({
    addresses = [],
    onClose = noop,
    defaultCheckedTypes = [],
    source,
    featureMap,
    ...rest
}: Props) => {
    const activeAddresses = getActiveAddresses(addresses);
    const getAddressKeys = useGetAddressKeys();
    const location = useLocation();
    const isCurrentLocationImportPage = IA_PATHNAME_REGEX.test(location.pathname);
    const settingsLink = useSettingsLink();
    const api = useApi();
    const { call } = useEventManager();
    const errorHandler = useErrorHandler();

    const [labels = [], loadingLabels] = useLabels();
    const [folders = [], loadingFolders] = useFolders();
    const [calendars = [], loadingCalendars] = useCalendars();
    const visualCalendars = getVisualCalendars(calendars, addresses);

    const [config, loadingConfig] = useApiEnvironmentConfig();

    const isInitLoading = loadingLabels || loadingFolders || loadingCalendars || loadingConfig;

    const [modalModel, setModalModel] = useState<IAOauthModalModel>({
        step: AUTHENTICATION,
        AddressID: addresses[0].ID,
        importedEmail: '',
        payload: {
            ImporterID: '',
        },
        isPayloadInvalid: false,
        data: {
            importerID: '',
            [MAIL]: {
                selectedPeriod: TIME_PERIOD.BIG_BANG,
                providerFolders: [],
            },
            [CALENDAR]: {
                providerCalendars: [],
            },
            [CONTACTS]: {
                numContacts: 0,
                numContactGroups: 0,
            },
            // [DRIVE]: {
            // },
        },
    });

    const addressMap = toMap(addresses);

    // for a finer control of loading states we use useState here
    const [isLoadingOAuth, setIsLoadingOAuth] = useState(false);
    const [isLoadingCreateCalendars, setIsLoadingCreateCalendars] = useState(false);
    const [isLoadingStartImportTask, setIsLoadingStartImportTask] = useState(false);

    const showLoadingState = isInitLoading || isLoadingOAuth || isLoadingCreateCalendars || isLoadingStartImportTask;

    const [calendarsToBeCreatedCount, setCalendarsToBeCreatedCount] = useState(0);
    const [createdCalendarsCount, setCreatedCalendarsCount] = useState(0);

    const [checkedTypes, setCheckedTypes] = useState<CheckedProductMap>({
        [MAIL]: defaultCheckedTypes?.includes(MAIL),
        [CALENDAR]: defaultCheckedTypes?.includes(CALENDAR),
        [CONTACTS]: defaultCheckedTypes?.includes(CONTACTS),
        // [DRIVE]: defaultCheckedTypes?.includes(ImportType.DRIVE),
    });

    const { triggerOAuthPopup } = useOAuthPopup();

    const selectedImportTypes = Object.keys(checkedTypes).reduce<ImportType[]>((acc, k) => {
        const key = k as ImportType;
        const inTokenScope = modalModel.tokenScope ? modalModel.tokenScope.includes(key) : true;
        if (checkedTypes[key] && inTokenScope) {
            acc.push(key);
        }
        return acc;
    }, []);

    const createCalendars = async (calendarsToBeCreated: CalendarImportMapping[], hasNoCalendar: boolean) => {
        if (!activeAddresses.length) {
            throw new Error(c('Error').t`No valid address found`);
        }

        setCalendarsToBeCreatedCount(calendarsToBeCreated.length);

        const [{ ID: addressID }] = activeAddresses;
        const { privateKey: primaryAddressKey } = getPrimaryKey(await getAddressKeys(addressID)) || {};

        if (!primaryAddressKey) {
            throw new Error(c('Error').t`Primary address key is not decrypted.`);
        }

        const newMapping = await Promise.all(
            calendarsToBeCreated.map(async ({ Source, Destination, Description }) => {
                const Name = Destination.replace(CALENDAR_TO_BE_CREATED_PREFIX, '').slice(
                    0,
                    MAX_LENGTHS_API.CALENDAR_NAME
                );

                const { Calendar } = await api(
                    createCalendar({
                        Name,
                        Color: ACCENT_COLORS[randomIntFromInterval(0, ACCENT_COLORS.length - 1)],
                        Description,
                        Display: 1,
                        AddressID: addressID,
                        IsImport: 1,
                    })
                );

                await setupCalendarKey({
                    api,
                    calendarID: Calendar.ID,
                    addressID,
                    getAddressKeys,
                });

                setCreatedCalendarsCount(createdCalendarsCount + 1);

                return { Source, Destination: Calendar.ID, Description };
            })
        );

        if (hasNoCalendar) {
            await api(
                updateCalendarUserSettings({
                    PrimaryTimezone: getTimezone(),
                    AutoDetectPrimaryTimezone: 1,
                })
            );
        }

        return newMapping;
    };

    const handleSubmit = async () => {
        if (modalModel.step === AUTHENTICATION) {
            setModalModel({
                ...modalModel,
                step: OAUTH_INSTRUCTIONS,
            });
        }

        if (modalModel.step === OAUTH_INSTRUCTIONS) {
            const scopes = [
                ...G_OAUTH_SCOPE_DEFAULT,
                checkedTypes[MAIL] && G_OAUTH_SCOPE_MAIL,
                checkedTypes[CALENDAR] && G_OAUTH_SCOPE_CALENDAR,
                checkedTypes[CONTACTS] && G_OAUTH_SCOPE_CONTACTS,
                // checkedTypes[DRIVE] && G_OAUTH_SCOPE_DRIVE,
            ]
                .filter(isTruthy)
                .flat(1);

            triggerOAuthPopup({
                provider: OAUTH_PROVIDER.GOOGLE,
                scope: scopes.join(' '),
                clientID: config['importer.google.client_id'],
                callback: async (oauthProps: OAuthProps) => {
                    setIsLoadingOAuth(true);
                    try {
                        const { Code, Provider, RedirectUri } = oauthProps;

                        const { Token }: { Token: ImportToken } = await api(
                            createToken({
                                Provider,
                                Code,
                                RedirectUri,
                                Source: source,
                                Products: getCheckedProducts(checkedTypes),
                            })
                        );

                        const { Products, ID, Account } = Token;

                        const tokenScope = Products;

                        const createImportPayload: CreateImportPayload = { TokenID: ID };

                        if (Products.includes(ImportType.MAIL)) {
                            createImportPayload[ImportType.MAIL] = {
                                Account,
                                ImapHost: IMAPS[Provider],
                                ImapPort: DEFAULT_IMAP_PORT,
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

                        const { ImporterID } = await api(createImport(createImportPayload));

                        const importsRawData = await Promise.all(
                            tokenScope.map(async (importType) => {
                                if (importType === MAIL) {
                                    const { Folders } = await api(getMailImportData(ImporterID));

                                    return {
                                        importType,
                                        Folders,
                                    };
                                }

                                if (importType === CALENDAR) {
                                    const { Calendars } = await api<{ Code: number; Calendars: ImportedCalendar[] }>(
                                        getCalendarImportData(ImporterID)
                                    );

                                    return {
                                        importType,
                                        Calendars,
                                    };
                                }

                                if (importType === CONTACTS) {
                                    const { Contacts } = await api(getContactsImportData(ImporterID));

                                    return {
                                        importType,
                                        Contacts,
                                    };
                                }
                            })
                        );

                        const data = importsRawData.filter(isTruthy).reduce<IAOauthModalModelImportData>(
                            (acc, currentImport) => {
                                const { importType } = currentImport;

                                if (importType === MAIL && currentImport.Folders) {
                                    acc[importType].providerFolders = currentImport.Folders;
                                }

                                if (importType === CALENDAR && currentImport.Calendars) {
                                    acc[importType].providerCalendars = currentImport.Calendars;
                                }

                                if (importType === CONTACTS) {
                                    acc[importType].numContacts = currentImport.Contacts.NumContacts || 0;
                                    acc[importType].numContactGroups = currentImport.Contacts.NumGroups || 0;
                                }

                                return {
                                    ...acc,
                                    [importType]: {
                                        ...acc[importType],
                                    },
                                };
                            },
                            {
                                ...modalModel.data,
                                importerID: ImporterID,
                            }
                        );

                        const mailData = data[MAIL].providerFolders.length;
                        const calendarData = data[CALENDAR].providerCalendars.length;
                        const contactsData = data[CONTACTS].numContacts || data[CONTACTS].numContactGroups;

                        if (!mailData && !calendarData && !contactsData) {
                            throw new Error(c('Error').t`No data to import`);
                        }

                        setModalModel({
                            ...modalModel,
                            step: SELECT_IMPORT_TYPE,
                            importedEmail: Account,
                            oauthProps,
                            tokenScope,
                            data,
                        });
                        setIsLoadingOAuth(false);
                    } catch (error) {
                        setIsLoadingOAuth(false);
                        errorHandler(error);
                    }
                },
            });

            return;
        }

        if (modalModel.step === SELECT_IMPORT_TYPE) {
            const payloads = modalModel.payload;

            const calendarPayload = payloads[ImportType.CALENDAR] as CalendarImporterPayload;

            let createdCalendarMapping;

            const calendarsToBeCreated =
                modalModel.payload[ImportType.CALENDAR]?.Mapping.filter((m) =>
                    m.Destination.startsWith(CALENDAR_TO_BE_CREATED_PREFIX)
                ) || [];

            if (
                selectedImportTypes.includes(ImportType.CALENDAR) &&
                payloads[ImportType.CALENDAR] &&
                calendarsToBeCreated.length
            ) {
                setIsLoadingCreateCalendars(true);
                try {
                    createdCalendarMapping = await createCalendars(calendarsToBeCreated, !calendars.length);
                    await call();
                    calendarPayload.Mapping = [
                        ...calendarPayload.Mapping.filter(
                            (m) => !m.Destination.startsWith(CALENDAR_TO_BE_CREATED_PREFIX)
                        ),
                        ...createdCalendarMapping,
                    ];
                    setIsLoadingCreateCalendars(false);
                } catch (error) {
                    setIsLoadingCreateCalendars(false);
                    errorHandler(error);
                }
            }

            const payloadKeys = Object.keys(payloads) as ImportType[];
            const apiPayload = payloadKeys
                .filter((key) => Object.values(ImportType).includes(key))
                .filter((importType) => selectedImportTypes.includes(importType))
                .reduce<LaunchImportPayload>(
                    (acc, importType) => {
                        // Format mail payload
                        if (importType === ImportType.MAIL) {
                            const payload = payloads[ImportType.MAIL] as MailImporterPayload;

                            return {
                                ...acc,
                                [importType]: {
                                    ...payload,
                                    StartTime: payload.StartTime
                                        ? dateToTimestamp(payload.StartTime as Date)
                                        : undefined,
                                    Mapping: payload.Mapping.filter(({ checked }: MailImportMapping) => checked).map(
                                        ({ Source, Destinations }: MailImportMapping) => ({
                                            Source,
                                            Destinations,
                                        })
                                    ),
                                },
                            };
                        }

                        return {
                            ...acc,
                            [importType]: importType === ImportType.CALENDAR ? calendarPayload : payloads[importType],
                        };
                    },
                    {
                        ImporterID: modalModel.payload.ImporterID,
                    }
                );

            setIsLoadingStartImportTask(true);

            try {
                await api(startImportTask(apiPayload));
                await call();

                setModalModel({
                    ...modalModel,
                    step: SUCCESS,
                });

                setIsLoadingStartImportTask(false);
            } catch (error) {
                /* Delete newly created calendars */
                if (createdCalendarMapping) {
                    await Promise.all(
                        createdCalendarMapping.map(async ({ Destination }) => api(removeCalendar(Destination)))
                    );
                    await call();
                }

                setModalModel({
                    ...modalModel,
                    isImportError: true,
                });

                setIsLoadingStartImportTask(false);
                errorHandler(error);
            }
        }

        return null;
    };

    const submitRenderer = () => {
        if (showLoadingState) {
            return null;
        }

        if (modalModel.step === OAUTH_INSTRUCTIONS) {
            return <PrimaryButton type="submit">{c('Action').t`Continue`}</PrimaryButton>;
        }

        if ([SELECT_IMPORT_TYPE, AUTHENTICATION].includes(modalModel.step)) {
            if (modalModel.oauthProps) {
                return (
                    <PrimaryButton type="submit" disabled={!selectedImportTypes.length || modalModel.isPayloadInvalid}>
                        {c('Action').t`Start import`}
                    </PrimaryButton>
                );
            }

            return (
                <PrimaryButton type="submit" disabled={!selectedImportTypes.length}>
                    {c('Action').t`Next`}
                </PrimaryButton>
            );
        }

        if (modalModel.step === SUCCESS && !isCurrentLocationImportPage) {
            return (
                <PrimaryButton
                    onClick={() => {
                        onClose();
                        settingsLink(`/easy-switch`);
                    }}
                >
                    {c('Action').t`Check import progress`}
                </PrimaryButton>
            );
        }

        return null;
    };

    const handleCancel = () => {
        if (modalModel.step === OAUTH_INSTRUCTIONS) {
            setModalModel({
                ...modalModel,
                step: AUTHENTICATION,
            });

            return;
        }

        onClose();
    };

    const cancelRenderer = () => {
        let copy = '';

        switch (modalModel.step) {
            case SUCCESS:
                copy = c('Action').t`Close`;
                break;
            case OAUTH_INSTRUCTIONS:
                copy = c('Action').t`Back`;
                break;

            default:
                copy = c('Action').t`Cancel`;
                break;
        }

        return !showLoadingState ? (
            <Button shape="outline" onClick={handleCancel}>
                {copy}
            </Button>
        ) : null;
    };

    const titleRenderer = () => {
        if (showLoadingState) {
            return null;
        }

        switch (modalModel.step) {
            case AUTHENTICATION:
                return c('Title').t`What would you like to import?`;
            case SELECT_IMPORT_TYPE:
                return c('Title').t`Customize and confirm`;
            case OAUTH_INSTRUCTIONS:
                return c('Title').t`Sign in and grant access`;
            case SUCCESS:
                return null;
            default:
                return PRODUCT_NAMES.EASY_SWITCH;
        }
    };

    return (
        <FormModal
            title={titleRenderer()}
            submit={submitRenderer()}
            close={cancelRenderer()}
            onSubmit={handleSubmit}
            onClose={handleCancel}
            intermediate={modalModel.step === OAUTH_INSTRUCTIONS}
            {...rest}
        >
            {showLoadingState ? (
                <IALoadingStep
                    isLoadingOAuth={isLoadingOAuth}
                    isLoadingCreateCalendars={isLoadingCreateCalendars}
                    isLoadingStartImportTask={isLoadingStartImportTask}
                    calendarsToBeCreated={calendarsToBeCreatedCount}
                    createdCalendars={createdCalendarsCount}
                />
            ) : (
                <>
                    {modalModel.step === OAUTH_INSTRUCTIONS && <IAOauthInstructionsStep modalModel={modalModel} />}
                    {[SELECT_IMPORT_TYPE, AUTHENTICATION].includes(modalModel.step) && (
                        <IASelectImportTypeStep
                            checkedTypes={checkedTypes}
                            updateCheckedTypes={(importTypes) => setCheckedTypes(importTypes)}
                            modalModel={modalModel}
                            toEmail={addressMap[modalModel.AddressID].Email}
                            calendars={getPersonalCalendars(visualCalendars)}
                            addresses={addresses}
                            labels={labels}
                            folders={folders}
                            updateModalModel={(newModel) => setModalModel(newModel)}
                            featureMap={featureMap}
                        />
                    )}
                    {modalModel.step === SUCCESS && (
                        <ImportStartedStep
                            importedEmailAddress={modalModel.importedEmail}
                            toEmail={addressMap[modalModel.AddressID].Email}
                            onClose={onClose}
                        />
                    )}
                </>
            )}
        </FormModal>
    );
};

export default EasySwitchOauthModal;

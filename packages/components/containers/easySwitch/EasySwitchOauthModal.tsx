import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { createCalendar, removeCalendar, updateCalendarUserSettings } from '@proton/shared/lib/api/calendars';
import {
    createImport,
    createToken,
    getCalendarImportData,
    getContactsImportData,
    getMailImportData,
    startImportTask,
} from '@proton/shared/lib/api/easySwitch';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getVisualCalendars, getWritableCalendars } from '@proton/shared/lib/calendar/calendar';
import { MAX_LENGTHS_API } from '@proton/shared/lib/calendar/constants';
import { setupCalendarKey } from '@proton/shared/lib/calendar/keys/setupCalendarKeys';
import { ACCENT_COLORS, PRODUCT_NAMES } from '@proton/shared/lib/constants';
import { getTimezone } from '@proton/shared/lib/date/timezone';
import { getActiveAddresses } from '@proton/shared/lib/helpers/address';
import { toMap } from '@proton/shared/lib/helpers/object';
import { Address } from '@proton/shared/lib/interfaces';
import {
    AuthenticationMethod,
    CalendarImportMapping,
    CalendarImporterPayload,
    CheckedProductMap,
    CreateImportPayload,
    EASY_SWITCH_SOURCE,
    EasySwitchFeatureFlag,
    IAOauthModalModel,
    IAOauthModalModelImportData,
    IAOauthModalModelStep,
    IMPORT_ERROR,
    ImportToken,
    ImportType,
    ImportedCalendar,
    ImportedMailFolder,
    LaunchImportPayload,
    MailImportMapping,
    MailImporterPayload,
    OAUTH_PROVIDER,
    OAuthProps,
    TIME_PERIOD,
} from '@proton/shared/lib/interfaces/EasySwitch';
import { getPrimaryKey } from '@proton/shared/lib/keys';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

import { Button, FormModal, PrimaryButton, useSettingsLink } from '../../components';
import {
    useApi,
    useCalendars,
    useErrorHandler,
    useEventManager,
    useFeature,
    useFolders,
    useGetAddressKeys,
    useLabels,
} from '../../hooks';
import useOAuthPopup from '../../hooks/useOAuthPopup';
import { FeatureCode } from '../features';
import { getScopeFromProvider } from './EasySwitchOauthModal.helpers';
import { CALENDAR_TO_BE_CREATED_PREFIX, IA_PATHNAME_REGEX } from './constants';
import { getCheckedProducts, hasDataToImport } from './helpers';
import { dateToTimestamp } from './mail/helpers';
import ImportStartedStep from './steps/IAImportStartedStep';
import IALoadingStep from './steps/IALoadingStep';
import IAOauthInstructionsStep from './steps/IAOauthInstructionsStep';
import IASelectImportTypeStep from './steps/IASelectImportTypeStep';

interface Props {
    addresses: Address[];
    onClose?: () => void;
    defaultCheckedTypes?: ImportType[];
    source: EASY_SWITCH_SOURCE;
    featureMap?: EasySwitchFeatureFlag;
    provider?: OAUTH_PROVIDER;
}

const {
    MAIL,
    CALENDAR,
    CONTACTS,
    // DRIVE,
} = ImportType;

const { AUTHENTICATION, SELECT_IMPORT_TYPE, SUCCESS, OAUTH_INSTRUCTIONS } = IAOauthModalModelStep;

const EasySwitchOauthModal = ({
    addresses = [],
    onClose = noop,
    defaultCheckedTypes = [],
    source,
    featureMap,
    provider = OAUTH_PROVIDER.GOOGLE,
    ...rest
}: Props) => {
    const useNewScopeFeature = useFeature(FeatureCode.EasySwitchGmailNewScope);
    const activeAddresses = getActiveAddresses(addresses);
    const getAddressKeys = useGetAddressKeys();
    const location = useLocation();
    const isCurrentLocationImportPage = IA_PATHNAME_REGEX.test(location.pathname);
    const settingsLink = useSettingsLink();
    const api = useApi();
    const silentApi = <T,>(config: any) => api<T>({ ...config, silence: true });
    const { call } = useEventManager();
    const errorHandler = useErrorHandler();
    const [importError, setImportError] = useState<[ImportType, IMPORT_ERROR][]>([]);

    const [labels = [], loadingLabels] = useLabels();
    const [folders = [], loadingFolders] = useFolders();
    const [calendars = [], loadingCalendars] = useCalendars();
    const visualCalendars = getVisualCalendars(calendars);
    const { triggerOAuthPopup, loadingConfig } = useOAuthPopup();

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

    const showLoadingState =
        isInitLoading ||
        isLoadingOAuth ||
        isLoadingCreateCalendars ||
        isLoadingStartImportTask ||
        useNewScopeFeature.loading;

    const [calendarsToBeCreatedCount, setCalendarsToBeCreatedCount] = useState(0);
    const [createdCalendarsCount, setCreatedCalendarsCount] = useState(0);

    const [checkedTypes, setCheckedTypes] = useState<CheckedProductMap>({
        [MAIL]: defaultCheckedTypes?.includes(MAIL),
        [CALENDAR]: defaultCheckedTypes?.includes(CALENDAR),
        [CONTACTS]: defaultCheckedTypes?.includes(CONTACTS),
        // [DRIVE]: defaultCheckedTypes?.includes(ImportType.DRIVE),
    });

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
        if (modalModel.step === AUTHENTICATION && provider === OAUTH_PROVIDER.GOOGLE) {
            setModalModel({
                ...modalModel,
                step: OAUTH_INSTRUCTIONS,
            });
        }

        if (
            (modalModel.step === OAUTH_INSTRUCTIONS && provider === OAUTH_PROVIDER.GOOGLE) ||
            (modalModel.step === AUTHENTICATION && provider !== OAUTH_PROVIDER.GOOGLE)
        ) {
            setImportError([]);

            const useNewGmailScope = useNewScopeFeature.feature?.Value === true;
            const scopes = getScopeFromProvider(provider, checkedTypes, useNewGmailScope);

            triggerOAuthPopup({
                provider,
                scope: scopes.join(' '),
                callback: async (oauthProps: OAuthProps) => {
                    setIsLoadingOAuth(true);
                    const checkedProducts = getCheckedProducts(checkedTypes);

                    try {
                        const { Code, Provider, RedirectUri } = oauthProps;

                        const { Token }: { Token: ImportToken } = await api(
                            createToken({
                                Provider,
                                Code,
                                RedirectUri,
                                Source: source,
                                Products: checkedProducts,
                            })
                        );

                        const { Products, ID, Account } = Token;

                        const tokenScope = Products;

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

                        const { ImporterID } = await api(createImport(createImportPayload));

                        const importErrorsClone = [...importError];
                        const importsRawData = await Promise.all(
                            checkedProducts.map(async (importType) => {
                                if (importType === MAIL) {
                                    try {
                                        const { Folders } = await silentApi<{
                                            Code: number;
                                            Folders: ImportedMailFolder[];
                                        }>(getMailImportData(ImporterID));
                                        return {
                                            importType,
                                            Folders,
                                        };
                                    } catch (e) {
                                        const { code, status } = getApiError(e);
                                        if (status === 422 && code === IMPORT_ERROR.ACCOUNT_DOES_NOT_EXIST) {
                                            importErrorsClone.push([MAIL, IMPORT_ERROR.ACCOUNT_DOES_NOT_EXIST]);
                                            return {
                                                importType,
                                                Folders: [],
                                                error: c('Error')
                                                    .t`No emails found to import - the account does not have an inbox`,
                                            };
                                        } else {
                                            throw e;
                                        }
                                    }
                                }

                                if (importType === CALENDAR) {
                                    try {
                                        const { Calendars } = await silentApi<{
                                            Code: number;
                                            Calendars: ImportedCalendar[];
                                        }>(getCalendarImportData(ImporterID));
                                        return {
                                            importType,
                                            Calendars,
                                        };
                                    } catch (e) {
                                        const { code, status } = getApiError(e);
                                        if (status === 422 && code === IMPORT_ERROR.ACCOUNT_DOES_NOT_EXIST) {
                                            importErrorsClone.push([CALENDAR, IMPORT_ERROR.ACCOUNT_DOES_NOT_EXIST]);
                                            return {
                                                importType,
                                                Folders: [],
                                                error: c('Error').t`No calendars found to import`,
                                            };
                                        } else {
                                            throw e;
                                        }
                                    }
                                }

                                if (importType === CONTACTS) {
                                    try {
                                        const { Contacts } = await silentApi(getContactsImportData(ImporterID));
                                        return {
                                            importType,
                                            Contacts,
                                        };
                                    } catch (e) {
                                        const { code, status } = getApiError(e);
                                        if (status === 422 && code === IMPORT_ERROR.ACCOUNT_DOES_NOT_EXIST) {
                                            importErrorsClone.push([CALENDAR, IMPORT_ERROR.ACCOUNT_DOES_NOT_EXIST]);
                                            return {
                                                importType,
                                                Folders: [],
                                                error: c('Error').t`No contacts found to import`,
                                            };
                                        } else {
                                            throw e;
                                        }
                                    }
                                }
                            })
                        );

                        if (importErrorsClone.length) {
                            setImportError(importErrorsClone);
                        }

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

                                if (currentImport.error) {
                                    acc[importType].error = currentImport.error;
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

            if (importError.length) {
                importError.forEach(([type, error]) => {
                    if (error === IMPORT_ERROR.ACCOUNT_DOES_NOT_EXIST) {
                        delete apiPayload[type];
                    }
                });
            }

            setImportError([]);
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
                const checkedProducts = getCheckedProducts(checkedTypes);
                return (
                    <PrimaryButton
                        type="submit"
                        disabled={
                            !selectedImportTypes.length ||
                            modalModel.isPayloadInvalid ||
                            !hasDataToImport(modalModel.data, checkedProducts)
                        }
                    >
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
                            calendars={getWritableCalendars(visualCalendars)}
                            addresses={addresses}
                            labels={labels}
                            folders={folders}
                            provider={provider}
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

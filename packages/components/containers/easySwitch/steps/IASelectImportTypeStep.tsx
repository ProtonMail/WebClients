import { ReactNode, useEffect, useMemo, useRef } from 'react';

import { c, msgid } from 'ttag';

import { useModalTwo } from '@proton/components/components/modalTwo/useModalTwo';
import { getProbablyActiveCalendars } from '@proton/shared/lib/calendar/calendar';
import { MAX_CALENDARS_PAID } from '@proton/shared/lib/calendar/constants';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { Address, Label } from '@proton/shared/lib/interfaces';
import {
    CalendarImportMapping,
    CalendarImportPayloadError,
    CalendarImporterPayload,
    CheckedProductMap,
    CustomFieldsBitmap,
    EasySwitchFeatureFlag,
    IAOauthModalModel,
    IAOauthModalModelStep,
    ImportType,
    IsCustomCalendarMapping,
    LaunchImportPayload,
    MailImportGmailCategories,
    MailImportPayloadError,
    MailImporterPayload,
    NON_OAUTH_PROVIDER,
    OAUTH_PROVIDER,
    TIME_PERIOD,
} from '@proton/shared/lib/interfaces/EasySwitch';
import { Folder } from '@proton/shared/lib/interfaces/Folder';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import isTruthy from '@proton/utils/isTruthy';

import { Checkbox, Label as FormLabel, Icon, InlineLinkButton, LabelStack, UnderlineButton } from '../../../components';
import { classnames } from '../../../helpers';
import { useFeature, useModals } from '../../../hooks';
import ContactImportModal from '../../contacts/import/ContactImportModal';
import { FeatureCode } from '../../features';
import EasySwitchInstructionsModal from '../EasySwitchInstructionsModal';
import CustomizeCalendarImportModal from '../calendar/modals/CustomizeCalendarImportModal';
import { CALENDAR_TO_BE_CREATED_PREFIX, GMAIL_CATEGORIES } from '../constants';
import { hasDataToImport } from '../helpers';
import useIAMailPayload from '../hooks/useIAMailPayload';
import CustomizeMailImportModal from '../mail/modals/CustomizeMailImportModal';
import IADisabledCheckbox from './IAErroredChecked';

interface Props {
    provider: OAUTH_PROVIDER;
    addresses: Address[];
    modalModel: IAOauthModalModel;
    updateModalModel: (newModel: IAOauthModalModel) => void;
    checkedTypes: CheckedProductMap;
    updateCheckedTypes: (productMap: CheckedProductMap) => void;
    toEmail: string;
    calendars: VisualCalendar[];
    labels: Label[];
    folders: Folder[];
    featureMap?: EasySwitchFeatureFlag;
}

const {
    MAIL,
    CALENDAR,
    CONTACTS,
    // DRIVE,
} = ImportType;

const LABEL_MARKUP_PLACEHOLDER = '**LABEL**';

// Replace '**LABEL**' by actual Label markup
const replaceLabelPlaceholder = (text: string, labelMarkup: ReactNode) => {
    const splitText = text.split(LABEL_MARKUP_PLACEHOLDER);

    if (splitText.length > 1) {
        return (
            <>
                {splitText[0].trim()} {labelMarkup}
            </>
        );
    }

    return text;
};

const IASelectImportTypeStep = ({
    provider,
    addresses,
    modalModel,
    updateModalModel,
    toEmail,
    checkedTypes,
    updateCheckedTypes,
    calendars,
    labels,
    folders,
    featureMap,
}: Props) => {
    const easySwitchFeature = useFeature<EasySwitchFeatureFlag>(FeatureCode.EasySwitch);
    const easySwitchFeatureValue = easySwitchFeature.feature?.Value;

    const { current: initialCheckedTypeKeys } = useRef<ImportType[]>(
        Object.entries(checkedTypes).reduce((acc, [key, value]) => {
            if (value === true) {
                acc = [...acc, key as ImportType];
            }
            return acc;
        }, [] as ImportType[])
    );

    const isEasySwitchMailEnabled = (() => {
        if (provider === OAUTH_PROVIDER.GOOGLE) {
            return featureMap?.GoogleMail;
        }
        if (provider === OAUTH_PROVIDER.OUTLOOK) {
            return featureMap?.OutlookMail;
        }
    })();
    const isEasySwitchContactsEnabled = (() => {
        if (provider === OAUTH_PROVIDER.GOOGLE) {
            return featureMap?.GoogleContacts;
        }
        if (provider === OAUTH_PROVIDER.OUTLOOK) {
            return featureMap?.OutlookContacts;
        }
    })();

    const isEasySwitchCalendarEnabled = (() => {
        if (provider === OAUTH_PROVIDER.GOOGLE) {
            return featureMap?.GoogleCalendar;
        }
        if (provider === OAUTH_PROVIDER.OUTLOOK) {
            return featureMap?.OutlookCalendar;
        }
    })();

    const { oauthProps, payload, tokenScope } = modalModel;

    const initialModel = useRef<IAOauthModalModel>();

    const isLabelMapping = provider === OAUTH_PROVIDER.GOOGLE;

    const { createModal } = useModals();
    const [importContactModal, onImportContact] = useModalTwo<void, void>(ContactImportModal, false);

    const { getDefaultMapping, getDefaultLabel, getMailMappingErrors } = useIAMailPayload({
        email: modalModel.importedEmail,
        providerFolders: modalModel.data[MAIL].providerFolders,
        isLabelMapping,
        labels,
        folders,
    });

    const toggleCheckedProduct = (product: ImportType) => {
        updateCheckedTypes({
            ...checkedTypes,
            [product]: !checkedTypes[product],
        });
    };

    const importedEmailAddressStrong = <strong key={modalModel.importedEmail}>{modalModel.importedEmail}</strong>;

    const topParagraphRenderer = () => {
        if (!oauthProps) {
            return <div>{c('Info').t`Select what you want to import.`}</div>;
        }

        return hasDataToImport(modalModel.data, initialCheckedTypeKeys) ? (
            <>
                <div className="mb1">
                    {c('Info')
                        .jt`Your data is ready to import from ${importedEmailAddressStrong} to your Proton account.`}
                </div>
                <div>{c('Info').t`Just confirm your selection and we'll do the rest.`}</div>
            </>
        ) : null;
    };

    const handleMailModelUpdate = (selectedPeriod: TIME_PERIOD, payload: MailImporterPayload) => {
        updateModalModel({
            ...modalModel,
            AddressID: payload.AddressID || modalModel.AddressID,
            data: {
                ...modalModel.data,
                [MAIL]: {
                    ...modalModel.data[MAIL],
                    selectedPeriod,
                },
            },
            payload: {
                ...modalModel.payload,
                [MAIL]: payload,
            },
        });
    };

    const updateCalendarMapping = (Mapping: CalendarImportMapping[]) => {
        const initialCalendarPayload = initialModel.current?.payload[ImportType.CALENDAR];

        if (!initialCalendarPayload) {
            return;
        }

        const CustomCalendarMapping = !isDeepEqual(initialCalendarPayload.Mapping, Mapping)
            ? IsCustomCalendarMapping.TRUE
            : IsCustomCalendarMapping.FALSE;

        updateModalModel({
            ...modalModel,
            payload: {
                ...modalModel.payload,
                [CALENDAR]: {
                    Mapping,
                    CustomCalendarMapping,
                },
            },
        });
    };

    const disableMail = oauthProps && !tokenScope?.includes(MAIL);
    const disableCalendar = oauthProps && !tokenScope?.includes(CALENDAR);
    const disableContacts = oauthProps && !tokenScope?.includes(CONTACTS);
    // const disableDrive = oauthProps && !tokenScope?.includes(DRIVE);

    const calendarsToBeCreated =
        modalModel.payload[CALENDAR]?.Mapping.filter((m) => m.Destination.startsWith(CALENDAR_TO_BE_CREATED_PREFIX))
            .length || 0;

    const mailMappingErrors = useMemo(() => {
        const mailMapping = modalModel.payload[ImportType.MAIL]?.Mapping;
        return mailMapping ? getMailMappingErrors(mailMapping) : [];
    }, [modalModel.payload[ImportType.MAIL]?.Mapping]);

    const calendarLimitReached = calendarsToBeCreated + calendars.length > MAX_CALENDARS_PAID;

    const payloadErrors = [
        checkedTypes[MAIL] && mailMappingErrors,
        checkedTypes[CALENDAR] && calendarLimitReached && CalendarImportPayloadError.MAX_CALENDARS_LIMIT_REACHED,
    ]
        .flat(1)
        .filter(isTruthy);

    const hasErrors = payloadErrors.length > 0;

    const errorBox = (
        <div className="rounded-lg p1 mt1 bg-danger color-white text-semibold border-none">
            {c('Error').ngettext(
                msgid`Please fix the highlighted conflict to proceed.`,
                `Please fix the highlighted conflicts to proceed.`,
                payloadErrors.length
            )}
        </div>
    );

    const getMailSummary = (isLabels: boolean) => {
        const { data, payload } = modalModel;

        if (!payload[MAIL]) {
            return null;
        }

        const { Mapping, ImportLabel } = payload[MAIL] as MailImporterPayload;
        const { providerFolders, selectedPeriod } = data[MAIL];

        const getPeriodFragment = () => {
            switch (selectedPeriod) {
                case TIME_PERIOD.LAST_3_MONTHS:
                    // translator: This fragment is to be used in a sentence, here is an example of a complete sentence: "Import all messages from 1 out of 5 labels since the last 3 months and label them as ..." followed by the label HTML element
                    return c('Time period').t`the last 3 months`;
                case TIME_PERIOD.LAST_MONTH:
                    // translator: This fragment is to be used in a sentence, here is an example of a complete sentence: "Import all messages from 4 labels since the last month and label them as ..." followed by the label HTML element
                    return c('Time period').t`the last month`;
                case TIME_PERIOD.LAST_YEAR:
                    // translator: This fragment is to be used in a sentence, here is an example of a complete sentence: "Import all messages from 2 out of 4 labels since the last 12 months and label them as ..." followed by the label HTML element
                    return c('Time period').t`the last 12 months`;
                case TIME_PERIOD.BIG_BANG:
                default:
                    // translator: This fragment is to be used in a sentence, here is an example of a complete sentence: "Import all messages from 13 out of 15 labels since account creation date and label them as ..." followed by the label HTML element
                    return c('Time period').t`account creation date`;
            }
        };

        const totalLabelsCount = providerFolders.filter(
            (item) => !GMAIL_CATEGORIES.includes(item.Source as MailImportGmailCategories)
        ).length;
        const selectedLabelsCount = Mapping.filter(
            (item) => item.checked && !GMAIL_CATEGORIES.includes(item.Source as MailImportGmailCategories)
        ).length;

        const periodFragment = getPeriodFragment();

        const label = (
            <LabelStack
                key="label"
                labels={[
                    {
                        name: ImportLabel?.Name || '',
                        color: ImportLabel?.Color || '',
                    },
                ]}
            />
        );

        // translator: here is an example of a complete sentence: "Import all messages from 12 labels since the last month and label them as ..." followed by the label HTML element
        const summaryAllLabels = isLabels
            ? c('Mail import summary').ngettext(
                  msgid`Import all messages from ${totalLabelsCount} label since ${periodFragment} and label them as ${LABEL_MARKUP_PLACEHOLDER}`,
                  `Import all messages from ${totalLabelsCount} labels since ${periodFragment} and label them as ${LABEL_MARKUP_PLACEHOLDER}`,
                  totalLabelsCount
              )
            : c('Mail import summary').ngettext(
                  msgid`Import all messages from ${totalLabelsCount} folder since ${periodFragment} and label them as ${LABEL_MARKUP_PLACEHOLDER}`,
                  `Import all messages from ${totalLabelsCount} folders since ${periodFragment} and label them as ${LABEL_MARKUP_PLACEHOLDER}`,
                  totalLabelsCount
              );

        // translator: here is an example of a complete sentence: "Import all messages from 3 out of 5 labels since the last 3 months and label them as ..." followed by the label HTML element
        const summarySelectedLabels = isLabels
            ? c('Mail import summary').ngettext(
                  msgid`Import all messages from ${selectedLabelsCount} out of ${totalLabelsCount} label since ${periodFragment} and label them as ${LABEL_MARKUP_PLACEHOLDER}`,
                  `Import all messages from ${selectedLabelsCount} out of ${totalLabelsCount} labels since ${periodFragment} and label them as ${LABEL_MARKUP_PLACEHOLDER}`,
                  totalLabelsCount
              )
            : c('Mail import summary').ngettext(
                  msgid`Import all messages from ${selectedLabelsCount} out of ${totalLabelsCount} folder since ${periodFragment} and label them as ${LABEL_MARKUP_PLACEHOLDER}`,
                  `Import all messages from ${selectedLabelsCount} out of ${totalLabelsCount} folders since ${periodFragment} and label them as ${LABEL_MARKUP_PLACEHOLDER}`,
                  totalLabelsCount
              );

        return replaceLabelPlaceholder(
            totalLabelsCount === selectedLabelsCount ? summaryAllLabels : summarySelectedLabels,
            label
        );
    };

    const mailRowRenderer = () => {
        const hideIfUncheckedOnSelectStep =
            modalModel.step === IAOauthModalModelStep.SELECT_IMPORT_TYPE && !initialCheckedTypeKeys.includes(MAIL);
        if (disableMail || hideIfUncheckedOnSelectStep) {
            return null;
        }

        const showSummary = oauthProps && !disableMail && checkedTypes[MAIL];

        const mailErrors = payloadErrors.filter((payloadError) =>
            [
                MailImportPayloadError.MAX_FOLDERS_LIMIT_REACHED,
                MailImportPayloadError.FOLDER_NAMES_TOO_LONG,
                MailImportPayloadError.LABEL_NAMES_TOO_LONG,
                MailImportPayloadError.UNAVAILABLE_NAMES,
                MailImportPayloadError.RESERVED_NAMES,
            ].includes(payloadError as MailImportPayloadError)
        );

        const error = modalModel.data[MAIL].error;

        return error ? (
            <IADisabledCheckbox id="mail">{error}</IADisabledCheckbox>
        ) : (
            <FormLabel
                htmlFor="mail"
                className={classnames([
                    'pt1-5 pb1-5 border-bottom flex label w100',
                    disableMail && 'cursor-default color-weak',
                ])}
            >
                <Checkbox
                    id="mail"
                    checked={isEasySwitchMailEnabled && checkedTypes[MAIL]}
                    onChange={() => toggleCheckedProduct(MAIL)}
                    className="mr0-5 flex-align-self-start"
                    disabled={disableMail || !isEasySwitchMailEnabled}
                />
                <div className="flex flex-column flex-item-fluid">
                    <div className={classnames([showSummary && 'mb0-5', !isEasySwitchMailEnabled && 'color-weak'])}>
                        {c('Label').t`Emails`}
                        {!isEasySwitchMailEnabled && (
                            <span className="block">
                                {c('Label').t`(Temporarily unavailable. Please check back later.)`}
                            </span>
                        )}
                    </div>
                    {showSummary && (
                        <>
                            {mailErrors.length > 0 ? (
                                <div className="flex color-danger">
                                    <Icon
                                        name="exclamation-circle-filled"
                                        className="mr0-5 flex-nowrap"
                                        style={{ marginTop: 4 }}
                                    />

                                    <div className="flex-item-fluid">
                                        {mailErrors.includes(MailImportPayloadError.MAX_FOLDERS_LIMIT_REACHED) && (
                                            <div className="mb1">
                                                {c('Error')
                                                    .t`There are too many folders in your external account. Please customize the import to delete some folders.`}
                                            </div>
                                        )}

                                        {mailErrors.includes(MailImportPayloadError.LABEL_NAMES_TOO_LONG) && (
                                            <div className="mb1">
                                                {c('Error')
                                                    .t`Some of your label names exceed ${MAIL_APP_NAME}'s maximum character limit. Please customize the import to edit these names.`}
                                            </div>
                                        )}

                                        {mailErrors.includes(MailImportPayloadError.FOLDER_NAMES_TOO_LONG) && (
                                            <div className="mb1">
                                                {c('Error')
                                                    .t`Some of your folder names exceed ${MAIL_APP_NAME}'s maximum character limit. Please customize the import to edit these names.`}
                                            </div>
                                        )}

                                        {mailErrors.includes(MailImportPayloadError.UNAVAILABLE_NAMES) && (
                                            <div className="mb1">
                                                {isLabelMapping
                                                    ? c('Error')
                                                          .t`Some of your label names are unavailable. Please customize the import to edit these names.`
                                                    : c('Error')
                                                          .t`Some of your folder names are unavailable. Please customize the import to edit these names.`}
                                            </div>
                                        )}

                                        {mailErrors.includes(MailImportPayloadError.RESERVED_NAMES) && (
                                            <div className="mb1">
                                                {isLabelMapping
                                                    ? c('Error')
                                                          .t`Some of your label names are reserved. Please customize the import to edit these names.`
                                                    : c('Error')
                                                          .t`Some of your folder names are reserved. Please customize the import to edit these names.`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="color-weak">{getMailSummary(isLabelMapping)}</div>
                            )}
                            <UnderlineButton
                                className="flex-align-self-start pb0"
                                onClick={() =>
                                    createModal(
                                        <CustomizeMailImportModal
                                            payload={payload[MAIL] as MailImporterPayload}
                                            updateModel={handleMailModelUpdate}
                                            providerFolders={modalModel.data[MAIL].providerFolders}
                                            addresses={addresses}
                                            isLabelMapping={isLabelMapping}
                                            customizeFoldersOpen={hasErrors}
                                            labels={labels}
                                            folders={folders}
                                            importedEmail={modalModel.importedEmail}
                                            selectedPeriod={modalModel.data[MAIL].selectedPeriod}
                                        />
                                    )
                                }
                            >
                                {c('Action').t`Customize`}
                            </UnderlineButton>
                        </>
                    )}
                </div>
            </FormLabel>
        );
    };

    const getCalendarSummary = () => {
        const { data, payload } = modalModel;

        if (!payload[CALENDAR]) {
            return null;
        }

        const { Mapping } = payload[CALENDAR] as CalendarImporterPayload;
        const { providerCalendars } = data[CALENDAR];

        const selectedCalendarsCount = Mapping.length;
        const totalCalendarsCount = providerCalendars.length;

        const calendarsFragment = c('Info').ngettext(
            msgid`Import ${selectedCalendarsCount} of ${totalCalendarsCount} calendar`,
            `Import ${selectedCalendarsCount} of ${totalCalendarsCount} calendars`,
            totalCalendarsCount
        );

        const calendarsToBeCreated = Mapping.filter((m) =>
            m.Destination.startsWith(CALENDAR_TO_BE_CREATED_PREFIX)
        ).length;
        const calendarsToBeMerged = selectedCalendarsCount - calendarsToBeCreated;

        const toBeCreatedFragment = calendarsToBeCreated
            ? c('Info').ngettext(
                  msgid`Create ${calendarsToBeCreated} new calendar`,
                  `Create ${calendarsToBeCreated} new calendars`,
                  calendarsToBeCreated
              )
            : null;

        const toBeMergedFragment = calendarsToBeMerged
            ? c('Info').ngettext(
                  msgid`${calendarsToBeMerged} merged calendar`,
                  `${calendarsToBeMerged} merged calendars`,
                  calendarsToBeMerged
              )
            : null;

        const mappingFragment = [toBeCreatedFragment, toBeMergedFragment]
            .filter(isTruthy)
            .join(` ${c('Info').t`and`} `);

        return `${calendarsFragment}: ${mappingFragment}`;
    };

    const calendarRowRenderer = () => {
        const hideIfUncheckedOnSelectStep =
            modalModel.step === IAOauthModalModelStep.SELECT_IMPORT_TYPE && !initialCheckedTypeKeys.includes(CALENDAR);
        if (disableCalendar || hideIfUncheckedOnSelectStep) {
            return null;
        }

        const showSummary = oauthProps && !disableCalendar && checkedTypes[CALENDAR];
        const error = modalModel.data[CALENDAR].error;

        return error ? (
            <IADisabledCheckbox id="calendar">{error}</IADisabledCheckbox>
        ) : (
            <FormLabel
                htmlFor="calendar"
                className={classnames(['pt1-5 pb1-5 flex label w100', disableCalendar && 'cursor-default color-weak'])}
            >
                <Checkbox
                    id="calendar"
                    checked={isEasySwitchCalendarEnabled && checkedTypes[CALENDAR]}
                    onChange={() => toggleCheckedProduct(CALENDAR)}
                    className="mr0-5 flex-align-self-start"
                    disabled={disableCalendar || !isEasySwitchCalendarEnabled}
                />
                <div className="flex flex-column flex-item-fluid">
                    <div className={classnames([showSummary && 'mb0-5', !isEasySwitchCalendarEnabled && 'color-weak'])}>
                        {c('Label').t`Calendars`}
                        {!isEasySwitchCalendarEnabled && (
                            <span className="block">
                                {c('Label').t`(Temporarily unavailable. Please check back later.)`}
                            </span>
                        )}
                    </div>
                    {showSummary && (
                        <>
                            {payloadErrors.includes(CalendarImportPayloadError.MAX_CALENDARS_LIMIT_REACHED) ? (
                                <div className="flex color-danger">
                                    <Icon name="exclamation-circle-filled" className="flex-align-self-center mr0-5" />
                                    {c('Error').t`Calendar limit reached`}
                                </div>
                            ) : (
                                <div className="color-weak">{getCalendarSummary()}</div>
                            )}

                            <UnderlineButton
                                className="flex-align-self-start pb0"
                                onClick={() =>
                                    createModal(
                                        <CustomizeCalendarImportModal
                                            providerCalendars={modalModel.data[CALENDAR].providerCalendars}
                                            calendars={calendars}
                                            activeCalendars={getProbablyActiveCalendars(calendars)}
                                            importedEmailAddress={modalModel.importedEmail}
                                            toEmail={toEmail}
                                            payload={modalModel.payload[CALENDAR] as CalendarImporterPayload}
                                            onUpdateCalendarMapping={updateCalendarMapping}
                                        />
                                    )
                                }
                            >
                                {c('Action').t`Customize`}
                            </UnderlineButton>
                        </>
                    )}
                </div>
            </FormLabel>
        );
    };

    const getContactsSummary = () => {
        const { data } = modalModel;

        const { numContacts, numContactGroups } = data[CONTACTS];

        const contactsFragment = c('Info').ngettext(
            msgid`${numContacts} contact`,
            `${numContacts} contacts`,
            numContacts
        );
        const contactsGroupsFragment = c('Info').ngettext(
            msgid`${numContactGroups} contact group`,
            `${numContactGroups} contact groups`,
            numContactGroups
        );

        return c('Info').t`Import ${contactsFragment} and ${contactsGroupsFragment}`;
    };

    const contactsRowRenderer = () => {
        const hideIfUncheckedOnSelectStep =
            modalModel.step === IAOauthModalModelStep.SELECT_IMPORT_TYPE && !initialCheckedTypeKeys.includes(CONTACTS);
        if (disableContacts || hideIfUncheckedOnSelectStep) {
            return null;
        }

        if (provider === OAUTH_PROVIDER.OUTLOOK && easySwitchFeatureValue?.OutlookContacts === false) {
            return (
                <div className="pt1-5 pb1-5 border-bottom flex label w100 cursor-default color-weak">
                    <Checkbox id="mail" className="mr0-5 flex-align-self-start" disabled />
                    <div className="flex flex-column flex-item-fluid">
                        {c('Label').t`Contacts`} ({c('Label').t`Coming soon`})
                        <InlineLinkButton
                            color="weak"
                            onClick={() => {
                                createModal(
                                    <EasySwitchInstructionsModal
                                        importType={ImportType.CONTACTS}
                                        addresses={addresses}
                                        provider={NON_OAUTH_PROVIDER.OUTLOOK}
                                        onOpenCalendarModal={() => {}}
                                        onImportContact={onImportContact}
                                    />
                                );
                            }}
                        >
                            {c('Label').t`Upload file`}
                        </InlineLinkButton>
                    </div>
                </div>
            );
        }

        const showSummary = oauthProps && !disableContacts && checkedTypes[CONTACTS];
        const error = modalModel.data[CONTACTS].error;

        return error ? (
            <IADisabledCheckbox id="contacts">{error}</IADisabledCheckbox>
        ) : (
            <FormLabel
                htmlFor="contacts"
                className={classnames([
                    'pt1-5 pb1-5 border-bottom flex label w100',
                    disableContacts && 'cursor-default color-weak',
                ])}
            >
                <Checkbox
                    id="contacts"
                    checked={isEasySwitchContactsEnabled && checkedTypes[CONTACTS]}
                    onChange={() => toggleCheckedProduct(CONTACTS)}
                    className="mr0-5 flex-align-self-start"
                    disabled={disableContacts || !isEasySwitchContactsEnabled}
                />

                <div className="flex flex-column flex-item-fluid">
                    <div className={classnames([showSummary && 'mb0-5', !isEasySwitchContactsEnabled && 'color-weak'])}>
                        {c('Label').t`Contacts`}
                        {!isEasySwitchContactsEnabled && (
                            <span className="block">
                                {c('Label').t`(Temporarily unavailable. Please check back later.)`}
                            </span>
                        )}
                    </div>
                    {showSummary && <div className="color-weak">{getContactsSummary()}</div>}
                </div>
            </FormLabel>
        );
    };

    /*
    const driveRowRenderer = () => {
        return (
            <FormLabel
                htmlFor="drive"
                className={classnames(['pt1-5 pb1-5 flex label w100', disableDrive && 'cursor-default color-weak'])}
            >
                <Checkbox
                    id="drive"
                    checked={checkedTypes[DRIVE]}
                    onChange={() => toggleCheckedProduct(DRIVE)}
                    className="mr0-5"
                    disabled={disableDrive}
                />

                <div>{c('Label').t`Drive`}</div>
            </FormLabel>
        );
    };
    */

    // Update CustomFields
    useEffect(() => {
        const mailPayload = modalModel.payload[ImportType.MAIL];
        const initialMailPayload = initialModel.current?.payload[ImportType.MAIL];

        if (!initialMailPayload || !mailPayload) {
            return;
        }

        const { StartTime, ImportLabel, Mapping } = initialMailPayload;

        const isCustomPeriod = StartTime !== mailPayload.StartTime;
        const isCustomLabel = !isDeepEqual(ImportLabel, mailPayload.ImportLabel);
        const isCustomMapping = !isDeepEqual(Mapping, mailPayload.Mapping);

        let CustomFields = 0;

        if (isCustomMapping) {
            CustomFields += CustomFieldsBitmap.Mapping;
        }
        if (isCustomLabel) {
            CustomFields += CustomFieldsBitmap.Label;
        }
        if (isCustomPeriod) {
            CustomFields += CustomFieldsBitmap.Period;
        }

        if (CustomFields === modalModel.payload[ImportType.MAIL]?.CustomFields) {
            return;
        }

        updateModalModel({
            ...modalModel,
            payload: {
                ...modalModel.payload,
                [ImportType.MAIL]: {
                    ...mailPayload,
                    CustomFields,
                },
            },
        });
    }, [
        modalModel.payload[ImportType.MAIL]?.StartTime,
        modalModel.payload[ImportType.MAIL]?.ImportLabel,
        modalModel.payload[ImportType.MAIL]?.Mapping,
    ]);

    useEffect(() => {
        updateModalModel({
            ...modalModel,
            isPayloadInvalid: hasErrors,
        });
    }, [hasErrors]);

    useEffect(() => {
        if (!oauthProps || modalModel.isImportError) {
            return;
        }

        const payload: LaunchImportPayload = {
            ImporterID: modalModel.data.importerID,
        };

        if (modalModel.data[MAIL]) {
            payload[MAIL] = {
                AddressID: addresses[0].ID,
                Mapping: getDefaultMapping(),
                ImportLabel: getDefaultLabel(),
                CustomFields: 0,
            };
        }

        if (modalModel.data[CALENDAR]) {
            const calendarDefaultMapping = modalModel.data[CALENDAR].providerCalendars.map(
                ({ ID, Source, Description }) => ({
                    Source: ID,
                    Destination: `${CALENDAR_TO_BE_CREATED_PREFIX}${Source}`,
                    Description,
                })
            );

            payload[CALENDAR] = {
                Mapping: calendarDefaultMapping,
                CustomCalendarMapping: IsCustomCalendarMapping.FALSE,
            };
        }

        if (modalModel.data[CONTACTS]) {
            payload[CONTACTS] = {};
        }

        // if (modalModel.data[DRIVE]) {
        //     payload[DRIVE] = {};
        // }

        const newModel = {
            ...modalModel,
            payload,
        };

        initialModel.current = newModel;

        updateModalModel(newModel);
    }, [oauthProps, modalModel.isImportError]);

    return (
        <>
            {topParagraphRenderer()}

            {payloadErrors.length > 0 && errorBox}

            <div className="max-w30e">
                {mailRowRenderer()}
                {contactsRowRenderer()}
                {calendarRowRenderer()}
                {importContactModal}
                {/* driveRowRenderer() */}
            </div>
        </>
    );
};

export default IASelectImportTypeStep;

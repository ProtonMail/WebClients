import { ReactNode, useEffect, useMemo, useRef } from 'react';
import { c, msgid } from 'ttag';

import { Folder } from '@proton/shared/lib/interfaces/Folder';
import { Address, Label } from '@proton/shared/lib/interfaces';
import {
    CheckedProductMap,
    ImportType,
    IAOauthModalModel,
    LaunchImportPayload,
    MailImporterPayload,
    TIME_PERIOD,
    CalendarImportMapping,
    CalendarImporterPayload,
    MailImportPayloadError,
    CalendarImportPayloadError,
    CustomFieldsBitmap,
    IsCustomCalendarMapping,
} from '@proton/shared/lib/interfaces/EasySwitch';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { MAX_CALENDARS_PER_USER } from '@proton/shared/lib/calendar/constants';
import { getProbablyActiveCalendars } from '@proton/shared/lib/calendar/calendar';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';

import { Checkbox, Icon, Label as FormLabel, LabelStack, LinkButton } from '../../../components';
import { useModals } from '../../../hooks';

import CustomizeMailImportModal from '../mail/modals/CustomizeMailImportModal';
import CustomizeCalendarImportModal from '../calendar/modals/CustomizeCalendarImportModal';
import useIAMailPayload from '../hooks/useIAMailPayload';
import { classnames } from '../../../helpers';
import { CALENDAR_TO_BE_CREATED_PREFIX } from '../constants';

interface Props {
    addresses: Address[];
    modalModel: IAOauthModalModel;
    updateModalModel: (newModel: IAOauthModalModel) => void;
    checkedTypes: CheckedProductMap;
    updateCheckedTypes: (productMap: CheckedProductMap) => void;
    toEmail: string;
    calendars: Calendar[];
    labels: Label[];
    folders: Folder[];
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
    addresses,
    modalModel,
    updateModalModel,
    toEmail,
    checkedTypes,
    updateCheckedTypes,
    calendars,
    labels,
    folders,
}: Props) => {
    const { oauthProps, payload, tokenScope } = modalModel;

    const initialModel = useRef<IAOauthModalModel>();

    const { createModal } = useModals();

    const { getDefaultMapping, getDefaultLabel, getMailMappingErrors } = useIAMailPayload({
        email: modalModel.importedEmail,
        providerFolders: modalModel.data[MAIL].providerFolders,
        isLabelMapping: true,
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
            return <div>{c('Info').t`What do you want to import from your Google account?`}</div>;
        }

        return (
            <>
                <div className="mb1">
                    {c('Info')
                        .jt`Your data is ready to import from ${importedEmailAddressStrong} to your Proton account.`}
                </div>
                <div>{c('Info').t`Just confirm your selection and we'll do the rest.`}</div>
            </>
        );
    };

    const handleMailModelUpdate = (selectedPeriod: TIME_PERIOD, payload: MailImporterPayload) => {
        updateModalModel({
            ...modalModel,
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

    const calendarLimitReached = calendarsToBeCreated + calendars.length > MAX_CALENDARS_PER_USER;

    const payloadErrors = [
        checkedTypes[MAIL] && mailMappingErrors,
        checkedTypes[CALENDAR] && calendarLimitReached && CalendarImportPayloadError.MAX_CALENDARS_LIMIT_REACHED,
    ]
        .flat(1)
        .filter(isTruthy);

    const hasErrors = payloadErrors.length > 0;

    const errorBox = (
        <div className="rounded-bigger p1 mt1 bg-danger color-white text-semibold no-border">
            {c('Error').ngettext(
                msgid`Please fix the highlighted conflict to proceed.`,
                `Please fix the highlighted conflicts to proceed.`,
                payloadErrors.length
            )}
        </div>
    );

    const getMailSummary = () => {
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

        const totalLabelsCount = providerFolders.length;
        const selectedLabelsCount = Mapping.filter((item) => item.checked).length;

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
        const summaryAllLabels = c('Mail import summary').ngettext(
            msgid`Import all messages from ${totalLabelsCount} label since ${periodFragment} and label them as ${LABEL_MARKUP_PLACEHOLDER}`,
            `Import all messages from ${totalLabelsCount} labels since ${periodFragment} and label them as ${LABEL_MARKUP_PLACEHOLDER}`,
            totalLabelsCount
        );

        // translator: here is an example of a complete sentence: "Import all messages from 3 out of 5 labels since the last 3 months and label them as ..." followed by the label HTML element
        const summarySelectedLabels = c('Mail import summary').ngettext(
            msgid`Import all messages from ${selectedLabelsCount} out of ${totalLabelsCount} label since ${periodFragment} and label them as ${LABEL_MARKUP_PLACEHOLDER}`,
            `Import all messages from ${selectedLabelsCount} out of ${totalLabelsCount} labels since ${periodFragment} and label them as ${LABEL_MARKUP_PLACEHOLDER}`,
            totalLabelsCount
        );

        return replaceLabelPlaceholder(
            totalLabelsCount === selectedLabelsCount ? summaryAllLabels : summarySelectedLabels,
            label
        );
    };

    const mailRowRenderer = () => {
        if (disableMail) {
            return null;
        }

        const showSummary = oauthProps && !disableMail && checkedTypes[MAIL];

        const mailErrors = payloadErrors.filter((e) =>
            [
                MailImportPayloadError.MAX_FOLDERS_LIMIT_REACHED,
                MailImportPayloadError.FOLDER_NAMES_TOO_LONG,
                MailImportPayloadError.LABEL_NAMES_TOO_LONG,
                MailImportPayloadError.UNAVAILABLE_NAMES,
            ].includes(e as MailImportPayloadError)
        );

        return (
            <FormLabel
                htmlFor="mail"
                className={classnames([
                    'pt1-5 pb1-5 border-bottom flex label w100',
                    disableMail && 'cursor-default color-weak',
                ])}
            >
                <Checkbox
                    id="mail"
                    checked={checkedTypes[MAIL]}
                    onChange={() => toggleCheckedProduct(MAIL)}
                    className="mr0-5 flex-align-self-start"
                    disabled={disableMail}
                />
                <div className="flex flex-column flex-item-fluid">
                    <div className={classnames([showSummary && 'mb0-5'])}>{c('Label').t`Emails`}</div>
                    {showSummary && (
                        <>
                            {mailErrors.length > 0 ? (
                                <div className="flex color-danger">
                                    <Icon
                                        name="circle-exclamation-filled"
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
                                                    .t`Some of your label names exceed ProtonMail's maximum character limit. Please customize the import to edit these names.`}
                                            </div>
                                        )}

                                        {mailErrors.includes(MailImportPayloadError.UNAVAILABLE_NAMES) && (
                                            <div className="mb1">
                                                {c('Error')
                                                    .t`Some of your label names are unavailable. Please customize the import to edit these names.`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="color-weak">{getMailSummary()}</div>
                            )}
                            <LinkButton
                                className="flex-align-self-start pb0"
                                onClick={() =>
                                    createModal(
                                        <CustomizeMailImportModal
                                            payload={payload[MAIL] as MailImporterPayload}
                                            updateModel={handleMailModelUpdate}
                                            providerFolders={modalModel.data[MAIL].providerFolders}
                                            addresses={addresses}
                                            isLabelMapping
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
                            </LinkButton>
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
        if (disableCalendar) {
            return null;
        }

        const showSummary = oauthProps && !disableCalendar && checkedTypes[CALENDAR];

        return (
            <FormLabel
                htmlFor="calendar"
                className={classnames([
                    'pt1-5 pb1-5 border-bottom flex label w100',
                    disableCalendar && 'cursor-default color-weak',
                ])}
            >
                <Checkbox
                    id="calendar"
                    checked={checkedTypes[CALENDAR]}
                    onChange={() => toggleCheckedProduct(CALENDAR)}
                    className="mr0-5 flex-align-self-start"
                    disabled={disableCalendar}
                />
                <div className="flex flex-column flex-item-fluid">
                    <div className={classnames([showSummary && 'mb0-5'])}>{c('Label').t`Calendars`}</div>
                    {showSummary && (
                        <>
                            {payloadErrors.includes(CalendarImportPayloadError.MAX_CALENDARS_LIMIT_REACHED) ? (
                                <div className="flex color-danger">
                                    <Icon name="circle-exclamation-filled" className="flex-align-self-center mr0-5" />
                                    {c('Error').t`Calendar limit reached`}
                                </div>
                            ) : (
                                <div className="color-weak">{getCalendarSummary()}</div>
                            )}

                            <LinkButton
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
                            </LinkButton>
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
        if (disableContacts) {
            return null;
        }

        const showSummary = oauthProps && !disableContacts && checkedTypes[CONTACTS];

        return (
            <FormLabel
                htmlFor="contacts"
                className={classnames(['pt1-5 pb1-5 flex label w100', disableContacts && 'cursor-default color-weak'])}
            >
                <Checkbox
                    id="contacts"
                    checked={checkedTypes[CONTACTS]}
                    onChange={() => toggleCheckedProduct(CONTACTS)}
                    className="mr0-5"
                    disabled={disableContacts}
                />

                <div className="flex flex-column flex-item-fluid">
                    <div className={classnames([showSummary && 'mb0-5'])}>{c('Label').t`Contacts`}</div>
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
        if (!oauthProps) {
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
            const calendarDefaultMapping = modalModel.data[CALENDAR].providerCalendars.map(({ ID, Source }) => ({
                Source: ID,
                Destination: `${CALENDAR_TO_BE_CREATED_PREFIX}${Source}`,
            }));

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
    }, [oauthProps]);

    return (
        <>
            {topParagraphRenderer()}

            {payloadErrors.length > 0 && errorBox}

            <div className="max-w30e">
                {mailRowRenderer()}
                {calendarRowRenderer()}
                {contactsRowRenderer()}
                {/* driveRowRenderer() */}
            </div>

            {!oauthProps && (
                <div className="pt1 pb1">
                    {c('Info').t`Next you'll need to log in to your Google account and allow us to access your data.`}
                </div>
            )}
        </>
    );
};

export default IASelectImportTypeStep;

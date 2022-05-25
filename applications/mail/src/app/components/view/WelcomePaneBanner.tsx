import { useEffect, useState } from 'react';
import * as React from 'react';
import { c } from 'ttag';
import { Href, MailShortcutsModal, Price, SettingsLink, useModals, useModalState } from '@proton/components';
import ThemesModal from '@proton/components/containers/themes/ThemesModal';
import { PROTON_DEFAULT_THEME, ThemeTypes } from '@proton/shared/lib/themes/themes';
import { Plan, UserSettings } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS, DRIVE_APP_NAME, MAIL_APP_NAME, PLANS, VPN_APP_NAME } from '@proton/shared/lib/constants';

import { WELCOME_PANE_OPTIONS_URLS } from '../../constants';

interface MessageOption {
    id: number;
    text: string | React.ReactNode;
    cta: React.ReactNode;
    condition?: number;
}

interface Props {
    plans: Plan[];
    theme: ThemeTypes;
    userSettings: UserSettings;
    calendars?: Calendar[];
}
const WelcomePaneBanner = ({ plans, theme, userSettings, calendars = [] }: Props) => {
    const { createModal } = useModals();
    const [option, setOption] = useState<MessageOption>();
    const [{ Currency } = { Currency: undefined }] = plans;

    const [mailShortcutsProps, setMailShortcutsModalOpen] = useModalState();

    const getPrice = () => {
        const plusPlan = plans.find((plan) => plan.Name === PLANS.MAIL);
        return plusPlan ? plusPlan.Pricing['12'] / 12 : 0;
    };

    const encounteredMessagesIDs = getItem('WelcomePaneEncounteredMessages');

    const callToActionTexts = {
        upgrade: c('Action').t`Upgrade`,
        learnMore: c('Action').t`Learn more`,
        openShop: c('Action').t`Open shop`,
        openCalendar: c('Action').t`Open calendar`,
    };

    const calendarAppName = getAppName(APPS.PROTONCALENDAR);

    const messagesOptions: MessageOption[] = [
        {
            id: 0,
            text: c('Info').t`Get more storage and premium features.`,
            cta: (
                <SettingsLink
                    path={WELCOME_PANE_OPTIONS_URLS.plansSelection}
                    className="text-bold link align-baseline color-inherit"
                >
                    {callToActionTexts.upgrade}
                </SettingsLink>
            ),
        },
        {
            id: 1,
            text: (
                <Price
                    currency={Currency}
                    prefix={c('Info').t`Support privacy by upgrading for`}
                    suffix={c('Info').t`per month.`}
                    isDisplayedInSentence
                >
                    {getPrice()}
                </Price>
            ),
            cta: (
                <SettingsLink
                    path={WELCOME_PANE_OPTIONS_URLS.plansSelection}
                    className="text-bold link align-baseline color-inherit"
                >
                    {callToActionTexts.upgrade}
                </SettingsLink>
            ),
        },
        {
            id: 2,
            text: c('Info').t`Upgrade to send email from @pm.me addresses.`,
            cta: (
                <SettingsLink
                    path={WELCOME_PANE_OPTIONS_URLS.plansSelection}
                    className="text-bold link align-baseline color-inherit"
                >
                    {callToActionTexts.upgrade}
                </SettingsLink>
            ),
        },
        {
            id: 3,
            text: c('Info').t`Upgrade to create more folders, filters, and addresses.`,
            cta: (
                <SettingsLink
                    path={WELCOME_PANE_OPTIONS_URLS.plansSelection}
                    className="text-bold link align-baseline color-inherit"
                >
                    {callToActionTexts.upgrade}
                </SettingsLink>
            ),
        },
        {
            id: 4,
            text: c('Info').t`Upgrade to configure a vacation auto-responder.`,
            cta: (
                <SettingsLink
                    path={WELCOME_PANE_OPTIONS_URLS.plansSelection}
                    className="text-bold link align-baseline color-inherit"
                >
                    {callToActionTexts.upgrade}
                </SettingsLink>
            ),
        },
        {
            id: 5,
            text: c('Info').t`Upgrade to use ${MAIL_APP_NAME} with third-party desktop clients.`,
            cta: (
                <SettingsLink
                    path={WELCOME_PANE_OPTIONS_URLS.plansSelection}
                    className="text-bold link align-baseline color-inherit"
                >
                    {callToActionTexts.upgrade}
                </SettingsLink>
            ),
        },
        {
            id: 6,
            text: c('Info').t`Proton doesn't make money by abusing privacy.`,
            cta: (
                <SettingsLink
                    path={WELCOME_PANE_OPTIONS_URLS.plansSelection}
                    className="text-bold link align-baseline color-inherit"
                >
                    {callToActionTexts.upgrade}
                </SettingsLink>
            ),
        },
        {
            id: 7,
            text: c('Info').t`Upgrade to support privacy and get more features.`,
            cta: (
                <SettingsLink
                    path={WELCOME_PANE_OPTIONS_URLS.plansSelection}
                    className="text-bold link align-baseline color-inherit"
                >
                    {callToActionTexts.upgrade}
                </SettingsLink>
            ),
        },
        {
            id: 8,
            text: c('Info').t`Visit our shop to get Proton merchandise.`,
            cta: (
                <Href
                    url={WELCOME_PANE_OPTIONS_URLS.protonShop}
                    className="text-bold link align-baseline color-inherit"
                >
                    {callToActionTexts.openShop}
                </Href>
            ),
        },
        {
            id: 9,
            text: (
                <Price
                    currency={Currency}
                    prefix={c('Info').t`Increase storage space starting at`}
                    suffix={c('Info').t`per month.`}
                    isDisplayedInSentence
                >
                    {getPrice()}
                </Price>
            ),
            cta: (
                <SettingsLink
                    path={WELCOME_PANE_OPTIONS_URLS.plansSelection}
                    className="text-bold link align-baseline color-inherit"
                >
                    {callToActionTexts.upgrade}
                </SettingsLink>
            ),
        },
        userSettings['2FA'] &&
            userSettings['2FA'].Enabled !== 1 && {
                id: 10,
                text: c('Info').t`For increased security, activate 2FA.`,
                cta: (
                    <Href
                        url={WELCOME_PANE_OPTIONS_URLS.proton2FA}
                        className="text-bold link align-baseline color-inherit"
                    >
                        {callToActionTexts.learnMore}
                    </Href>
                ),
            },
        {
            id: 11,
            text: c('Info').t`Use keyboard shortcuts to manage your email faster.`,
            cta: (
                <span
                    onClick={() => setMailShortcutsModalOpen(true)}
                    className="text-bold link align-baseline color-inherit"
                >
                    {callToActionTexts.learnMore}
                </span>
            ),
        },
        theme === PROTON_DEFAULT_THEME && {
            id: 12,
            text: c('Info').t`Themes can give your inbox a new look.`,
            cta: (
                <span
                    onClick={() => createModal(<ThemesModal />)}
                    className="text-bold link align-baseline color-inherit"
                >
                    {callToActionTexts.learnMore}
                </span>
            ),
        },
        {
            id: 13,
            text: c('Info').t`Upgrade to host emails from your own domain name.`,
            cta: (
                <SettingsLink
                    path={WELCOME_PANE_OPTIONS_URLS.plansSelection}
                    className="text-bold link align-baseline color-inherit"
                >
                    {callToActionTexts.upgrade}
                </SettingsLink>
            ),
        },
        {
            id: 14,
            text: c('Info').t`${MAIL_APP_NAME} can protect your business as well.`,
            cta: (
                <Href
                    url={WELCOME_PANE_OPTIONS_URLS.protonBusiness}
                    className="text-bold link align-baseline color-inherit"
                >
                    {callToActionTexts.learnMore}
                </Href>
            ),
        },
        {
            id: 15,
            text: c('Info').t`Upgrade to add more addresses to your account.`,
            cta: (
                <SettingsLink
                    path={WELCOME_PANE_OPTIONS_URLS.plansSelection}
                    className="text-bold link align-baseline color-inherit"
                >
                    {callToActionTexts.upgrade}
                </SettingsLink>
            ),
        },
        {
            id: 16,
            text: c('Info').t`Upgrade to send emails to contact groups easily.`,
            cta: (
                <SettingsLink
                    path={WELCOME_PANE_OPTIONS_URLS.plansSelection}
                    className="text-bold link align-baseline color-inherit"
                >
                    {callToActionTexts.upgrade}
                </SettingsLink>
            ),
        },
        {
            id: 17,
            text: c('Info').t`Upgrade to support a privacy-first internet.`,
            cta: (
                <SettingsLink
                    path={WELCOME_PANE_OPTIONS_URLS.plansSelection}
                    className="text-bold link align-baseline color-inherit"
                >
                    {callToActionTexts.upgrade}
                </SettingsLink>
            ),
        },
        {
            id: 18,
            text: c('Info').t`Upgrade to support our mission of privacy for all.`,
            cta: (
                <SettingsLink
                    path={WELCOME_PANE_OPTIONS_URLS.plansSelection}
                    className="text-bold link align-baseline color-inherit"
                >
                    {callToActionTexts.upgrade}
                </SettingsLink>
            ),
        },
        {
            id: 19,
            text: c('Info').t`Store and share files securely with ${DRIVE_APP_NAME}.`,
            cta: (
                <SettingsLink
                    path={WELCOME_PANE_OPTIONS_URLS.plansSelection}
                    className="text-bold link align-baseline color-inherit"
                >
                    {callToActionTexts.upgrade}
                </SettingsLink>
            ),
        },
        {
            id: 20,
            text: c('Info').t`You can use ${VPN_APP_NAME} for free today.`,
            cta: (
                <Href url={WELCOME_PANE_OPTIONS_URLS.vpn} className="text-bold link align-baseline color-inherit">
                    {callToActionTexts.learnMore}
                </Href>
            ),
        },
        calendars?.length === 0 && {
            id: 21,
            text: c('Info').t`Use ${calendarAppName} to keep your agenda private.`,
            cta: (
                <Href url={WELCOME_PANE_OPTIONS_URLS.calendar} className="text-bold link align-baseline color-inherit">
                    {callToActionTexts.openCalendar}
                </Href>
            ),
        },
    ].filter(isTruthy);

    const getRandomOption = (): MessageOption => {
        let hasSeenAllMessages = false;

        /*
         * Message options can contains less element than the localstorage in the case where the user has triggered a condition in the mean time
         * For example, if the user did not have any calendar items, and had all messages displayed, messageOptions now contains less items than the
         * localStorage array. Instead of checking if length are equals, check if every items of messageOptions have been encountered.
         */
        if (encounteredMessagesIDs) {
            hasSeenAllMessages = messagesOptions.every((option) =>
                encounteredMessagesIDs.includes(option.id.toString())
            );
        }

        const encounteredMessages =
            !encounteredMessagesIDs || hasSeenAllMessages ? [] : JSON.parse(encounteredMessagesIDs);

        const filteredOptions = messagesOptions.filter((option) => !encounteredMessages.includes(option.id));

        // We should never have a filteredOptions empty, but in case it is, display the first option as a fallback
        const randomOption = filteredOptions.length
            ? filteredOptions[Math.floor(Math.random() * filteredOptions.length)]
            : messagesOptions[0];
        setItem('WelcomePaneEncounteredMessages', JSON.stringify([...encounteredMessages, randomOption.id]));
        return randomOption;
    };

    useEffect(() => {
        try {
            setOption(getRandomOption());
        } catch (e: any) {
            console.error(e);
        }
    }, []);

    return (
        <>
            {option ? (
                <div className="bg-primary p1 text-center">
                    <span className="mr1">{option.text}</span>
                    {option.cta}
                </div>
            ) : null}
            <MailShortcutsModal {...mailShortcutsProps} />
        </>
    );
};

export default WelcomePaneBanner;

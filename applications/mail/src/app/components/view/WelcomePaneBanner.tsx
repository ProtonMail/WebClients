import { useEffect, useState } from 'react';
import * as React from 'react';
import { c } from 'ttag';
import { Href, MailShortcutsModal, Price, SettingsLink, useModals } from '@proton/components';
import ThemesModal from '@proton/components/containers/themes/ThemesModal';
import { ThemeTypes } from '@proton/shared/lib/themes/themes';
import { Plan, UserSettings } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';
import { WELCOME_PANE_OPTIONS_CTA_TEXTS, WELCOME_PANE_OPTIONS_URLS } from '../../constants';

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

    const getPrice = () => {
        const plusPlan = plans.find((plan) => plan.Name === 'plus');
        return plusPlan ? plusPlan.Pricing['12'] / 12 : 0;
    };

    const encounteredMessagesIDs = getItem('WelcomePaneEncounteredMessages');

    const messagesOptions: MessageOption[] = [
        {
            id: 0,
            text: c('Info').t`Get more storage and premium features.`,
            cta: (
                <SettingsLink
                    path={WELCOME_PANE_OPTIONS_URLS.plansSelection}
                    className="text-bold link align-baseline color-inherit"
                >
                    {WELCOME_PANE_OPTIONS_CTA_TEXTS().upgrade}
                </SettingsLink>
            ),
        },
        {
            id: 1,
            text: (
                <Price
                    currency={Currency}
                    prefix={c('Info').t`Support privacy by upgrading for`}
                    suffix={c('Info').t`/month.`}
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
                    {WELCOME_PANE_OPTIONS_CTA_TEXTS().upgrade}
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
                    {WELCOME_PANE_OPTIONS_CTA_TEXTS().upgrade}
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
                    {WELCOME_PANE_OPTIONS_CTA_TEXTS().upgrade}
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
                    {WELCOME_PANE_OPTIONS_CTA_TEXTS().upgrade}
                </SettingsLink>
            ),
        },
        {
            id: 5,
            text: c('Info').t`Upgrade to use ProtonMail with third-party desktop clients.`,
            cta: (
                <SettingsLink
                    path={WELCOME_PANE_OPTIONS_URLS.plansSelection}
                    className="text-bold link align-baseline color-inherit"
                >
                    {WELCOME_PANE_OPTIONS_CTA_TEXTS().upgrade}
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
                    {WELCOME_PANE_OPTIONS_CTA_TEXTS().upgrade}
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
                    {WELCOME_PANE_OPTIONS_CTA_TEXTS().upgrade}
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
                    {WELCOME_PANE_OPTIONS_CTA_TEXTS().openShop}
                </Href>
            ),
        },
        {
            id: 9,
            text: (
                <Price
                    currency={Currency}
                    prefix={c('Info').t`Increase storage space starting at`}
                    suffix={c('Info').t`/month.`}
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
                    {WELCOME_PANE_OPTIONS_CTA_TEXTS().upgrade}
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
                        {WELCOME_PANE_OPTIONS_CTA_TEXTS().learnMore}
                    </Href>
                ),
            },
        {
            id: 11,
            text: c('Info').t`Use keyboard shortcuts to manage your email faster.`,
            cta: (
                <span
                    onClick={() => createModal(<MailShortcutsModal />, 'shortcuts-modal')}
                    className="text-bold link align-baseline color-inherit"
                >
                    {WELCOME_PANE_OPTIONS_CTA_TEXTS().learnMore}
                </span>
            ),
        },
        theme === ThemeTypes.Default && {
            id: 12,
            text: c('Info').t`Themes can give your inbox a new look.`,
            cta: (
                <span
                    onClick={() => createModal(<ThemesModal />)}
                    className="text-bold link align-baseline color-inherit"
                >
                    {WELCOME_PANE_OPTIONS_CTA_TEXTS().learnMore}
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
                    {WELCOME_PANE_OPTIONS_CTA_TEXTS().upgrade}
                </SettingsLink>
            ),
        },
        {
            id: 14,
            text: c('Info').t`ProtonMail can protect your business as well.`,
            cta: (
                <Href
                    url={WELCOME_PANE_OPTIONS_URLS.protonBusiness}
                    className="text-bold link align-baseline color-inherit"
                >
                    {WELCOME_PANE_OPTIONS_CTA_TEXTS().learnMore}
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
                    {WELCOME_PANE_OPTIONS_CTA_TEXTS().upgrade}
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
                    {WELCOME_PANE_OPTIONS_CTA_TEXTS().upgrade}
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
                    {WELCOME_PANE_OPTIONS_CTA_TEXTS().upgrade}
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
                    {WELCOME_PANE_OPTIONS_CTA_TEXTS().upgrade}
                </SettingsLink>
            ),
        },
        {
            id: 19,
            text: c('Info').t`Store and share files securely with Proton Drive.`,
            cta: (
                <SettingsLink
                    path={WELCOME_PANE_OPTIONS_URLS.plansSelection}
                    className="text-bold link align-baseline color-inherit"
                >
                    {WELCOME_PANE_OPTIONS_CTA_TEXTS().upgrade}
                </SettingsLink>
            ),
        },
        {
            id: 20,
            text: c('Info').t`You can use ProtonVPN for free today.`,
            cta: (
                <Href url={WELCOME_PANE_OPTIONS_URLS.vpn} className="text-bold link align-baseline color-inherit">
                    {WELCOME_PANE_OPTIONS_CTA_TEXTS().learnMore}
                </Href>
            ),
        },
        calendars?.length === 0 && {
            id: 21,
            text: c('Info').t`Use Proton Calendar to keep your agenda private.`,
            cta: (
                <Href url={WELCOME_PANE_OPTIONS_URLS.calendar} className="text-bold link align-baseline color-inherit">
                    {WELCOME_PANE_OPTIONS_CTA_TEXTS().openCalendar}
                </Href>
            ),
        },
    ].filter(isTruthy);

    const getRandomOption = (): MessageOption => {
        const hasSeenAllMessages =
            encounteredMessagesIDs && JSON.parse(encounteredMessagesIDs).length === messagesOptions.length;
        const encounteredMessages =
            !encounteredMessagesIDs || hasSeenAllMessages ? [] : JSON.parse(encounteredMessagesIDs);

        const filteredOptions = messagesOptions.filter((option) => !encounteredMessages.includes(option.id));

        const randomOption = filteredOptions[Math.floor(Math.random() * filteredOptions.length)];
        setItem('WelcomePaneEncounteredMessages', JSON.stringify([...encounteredMessages, randomOption.id]));
        return randomOption;
    };

    useEffect(() => {
        setOption(getRandomOption());
    }, []);

    return (
        <>
            {option ? (
                <div className="bg-primary p1 text-center">
                    <span className="mr1">{option.text}</span>
                    {option.cta}
                </div>
            ) : null}
        </>
    );
};

export default WelcomePaneBanner;

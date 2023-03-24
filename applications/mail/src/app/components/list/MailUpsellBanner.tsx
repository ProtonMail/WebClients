import { MutableRefObject, ReactNode, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import {
    MailShortcutsModal,
    Price,
    PromotionBanner,
    SettingsLink,
    useModalState,
    usePlans,
    useTheme,
} from '@proton/components';
import ThemesModal from '@proton/components/containers/themes/ThemesModal';
import { APP_UPSELL_REF_PATH, MAIL_APP_NAME, PLANS, VPN_APP_NAME } from '@proton/shared/lib/constants';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';
import { PROTON_DEFAULT_THEME } from '@proton/shared/lib/themes/themes';
import isTruthy from '@proton/utils/isTruthy';

import { MAIL_UPSELL_BANNERS_OPTIONS_URLS } from '../../constants';

const { plansSelection, vpn, protonBusiness } = MAIL_UPSELL_BANNERS_OPTIONS_URLS;

enum UPSELL_MAIL_BANNER_LINK_ID {
    GET_MORE_STORAGE = 1,
    SEND_FROM_PM_ADDRESS = 3,
    GET_MORE_FOLDERS_FILTERS_AND_ADDRESSES = 4,
    AUTO_REPLY = 5,
    USE_PROTON_VPN = 6,
    THIRD_PARTY_CLIENTS = 7,
    GET_MORE_FEATURES = 9,
    INCREASE_STORAGE = 11,
    HOST_EMAILS_FROM_YOUR_DOMAINS = 15,
    PROTECT_YOUR_BUSINESS = 16,
    ADD_MORE_ADDRESSES = 17,
    CONTACT_GROUPS = 18,
    PRIVACY_FIRST_INTERNET = 19,
    PRIVACY_FOR_ALL = 20,
    STORE_AND_SHARE_FILES = 21,
    PREMIUM_FEATURES = 23,
    LVL_UP_PRIVACY = 24,
}

interface MessageOption {
    id: number;
    text: string | ReactNode;
    cta: ReactNode;
    condition?: number;
}

interface Props {
    needToShowUpsellBanner: MutableRefObject<boolean>;
    columnMode: boolean;
}
const MailUpsellBanner = ({ needToShowUpsellBanner, columnMode }: Props) => {
    const [plans = [], loadingPlans] = usePlans();
    const [theme] = useTheme();

    const [option, setOption] = useState<MessageOption>();

    const [mailShortcutsProps, setMailShortcutsModalOpen, renderShortcutModal] = useModalState();
    const [themesModalProps, setThemesModalOpen, renderThemesModal] = useModalState();

    const getPrice = () => {
        const [{ Currency } = { Currency: undefined }] = plans;

        const plusPlan = plans.find((plan) => plan.Name === PLANS.MAIL);
        const price = plusPlan ? plusPlan.Pricing['12'] / 12 : 0;

        return (
            <Price key="plan-price" currency={Currency}>
                {price}
            </Price>
        );
    };

    const planPrice = useMemo(() => {
        return getPrice();
    }, [loadingPlans]);

    const encounteredMessagesIDs = getItem('WelcomePaneEncounteredMessages');

    const callToActionTexts = {
        upgrade: c('Action').t`Upgrade`,
        business: c('Action').t`See business plans`,
        learnMore: c('Action').t`Learn more`,
    };

    const getLink = (url: string, optionID: number) => {
        const hasParams = url.includes('?');
        return hasParams
            ? `${url}&ref=${APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH}${optionID}`
            : `${url}?ref=${APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH}${optionID}`;
    };

    const messagesOptions: MessageOption[] = useMemo(
        () => [
            {
                id: 0,
                text: c('Info').t`Get more storage and premium features.`,
                cta: (
                    <SettingsLink
                        path={getLink(plansSelection, UPSELL_MAIL_BANNER_LINK_ID.GET_MORE_STORAGE)}
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
                        path={getLink(plansSelection, UPSELL_MAIL_BANNER_LINK_ID.SEND_FROM_PM_ADDRESS)}
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
                        path={getLink(
                            plansSelection,
                            UPSELL_MAIL_BANNER_LINK_ID.GET_MORE_FOLDERS_FILTERS_AND_ADDRESSES
                        )}
                        className="text-bold link align-baseline color-inherit"
                    >
                        {callToActionTexts.upgrade}
                    </SettingsLink>
                ),
            },
            {
                id: 4,
                text: c('Info').t`Upgrade to use auto-reply when you're away.`,
                cta: (
                    <SettingsLink
                        path={getLink(plansSelection, UPSELL_MAIL_BANNER_LINK_ID.AUTO_REPLY)}
                        className="text-bold link align-baseline color-inherit"
                    >
                        {callToActionTexts.upgrade}
                    </SettingsLink>
                ),
            },
            {
                id: 5,
                text: c('Info').t`Upgrade to use ${MAIL_APP_NAME} with Apple Mail, Outlook or Thunderbird.`,
                cta: (
                    <SettingsLink
                        path={getLink(plansSelection, UPSELL_MAIL_BANNER_LINK_ID.THIRD_PARTY_CLIENTS)}
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
                        path={getLink(plansSelection, UPSELL_MAIL_BANNER_LINK_ID.GET_MORE_FEATURES)}
                        className="text-bold link align-baseline color-inherit"
                    >
                        {callToActionTexts.upgrade}
                    </SettingsLink>
                ),
            },
            {
                id: 9,
                /*
                 * translator: Upsell message containing the price of the Plus plan
                 * ${planPrice}: Price of the plus plan in the user currency
                 * Full sentence for reference: "Increase storage space starting at CHF 3.99 per month"
                 */
                text: c('Info').jt`Increase storage space starting at ${planPrice} per month.`,
                cta: (
                    <SettingsLink
                        path={getLink(plansSelection, UPSELL_MAIL_BANNER_LINK_ID.INCREASE_STORAGE)}
                        className="text-bold link align-baseline color-inherit"
                    >
                        {callToActionTexts.upgrade}
                    </SettingsLink>
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
                        onClick={() => setThemesModalOpen(true)}
                        className="text-bold link align-baseline color-inherit"
                    >
                        {callToActionTexts.learnMore}
                    </span>
                ),
            },
            {
                id: 13,
                text: c('Info').t`Upgrade to send emails from your custom email domain.`,
                cta: (
                    <SettingsLink
                        path={getLink(plansSelection, UPSELL_MAIL_BANNER_LINK_ID.HOST_EMAILS_FROM_YOUR_DOMAINS)}
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
                    <SettingsLink
                        path={getLink(protonBusiness, UPSELL_MAIL_BANNER_LINK_ID.PROTECT_YOUR_BUSINESS)}
                        className="text-bold link align-baseline color-inherit"
                    >
                        {callToActionTexts.business}
                    </SettingsLink>
                ),
            },
            {
                id: 15,
                text: c('Info').t`Upgrade to add more addresses to your account.`,
                cta: (
                    <SettingsLink
                        path={getLink(plansSelection, UPSELL_MAIL_BANNER_LINK_ID.ADD_MORE_ADDRESSES)}
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
                        path={getLink(plansSelection, UPSELL_MAIL_BANNER_LINK_ID.CONTACT_GROUPS)}
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
                        path={getLink(plansSelection, UPSELL_MAIL_BANNER_LINK_ID.PRIVACY_FIRST_INTERNET)}
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
                        path={getLink(plansSelection, UPSELL_MAIL_BANNER_LINK_ID.PRIVACY_FOR_ALL)}
                        className="text-bold link align-baseline color-inherit"
                    >
                        {callToActionTexts.upgrade}
                    </SettingsLink>
                ),
            },
            {
                id: 19,
                text: c('Info').t`Secure your files with encrypted cloud storage for free, today.`,
                cta: (
                    <SettingsLink
                        path={getLink(plansSelection, UPSELL_MAIL_BANNER_LINK_ID.STORE_AND_SHARE_FILES)}
                        className="text-bold link align-baseline color-inherit"
                    >
                        {callToActionTexts.upgrade}
                    </SettingsLink>
                ),
            },
            {
                id: 20,
                text: c('Info').t`You can use ${VPN_APP_NAME} for free, today.`,
                cta: (
                    <Href
                        href={getLink(vpn, UPSELL_MAIL_BANNER_LINK_ID.USE_PROTON_VPN)}
                        className="text-bold link align-baseline color-inherit"
                    >
                        {callToActionTexts.learnMore}
                    </Href>
                ),
            },
            {
                id: 23,
                text: c('Info').t`Upgrade to unlock premium features.`,
                cta: (
                    <SettingsLink
                        path={getLink(plansSelection, UPSELL_MAIL_BANNER_LINK_ID.PREMIUM_FEATURES)}
                        className="text-bold link align-baseline color-inherit"
                    >
                        {callToActionTexts.upgrade}
                    </SettingsLink>
                ),
            },
            {
                id: 24,
                text: c('Info').t`Upgrade to level up your privacy.`,
                cta: (
                    <SettingsLink
                        path={getLink(plansSelection, UPSELL_MAIL_BANNER_LINK_ID.LVL_UP_PRIVACY)}
                        className="text-bold link align-baseline color-inherit"
                    >
                        {callToActionTexts.upgrade}
                    </SettingsLink>
                ),
            },
        ],
        [loadingPlans]
    ).filter(isTruthy);

    const getRandomOption = (): MessageOption => {
        let hasSeenAllMessages = false;

        /*
         * Message options can contain less element than the localstorage in the case where the user has triggered a condition in the meantime
         * For example, if the user did not have any calendar items, and had all messages displayed, messageOptions now contains fewer items than the
         * localStorage array. Instead of checking if length are equals, check if every item of messageOptions have been encountered.
         */
        if (encounteredMessagesIDs) {
            const idsArray = JSON.parse(encounteredMessagesIDs);
            hasSeenAllMessages = messagesOptions.every((option) => idsArray.includes(option.id));
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
            if (!loadingPlans) {
                setOption(getRandomOption());
            }
        } catch (e: any) {
            console.error(e);
        }
    }, [loadingPlans]);

    useEffect(() => {
        // On banner unmount, set the ref to false so that we don't show the banner anymore
        return () => {
            needToShowUpsellBanner.current = false;
        };
    }, []);

    return (
        <>
            <PromotionBanner
                description={option?.text}
                cta={option?.cta}
                loading={loadingPlans}
                contentCentered={!columnMode}
            />
            {renderShortcutModal && <MailShortcutsModal {...mailShortcutsProps} />}
            {renderThemesModal && <ThemesModal {...themesModalProps} />}
        </>
    );
};

export default MailUpsellBanner;

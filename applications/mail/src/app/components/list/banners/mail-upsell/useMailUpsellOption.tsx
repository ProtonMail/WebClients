import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import { useTheme } from '@proton/components';
import { MAIL_APP_NAME, PROTON_SENTINEL_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import { MAIL_UPSELL_BANNERS_OPTIONS_URLS } from 'proton-mail/constants';

import MailUpsellOptionCTA from './MailUpsellOptionCTA';

interface Props {
    setMailShortcutsModalOpen: (value: boolean) => void;
    setThemesModalOpen: (value: boolean) => void;
}

export interface MessageOption {
    id: number;
    text: string | ReactNode;
    cta: ReactNode;
    condition?: number;
}

enum UPSELL_MAIL_BANNER_LINK_ID {
    SEND_FROM_PM_ADDRESS = 3,
    GET_MORE_FOLDERS_FILTERS_AND_ADDRESSES = 4,
    AUTO_REPLY = 5,
    THIRD_PARTY_CLIENTS = 7,
    GET_MORE_FEATURES = 9,
    HOST_EMAILS_FROM_YOUR_DOMAINS = 15,
    PROTECT_YOUR_BUSINESS = 16,
    ADD_MORE_ADDRESSES = 17,
    CONTACT_GROUPS = 18,
    PRIVACY_FIRST_INTERNET = 19,
    PRIVACY_FOR_ALL = 20,
    PREMIUM_FEATURES = 23,
    LVL_UP_PRIVACY = 24,
    PROTON_SENTINEL = 25,
}

const linkClasses = 'text-bold link align-baseline';
const { plansSelection, vpn, protonBusiness, drive, securityAndPrivacy } = MAIL_UPSELL_BANNERS_OPTIONS_URLS;

const useMailUpsellOption = ({ setMailShortcutsModalOpen, setThemesModalOpen }: Props) => {
    const theme = useTheme();

    const callToActionTexts = {
        upgrade: c('Action').t`Upgrade`,
        business: c('Action').t`See business plans`,
        learnMore: c('Action').t`Learn more`,
    };

    const messagesOptions: MessageOption[] = useMemo(
        () => [
            {
                id: 2,
                text: c('Info').t`Upgrade to send email from @pm.me addresses.`,
                cta: (
                    <MailUpsellOptionCTA
                        url={plansSelection}
                        optionID={UPSELL_MAIL_BANNER_LINK_ID.SEND_FROM_PM_ADDRESS}
                    />
                ),
            },
            {
                id: 3,
                text: c('Info').t`Upgrade to create more folders, filters, and addresses.`,
                cta: (
                    <MailUpsellOptionCTA
                        url={plansSelection}
                        optionID={UPSELL_MAIL_BANNER_LINK_ID.GET_MORE_FOLDERS_FILTERS_AND_ADDRESSES}
                    />
                ),
            },
            {
                id: 4,
                text: c('Info').t`Upgrade to use auto-reply when you're away.`,
                cta: <MailUpsellOptionCTA url={plansSelection} optionID={UPSELL_MAIL_BANNER_LINK_ID.AUTO_REPLY} />,
            },
            {
                id: 5,
                text: c('Info').t`Upgrade to use ${MAIL_APP_NAME} with Apple Mail, Outlook or Thunderbird.`,
                cta: (
                    <MailUpsellOptionCTA
                        url={plansSelection}
                        optionID={UPSELL_MAIL_BANNER_LINK_ID.THIRD_PARTY_CLIENTS}
                    />
                ),
            },
            {
                id: 7,
                text: c('Info').t`Upgrade to support privacy and get more features.`,
                cta: (
                    <MailUpsellOptionCTA url={plansSelection} optionID={UPSELL_MAIL_BANNER_LINK_ID.GET_MORE_FEATURES} />
                ),
            },
            {
                id: 11,
                text: c('Info').t`Use keyboard shortcuts to manage your email faster.`,
                cta: (
                    <span onClick={() => setMailShortcutsModalOpen(true)} className={linkClasses} tabIndex={0}>
                        {callToActionTexts.learnMore}
                    </span>
                ),
            },
            theme.information.default && {
                id: 12,
                text: c('Info').t`Themes can give your inbox a new look.`,
                cta: (
                    <span onClick={() => setThemesModalOpen(true)} className={linkClasses} tabIndex={0}>
                        {callToActionTexts.learnMore}
                    </span>
                ),
            },
            {
                id: 13,
                text: c('Info').t`Upgrade to send emails from your custom email domain.`,
                cta: (
                    <MailUpsellOptionCTA
                        url={plansSelection}
                        optionID={UPSELL_MAIL_BANNER_LINK_ID.HOST_EMAILS_FROM_YOUR_DOMAINS}
                    />
                ),
            },
            {
                id: 14,
                text: c('Info').t`${MAIL_APP_NAME} can protect your business as well.`,
                cta: (
                    <MailUpsellOptionCTA
                        url={protonBusiness}
                        optionID={UPSELL_MAIL_BANNER_LINK_ID.PROTECT_YOUR_BUSINESS}
                        callToActionText={callToActionTexts.business}
                    />
                ),
            },
            {
                id: 15,
                text: c('Info').t`Upgrade to add more addresses to your account.`,
                cta: (
                    <MailUpsellOptionCTA
                        url={plansSelection}
                        optionID={UPSELL_MAIL_BANNER_LINK_ID.ADD_MORE_ADDRESSES}
                    />
                ),
            },
            {
                id: 16,
                text: c('Info').t`Upgrade to send emails to contact groups easily.`,
                cta: <MailUpsellOptionCTA url={plansSelection} optionID={UPSELL_MAIL_BANNER_LINK_ID.CONTACT_GROUPS} />,
            },
            {
                id: 17,
                text: c('Info').t`Upgrade to support a privacy-first internet.`,
                cta: (
                    <MailUpsellOptionCTA
                        url={plansSelection}
                        optionID={UPSELL_MAIL_BANNER_LINK_ID.PRIVACY_FIRST_INTERNET}
                    />
                ),
            },
            {
                id: 18,
                text: c('Info').t`Upgrade to support our mission of privacy for all.`,
                cta: <MailUpsellOptionCTA url={plansSelection} optionID={UPSELL_MAIL_BANNER_LINK_ID.PRIVACY_FOR_ALL} />,
            },
            {
                id: 19,
                text: c('Info').t`Secure your files with encrypted cloud storage for free, today.`,
                cta: (
                    <Href href={drive} className={linkClasses} tabIndex={0}>
                        {callToActionTexts.learnMore}
                    </Href>
                ),
            },
            {
                id: 20,
                text: c('Info').t`You can use ${VPN_APP_NAME} for free, today.`,
                cta: (
                    <Href href={vpn} className={linkClasses} tabIndex={0}>
                        {callToActionTexts.learnMore}
                    </Href>
                ),
            },
            {
                id: 23,
                text: c('Info').t`Upgrade to unlock premium features.`,
                cta: (
                    <MailUpsellOptionCTA url={plansSelection} optionID={UPSELL_MAIL_BANNER_LINK_ID.PREMIUM_FEATURES} />
                ),
            },
            {
                id: 24,
                text: c('Info').t`Upgrade to level up your privacy.`,
                cta: <MailUpsellOptionCTA url={plansSelection} optionID={UPSELL_MAIL_BANNER_LINK_ID.LVL_UP_PRIVACY} />,
            },
            {
                id: 25,
                // translator: full sentence: "Join Proton Sentinel program for the highest level of account security and support."
                text: c('Info')
                    .t`Join ${PROTON_SENTINEL_NAME} program for the highest level of account security and support.`,
                cta: (
                    <MailUpsellOptionCTA
                        url={securityAndPrivacy}
                        optionID={UPSELL_MAIL_BANNER_LINK_ID.PROTON_SENTINEL}
                        callToActionText={callToActionTexts.learnMore}
                    />
                ),
            },
        ],
        []
    ).filter(isTruthy);

    return messagesOptions;
};

export default useMailUpsellOption;

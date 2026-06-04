import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import type { B2BOnboardingFeature } from '@proton/components/components/onboarding/b2b/interface';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import customDomainImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-globe.svg';
import easySwitchImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-import.svg';
import addUsersImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-profiles.svg';

export const getOrganizationMigrationFeatures = ({
    onEasySwitchClick,
}: {
    onEasySwitchClick: () => void;
}): B2BOnboardingFeature[] => [
    {
        id: 'custom-domain',
        title: c('Title').t`Connect your custom domain`,
        description: c('Description')
            .t`Configure this first to activate your organization and customize your email address.`,
        kb: {
            title: c('Link').t`How to set up a custom domain`,
            link: getKnowledgeBaseUrl('/custom-domain'),
        },
        cta: (
            <ButtonLike
                className="expand-click-area"
                shape="ghost"
                icon
                as={SettingsLink}
                path="/domain-names"
                app={APPS.PROTONMAIL}
                target="_self"
            >
                <IcChevronRight alt={c('Action').t`Set up a custom domain`} />
            </ButtonLike>
        ),
        illustration: customDomainImg,
        canShowFeature: true,
    },
    {
        id: 'add-users',
        title: c('Title').t`Add user`,
        description: c('Description').t`Set up accounts for all users and invite them to join ${BRAND_NAME}.`,
        kb: {
            title: c('Link').t`How to add users`,
            link: getKnowledgeBaseUrl('/add-users-organization'),
        },
        cta: (
            <ButtonLike
                className="expand-click-area"
                shape="ghost"
                icon
                as={SettingsLink}
                path="/users-addresses"
                app={APPS.PROTONMAIL}
                target="_self"
            >
                <IcChevronRight alt={c('Action').t`Manage users/addresses`} />
            </ButtonLike>
        ),
        illustration: addUsersImg,
        canShowFeature: true,
    },
    {
        id: 'easy-switch',
        title: c('Title').t`Import emails, calendars, contacts`,
        description: c('Description')
            .t`For a seamless onboarding of your team to ${BRAND_NAME}, import your data from Google, Outlook, and others.`,
        kb: {
            title: c('Link').t`How to migrate to ${BRAND_NAME}`,
            link: getKnowledgeBaseUrl('/easy-switch-emails'),
        },
        cta: (
            <ButtonLike className="expand-click-area" shape="ghost" icon onClick={onEasySwitchClick}>
                <IcChevronRight alt={c('Action').t`Import emails, calendars, contacts`} />
            </ButtonLike>
        ),
        illustration: easySwitchImg,
        canShowFeature: true,
    },
];

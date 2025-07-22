import { useState } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { EmailSubscriptionToggleWithHeader } from '@proton/components/containers/account/EmailSubscriptionToggles';
import {
    type EmailSubscription,
    filterNews,
    getEmailSubscriptions,
} from '@proton/components/containers/account/constants/email-subscriptions';
import { BRAND_NAME, SSO_PATHS } from '@proton/shared/lib/constants';
import type { NewsletterSubscriptionUpdateData } from '@proton/shared/lib/helpers/newsletter';
import useFlag from '@proton/unleash/useFlag';

import PublicFooter from './PublicFooter';
import PublicLayout from './PublicLayout';

interface EmailSubscriptionManagementProps {
    News: number;
    onChange: (data: NewsletterSubscriptionUpdateData) => Promise<void>;
}

const EmailSubscriptionManagement = ({ News, onChange }: EmailSubscriptionManagementProps) => {
    const [loadingMap, setLoadingMap] = useState<{ [key: string]: boolean }>({});

    const lumoInProductNewsletters = useFlag('LumoInProductNewsletters');

    const setLoadingMapDiff = (data: NewsletterSubscriptionUpdateData, value: boolean) => {
        setLoadingMap((oldValue) => ({
            ...oldValue,
            ...Object.fromEntries(Object.entries(data).map(([key]) => [key, value])),
        }));
    };

    const sharedProps = {
        News: News,
        loadingMap,
        onChange: (value: NewsletterSubscriptionUpdateData) => {
            setLoadingMapDiff(value, true);
            onChange(value).finally(() => setLoadingMapDiff(value, false));
        },
    };

    const filter = (emailSubscription: EmailSubscription) =>
        filterNews({
            emailSubscription,
            user: undefined,
            userSettings: undefined,
        });

    const { general, product } = getEmailSubscriptions(filter, lumoInProductNewsletters);

    return (
        <PublicLayout
            className="h-full"
            header={c('Email Unsubscribe').t`Email subscriptions`}
            main={
                <div>
                    <div className="text-center mb-6">
                        {c('Email Unsubscribe').t`Which emails do you want to receive from ${BRAND_NAME}?`}
                    </div>
                    <div className="flex flex-column gap-4">
                        <EmailSubscriptionToggleWithHeader
                            title={general.title}
                            subscriptions={general.toggles}
                            {...sharedProps}
                        />
                        <EmailSubscriptionToggleWithHeader
                            title={product.title}
                            subscriptions={product.toggles}
                            {...sharedProps}
                        />
                    </div>
                </div>
            }
            footer={
                <ButtonLike fullWidth as="a" href={SSO_PATHS.SWITCH} target="_self">
                    {c('Action').t`Sign in`}
                </ButtonLike>
            }
            below={<PublicFooter />}
        />
    );
};

export default EmailSubscriptionManagement;

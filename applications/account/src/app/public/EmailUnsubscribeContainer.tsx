import { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { GenericError, useApi, useErrorHandler, useNotifications } from '@proton/components';
import { getUpdateNotification } from '@proton/components/containers/account/constants/email-subscriptions';
import { getEmailSubscriptionCategories } from '@proton/components/containers/account/getEmailSubscriptionCategories';
import { authJwt } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getAuthAPI, getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getNewsExternal, patchNewsExternal } from '@proton/shared/lib/api/settings';
import { SSO_PATHS } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { getBits } from '@proton/shared/lib/helpers/bitset';
import type { NEWSLETTER_SUBSCRIPTIONS_BITS } from '@proton/shared/lib/helpers/newsletter';
import {
    type NEWSLETTER_SUBSCRIPTIONS,
    NEWSLETTER_SUBSCRIPTIONS_BY_BITS,
    type NewsletterSubscriptionUpdateData,
    getSubscriptionPatchUpdate,
    getUpdatedNewsBitmap,
} from '@proton/shared/lib/helpers/newsletter';
import type { Api } from '@proton/shared/lib/interfaces';

import EmailSubscriptionManagement from '../components/EmailSubscriptionManagement';
import { EmailUnsubscribedContainer } from '../components/EmailUnsubscribed';
import ExpiredError from './ExpiredError';

interface UserSettingsNewsResponse {
    Code: number;
    UserSettings: {
        News: number;
    };
}

enum PAGE {
    UNSUBSCRIBE,
    MANAGE,
}

enum ErrorType {
    Expired,
    API,
}

const getDiff = (subscriptionBits: NEWSLETTER_SUBSCRIPTIONS_BITS[], isEnabled = false) => {
    return subscriptionBits.reduce<Partial<Record<NEWSLETTER_SUBSCRIPTIONS, boolean>>>(
        (acc, bit) => ({ ...acc, [NEWSLETTER_SUBSCRIPTIONS_BY_BITS[bit]]: isEnabled }),
        {}
    );
};

const EmailUnsubscribeContainer = () => {
    const api = useApi();
    const silentApi = getSilentApi(api);
    const authApiRef = useRef<Api | null>(null);
    const [news, setNews] = useState<number | null>(null);
    const [page, setPage] = useState(PAGE.UNSUBSCRIBE);
    const [error, setError] = useState<{ type: ErrorType } | null>(null);
    const location = useLocation();
    const handleError = useErrorHandler();
    const { subscriptions: subscriptionsParam } = useParams<{ subscriptions: string | undefined }>();

    const subscriptions = Number(subscriptionsParam);
    const subscriptionBits = getBits(subscriptions);

    useEffect(() => {
        const init = async () => {
            const jwt = location.hash.substring(1);

            const { UID, AccessToken } = await silentApi<{ UID: string; AccessToken: string }>(authJwt({ Token: jwt }));

            const authApiFn = getAuthAPI(UID, AccessToken, silentApi);

            const {
                UserSettings: { News: currentNews },
            } = await authApiFn<UserSettingsNewsResponse>(getNewsExternal());

            setNews(currentNews);

            if (!subscriptionBits.length) {
                setPage(PAGE.MANAGE);
            }

            authApiRef.current = authApiFn;
        };

        init().catch((error) => {
            const { code } = getApiError(error);
            if (code === API_CUSTOM_ERROR_CODES.JWT_EXPIRED) {
                setError({ type: ErrorType.Expired });
            } else {
                handleError(error);
                setError({ type: ErrorType.API });
            }
        });
    }, []);

    const { createNotification } = useNotifications();

    const update = async (data: NewsletterSubscriptionUpdateData) => {
        const authApi = authApiRef.current;
        if (!authApi) {
            return;
        }

        setNews(getUpdatedNewsBitmap(news ?? 0, data));

        await authApi<{ UserSettings: { News: number } }>(patchNewsExternal(data));
        createNotification({ text: getUpdateNotification(data) });
    };

    const handleUnsubscribeClick = async () => {
        return update(getSubscriptionPatchUpdate({ currentNews: news ?? 0, diff: getDiff(subscriptionBits, false) }));
    };

    const handleResubscribeClick = async () => {
        return update(getSubscriptionPatchUpdate({ currentNews: news ?? 0, diff: getDiff(subscriptionBits, true) }));
    };

    const handleManageClick = () => {
        setPage(PAGE.MANAGE);
    };

    const handleChange = (data: NewsletterSubscriptionUpdateData) => {
        return update(data);
    };

    const categoriesValue = getEmailSubscriptionCategories(subscriptionBits);
    const categoriesJsx = (
        <span className="text-bold" key="subscription-categories">
            {categoriesValue}
        </span>
    );

    return (
        <main className="main-area h-full">
            {(() => {
                if (error) {
                    if (error.type === ErrorType.Expired) {
                        return (
                            <div className="absolute inset-center">
                                <ExpiredError type="unsubscribe" />
                            </div>
                        );
                    }
                    const signIn = (
                        <a key="1" href={SSO_PATHS.SWITCH} target="_self">
                            {c('Error message, unsubscribe').t`sign in`}
                        </a>
                    );

                    return (
                        <div className="absolute inset-center text-center">
                            <GenericError>
                                <span>{c('Error message, unsubscribe').t`There was a problem unsubscribing you.`}</span>
                                <span>{c('Error message, unsubscribe')
                                    .jt`Please ${signIn} to update your email subscription preferences.`}</span>
                            </GenericError>
                        </div>
                    );
                }
                if (news === null) {
                    return (
                        <div className="absolute inset-center text-center">
                            <CircleLoader size="large" />
                        </div>
                    );
                }
                if (page === PAGE.UNSUBSCRIBE) {
                    return (
                        <EmailUnsubscribedContainer
                            categories={categoriesJsx}
                            onUnsubscribeClick={handleUnsubscribeClick}
                            onResubscribeClick={handleResubscribeClick}
                            onManageClick={handleManageClick}
                        />
                    );
                }
                if (page === PAGE.MANAGE) {
                    return <EmailSubscriptionManagement News={news} onChange={handleChange} />;
                }
                return null;
            })()}
        </main>
    );
};

export default EmailUnsubscribeContainer;

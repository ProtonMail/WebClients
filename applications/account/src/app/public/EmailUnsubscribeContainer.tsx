import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import {
    EmailSubscriptionCategories,
    GenericError,
    useApi,
    useErrorHandler,
    useNotifications,
} from '@proton/components';
import { NewsletterSubscriptionUpdateData } from '@proton/components/containers/account/EmailSubscriptionToggles';
import { useLoading } from '@proton/hooks';
import { authJwt } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getAuthAPI, getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getNewsExternal, patchNewsExternal } from '@proton/shared/lib/api/settings';
import {
    NEWSLETTER_SUBSCRIPTIONS,
    NEWSLETTER_SUBSCRIPTIONS_BITS,
    NEWSLETTER_SUBSCRIPTIONS_BY_BITS,
    SSO_PATHS,
} from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { getBits } from '@proton/shared/lib/helpers/bitset';
import { isGlobalFeatureNewsEnabled } from '@proton/shared/lib/helpers/newsletter';
import { Api } from '@proton/shared/lib/interfaces';

import EmailResubscribed from '../components/EmailResubscribed';
import EmailSubscriptionManagement from '../components/EmailSubscriptionManagement';
import EmailUnsubscribed from '../components/EmailUnsubscribed';
import ExpiredError from './ExpiredError';

interface UserSettingsNewsResponse {
    Code: number;
    UserSettings: {
        News: number;
    };
}

enum PAGE {
    UNSUBSCRIBE,
    RESUBSCRIBE,
    MANAGE,
}

enum ErrorType {
    Expired,
    API,
}

const getUpdatedSubscription = (
    currentSubscription: number,
    subscriptionBits: NEWSLETTER_SUBSCRIPTIONS_BITS[],
    isEnabled = false
) => {
    const updates = subscriptionBits.reduce<Partial<Record<NEWSLETTER_SUBSCRIPTIONS, boolean>>>(
        (acc, bit) => ({ ...acc, [NEWSLETTER_SUBSCRIPTIONS_BY_BITS[bit]]: isEnabled }),
        {}
    );

    return {
        ...updates,
        [NEWSLETTER_SUBSCRIPTIONS.FEATURES]: isGlobalFeatureNewsEnabled(currentSubscription, updates),
    };
};

const EmailUnsubscribeContainer = () => {
    const api = useApi();
    const silentApi = getSilentApi(api);
    const [authApi, setAuthApi] = useState<Api | null>(null);
    const [news, setNews] = useState<number | null>(null);
    const [page, setPage] = useState(PAGE.UNSUBSCRIBE);
    const [error, setError] = useState<{ type: ErrorType } | null>(null);
    const [loading, withLoading] = useLoading();
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

            const result = await authApiFn<UserSettingsNewsResponse>(getNewsExternal());
            let currentNews = result.UserSettings.News;

            if (!subscriptionBits.length) {
                setPage(PAGE.MANAGE);
            } else {
                const nextNews = getUpdatedSubscription(currentNews, subscriptionBits);
                const result = await authApiFn<UserSettingsNewsResponse>(patchNewsExternal(nextNews));
                currentNews = result.UserSettings.News;
            }

            setAuthApi(() => authApiFn);

            setNews(currentNews);
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
        if (!authApi) {
            return;
        }

        const {
            UserSettings: { News },
        } = await authApi<{ UserSettings: { News: number } }>(patchNewsExternal(data));

        setNews(News);
        createNotification({ text: c('Info').t`Emailing preference saved` });
    };

    const handleResubscribeClick = async () => {
        await withLoading(update(getUpdatedSubscription(news ?? 0, subscriptionBits, true)));
        setPage(PAGE.RESUBSCRIBE);
    };

    const handleUnsubscribeClick = async () => {
        await withLoading(update(getUpdatedSubscription(news ?? 0, subscriptionBits)));
        setPage(PAGE.UNSUBSCRIBE);
    };

    const handleManageClick = () => {
        setPage(PAGE.MANAGE);
    };

    const handleChange = (data: NewsletterSubscriptionUpdateData) => {
        void withLoading(update(data));
    };

    const categoriesJsx = <EmailSubscriptionCategories key="subscription-categories" news={subscriptionBits} />;

    return (
        <main className="main-area h100">
            {(() => {
                if (error) {
                    if (error.type === ErrorType.Expired) {
                        return (
                            <div className="absolute-center">
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
                        <div className="absolute-center text-center">
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
                        <div className="absolute-center text-center">
                            <CircleLoader size="large" />
                        </div>
                    );
                }
                if (page === PAGE.UNSUBSCRIBE) {
                    return (
                        <EmailUnsubscribed
                            categories={categoriesJsx}
                            onResubscribeClick={handleResubscribeClick}
                            onManageClick={handleManageClick}
                            loading={loading}
                        />
                    );
                }
                if (page === PAGE.RESUBSCRIBE) {
                    return (
                        <EmailResubscribed
                            categories={categoriesJsx}
                            onUnsubscribeClick={handleUnsubscribeClick}
                            onManageClick={handleManageClick}
                            loading={loading}
                        />
                    );
                }
                if (page === PAGE.MANAGE) {
                    return <EmailSubscriptionManagement News={news} disabled={loading} onChange={handleChange} />;
                }
                return null;
            })()}
        </main>
    );
};

export default EmailUnsubscribeContainer;

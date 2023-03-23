import { useEffect, useState } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import {
    EmailSubscriptionCategories,
    GenericError,
    useApi,
    useErrorHandler,
    useLoading,
    useNotifications,
} from '@proton/components';
import { authJwt } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getAuthAPI, getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getNewsExternal, updateNewsExternal } from '@proton/shared/lib/api/settings';
import { NEWS } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { clearBit, getBits, setBit } from '@proton/shared/lib/helpers/bitset';
import { Api } from '@proton/shared/lib/interfaces';

import EmailResubscribed from '../components/EmailResubscribed';
import EmailSubscriptionManagement from '../components/EmailSubscriptionManagement';
import EmailUnsubscribed from '../components/EmailUnsubscribed';
import ExpiredError from './ExpiredError';

import './EmailUnsubscribeContainer.scss';

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

const EmailUnsubscribeContainer = () => {
    const api = useApi();
    const silentApi = getSilentApi(api);
    const [authApi, setAuthApi] = useState<Api | null>(null);
    const [news, setNews] = useState<number | null>(null);
    const [page, setPage] = useState(PAGE.UNSUBSCRIBE);
    const [error, setError] = useState<{ type: ErrorType } | null>(null);
    const [loading, withLoading] = useLoading();
    const history = useHistory();
    const location = useLocation();
    const handleError = useErrorHandler();
    const { subscriptions: subscriptionsParam } = useParams<{ subscriptions: string | undefined }>();

    const subscriptions = Number(subscriptionsParam);
    const subscriptionBits = getBits(subscriptions) as NEWS[];

    useEffect(() => {
        const init = async () => {
            const jwt = location.hash.substring(1);

            history.replace(location.pathname);

            const { UID, AccessToken } = await silentApi<{ UID: string; AccessToken: string }>(authJwt({ Token: jwt }));

            const authApiFn = getAuthAPI(UID, AccessToken, silentApi);

            const result = await authApiFn<UserSettingsNewsResponse>(getNewsExternal());
            let currentNews = result.UserSettings.News;

            if (!subscriptionBits.length) {
                setPage(PAGE.MANAGE);
            } else {
                const nextNews = subscriptionBits.reduce(clearBit, currentNews);
                const result = await authApiFn<UserSettingsNewsResponse>(updateNewsExternal(nextNews));
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

    const update = async (news: number) => {
        if (!authApi) {
            return;
        }

        const {
            UserSettings: { News },
        } = await authApi<{ UserSettings: { News: number } }>(updateNewsExternal(news));

        setNews(News);
        createNotification({ text: c('Info').t`Emailing preference saved` });
    };

    const handleResubscribeClick = async () => {
        await withLoading(update(subscriptionBits.reduce(setBit, news || 0)));
        setPage(PAGE.RESUBSCRIBE);
    };

    const handleUnsubscribeClick = async () => {
        await withLoading(update(subscriptionBits.reduce(clearBit, news || 0)));
        setPage(PAGE.UNSUBSCRIBE);
    };

    const handleManageClick = () => {
        setPage(PAGE.MANAGE);
    };

    const handleChange = (news: number) => {
        void withLoading(update(news));
    };

    const categoriesJsx = <EmailSubscriptionCategories news={subscriptionBits} />;

    return (
        <main className="main-area email-unsubscribe-container--main">
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
                        <a key="1" href="/login" target="_self">
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

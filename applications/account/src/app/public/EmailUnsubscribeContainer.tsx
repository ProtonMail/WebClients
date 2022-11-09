import { useEffect, useState } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { EmailSubscriptionCategories, GenericError, useApi, useLoading, useNotifications } from '@proton/components';
import { authJwt } from '@proton/shared/lib/api/auth';
import { getNewsExternal, updateNewsExternal } from '@proton/shared/lib/api/settings';
import { NEWS } from '@proton/shared/lib/constants';
import { withAuthHeaders } from '@proton/shared/lib/fetch/headers';
import { clearBit, getBits, setBit } from '@proton/shared/lib/helpers/bitset';
import { Api } from '@proton/shared/lib/interfaces';

import EmailResubscribed from '../components/EmailResubscribed';
import EmailSubscriptionManagement from '../components/EmailSubscriptionManagement';
import EmailUnsubscribed from '../components/EmailUnsubscribed';

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

const EmailUnsubscribeContainer = () => {
    const api = useApi();
    const [authApi, setAuthApi] = useState<Api | null>(null);
    const [news, setNews] = useState<number | null>(null);
    const [page, setPage] = useState(PAGE.UNSUBSCRIBE);
    const [error, setError] = useState(null);
    const [loading, withLoading] = useLoading();
    const history = useHistory();
    const location = useLocation();
    const { subscriptions: subscriptionsParam } = useParams<{ subscriptions: string | undefined }>();

    const subscriptions = Number(subscriptionsParam);
    const subscriptionBits = getBits(subscriptions) as NEWS[];

    useEffect(() => {
        const init = async () => {
            const jwt = location.hash.substring(1);

            history.replace(location.pathname);

            const { UID, AccessToken } = await api<{ UID: string; AccessToken: string }>(authJwt({ Token: jwt }));

            const authApiFn: Api = (config: object) =>
                api(withAuthHeaders(UID, AccessToken, { ...config, headers: {} }));

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

        init().catch(setError);
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

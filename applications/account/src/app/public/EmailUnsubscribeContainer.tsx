import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useHistory } from 'react-router-dom';
import { c } from 'ttag';
import { FullLoader, GenericError, useApi, useLoading, useNotifications } from 'react-components';
import { authJwt } from 'proton-shared/lib/api/auth';
import { getNewsExternal, updateNewsExternal } from 'proton-shared/lib/api/settings';
import { withAuthHeaders } from 'proton-shared/lib/fetch/headers';
import { Api } from 'proton-shared/lib/interfaces';
import { NEWS } from 'proton-shared/lib/constants';
import { clearBit, getBits, setBit } from 'proton-shared/lib/helpers/bitset';

import EmailUnsubscribed from '../components/EmailUnsubscribed';
import EmailResubscribed from '../components/EmailResubscribed';
import EmailSubscriptionManagement from '../components/EmailSubscriptionManagement';
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

    const newsTypeToWording = {
        [NEWS.ANNOUNCEMENTS]: c('Label for news').t`Proton announcements`,
        [NEWS.FEATURES]: c('Label for news').t`Proton major features`,
        [NEWS.BUSINESS]: c('Label for news').t`Proton for business`,
        [NEWS.NEWSLETTER]: c('Label for news').t`Proton newsletter`,
        [NEWS.BETA]: c('Label for news').t`Proton Beta`,
    };

    const categories = subscriptionBits.map((bit) => newsTypeToWording[bit]);

    useEffect(() => {
        const init = async () => {
            const jwt = location.hash.substring(1);

            history.replace(location.pathname);

            const { UID, AccessToken } = await api<{ UID: string; AccessToken: string }>(authJwt({ Token: jwt }));

            const authApiFn: Api = (config: object) =>
                api(withAuthHeaders(UID, AccessToken, { ...config, headers: {} }));

            const {
                UserSettings: { News: currentNews },
            } = await authApiFn<UserSettingsNewsResponse>(getNewsExternal());

            const nextNews = subscriptionBits.reduce(clearBit, currentNews);

            const {
                UserSettings: { News: updatedNews },
            } = await authApiFn<UserSettingsNewsResponse>(updateNewsExternal(nextNews));

            /*
             * https://reactjs.org/docs/faq-state.html#what-is-the-difference-between-passing-an-object-or-a-function-in-setstate
             *
             * we want to store the 'authApiFn' here, not tell react to use the function to generate the next state
             */
            setAuthApi(() => authApiFn);

            setNews(updatedNews);
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
        withLoading(update(news));
    };

    const renderView = () => {
        if (news === null) {
            return (
                <div className="centered-absolute text-center">
                    <FullLoader size={200} />
                </div>
            );
        }

        switch (page) {
            case PAGE.UNSUBSCRIBE: {
                return (
                    <EmailUnsubscribed
                        categories={categories}
                        onResubscribeClick={handleResubscribeClick}
                        onManageClick={handleManageClick}
                        loading={loading}
                    />
                );
            }

            case PAGE.RESUBSCRIBE: {
                return (
                    <EmailResubscribed
                        categories={categories}
                        onUnsubscribeClick={handleUnsubscribeClick}
                        onManageClick={handleManageClick}
                        loading={loading}
                    />
                );
            }

            case PAGE.MANAGE: {
                return <EmailSubscriptionManagement News={news} disabled={loading} onChange={handleChange} />;
            }

            default:
                return null;
        }
    };

    if (error) {
        const signIn = (
            <a key="1" href="/login" target="_self">
                {c('Action').t`sign in`}
            </a>
        );

        return (
            <GenericError>
                <span>{c('Error message').t`There was a problem unsubscribing you.`}</span>
                <span>{c('Error message').jt`Please ${signIn} to update your email subscription preferences.`}</span>
            </GenericError>
        );
    }

    return <main className="main-area ui-standard email-unsubscribe-container--main">{renderView()}</main>;
};

export default EmailUnsubscribeContainer;

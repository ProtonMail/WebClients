import { useEffect } from 'react';
import { Route, Switch } from 'react-router-dom';

import { UnAuthenticated } from '@proton/components';
import createSecureSessionStorage from '@proton/shared/lib/authentication/createSecureSessionStorage';

import { useMailDispatch } from 'proton-mail/store/hooks';

import ViewEOMessage from '../../components/eo/message/ViewEOMessage';
import EOReply from '../../components/eo/reply/EOReply';
import EOUnlock from '../../components/eo/unlock/EOUnlock';
import { EO_MESSAGE_REDIRECT_PATH, EO_REDIRECT_PATH, EO_REPLY_REDIRECT_PATH } from '../../constants';
import { init } from '../../store/eo/eoActions';

const { set, get } = createSecureSessionStorage();

const PageContainer = () => {
    const dispatch = useMailDispatch();

    useEffect(() => {
        const initStore = async () => {
            await dispatch(init({ get }));
        };

        void initStore();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-FD7908
    }, []);

    return (
        <UnAuthenticated>
            <Switch>
                <Route path={`${EO_MESSAGE_REDIRECT_PATH}/:id?`}>
                    <ViewEOMessage setSessionStorage={set} />
                </Route>
                <Route path={`${EO_REPLY_REDIRECT_PATH}/:id?`}>
                    <EOReply setSessionStorage={set} />
                </Route>
                <Route path={`${EO_REDIRECT_PATH}/:id?`}>
                    <EOUnlock setSessionStorage={set} />
                </Route>
                <Route path="*">
                    <EOUnlock setSessionStorage={set} />
                </Route>
            </Switch>
        </UnAuthenticated>
    );
};

export default PageContainer;

import { useEffect } from 'react';
import { Route, Switch } from 'react-router-dom';

import { UnAuthenticated } from '@proton/components';
import createSecureSessionStorage from '@proton/shared/lib/authentication/createSecureSessionStorage';

import ViewEOMessage from '../../components/eo/message/ViewEOMessage';
import EOReply from '../../components/eo/reply/EOReply';
import EOUnlock from '../../components/eo/unlock/EOUnlock';
import { EO_MESSAGE_REDIRECT_PATH, EO_REDIRECT_PATH, EO_REPLY_REDIRECT_PATH } from '../../constants';
import { init } from '../../logic/eo/eoActions';
import { useAppDispatch } from '../../logic/store';

const { set, get } = createSecureSessionStorage();

const PageContainer = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        const initStore = async () => {
            await dispatch(init({ get }));
        };

        void initStore();
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

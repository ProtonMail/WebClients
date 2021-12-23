import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Route, Switch } from 'react-router-dom';

import createSecureSessionStorage from '@proton/shared/lib/authentication/createSecureSessionStorage';

import ViewMessage from '../../components/eo/message/ViewMessage';
import Reply from '../../components/eo/reply/Reply';
import Unlock from '../../components/eo/unlock/Unlock';
import { init } from '../../logic/eo/eoActions';
import { EO_MESSAGE_REDIRECT_PATH, EO_REDIRECT_PATH, EO_REPLY_REDIRECT_PATH } from '../../constants';

const PageContainer = () => {
    const { set, get } = createSecureSessionStorage();
    const dispatch = useDispatch();

    useEffect(() => {
        const initStore = async () => {
            await dispatch(init({ get }));
        };

        void initStore();
    }, []);

    return (
        <Switch>
            <Route path={`${EO_MESSAGE_REDIRECT_PATH}/:id?`}>
                <ViewMessage setSessionStorage={set} />
            </Route>
            <Route path={`${EO_REPLY_REDIRECT_PATH}/:id?`}>
                <Reply setSessionStorage={set} />
            </Route>
            <Route path={`${EO_REDIRECT_PATH}/:id?`}>
                <Unlock setSessionStorage={set} />
            </Route>
            <Route path="*">
                <Unlock setSessionStorage={set} />
            </Route>
        </Switch>
    );
};

export default PageContainer;

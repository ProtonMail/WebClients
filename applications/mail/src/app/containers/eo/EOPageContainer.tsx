import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Route, Switch } from 'react-router-dom';

import createSecureSessionStorage from '@proton/shared/lib/authentication/createSecureSessionStorage';

import ViewMessage from '../../components/eo/message/ViewMessage';
import Reply from '../../components/eo/Reply';
import Unlock from '../../components/eo/Unlock';
import { init } from '../../logic/eo/eoActions';

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
            <Route path="/eo/message/:id?">
                <ViewMessage />
            </Route>
            <Route path="/eo/reply/:id?">
                <Reply />
            </Route>
            <Route path="/eo/:id?">
                <Unlock setSessionStorage={set} />
            </Route>
            <Route path="*">
                <Unlock setSessionStorage={set} />
            </Route>
        </Switch>
    );
};

export default PageContainer;

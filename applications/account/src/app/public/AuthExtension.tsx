import { useLocation } from 'react-router-dom';

import { getExtension } from '@proton/shared/lib/apps/helper';
import { Extension } from '@proton/shared/lib/authentication/ForkInterface';
import { APPS } from '@proton/shared/lib/constants';

import VpnBrowserExtension from '../containers/vpn/VpnBrowserExtension';
import Content from './Content';
import Header from './Header';
import Layout from './Layout';
import Main from './Main';
import Text from './Text';

interface State {
    type: 'success' | 'error';
    extension: Extension | undefined;
    payload?: string;
}

const defaultState: State = {
    type: 'success',
    payload: '',
    extension: undefined,
};

const AuthExtension = () => {
    const location = useLocation<State | undefined>();
    const state = location.state || defaultState;
    const children =
        getExtension(APPS.PROTONVPNBROWSEREXTENSION) === state.extension ? (
            <Main>
                <VpnBrowserExtension error={state.type === 'error' ? state.payload : undefined} />
            </Main>
        ) : (
            <Main>
                <Header title="Extension" />
                <Content>
                    <Text>{state.type}</Text>
                    <Text>{state.payload}</Text>
                </Content>
            </Main>
        );
    return <Layout hasDecoration={false}>{children}</Layout>;
};

export default AuthExtension;

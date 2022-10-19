import { useLocation } from 'react-router-dom';

import Content from './Content';
import Header from './Header';
import Layout from './Layout';
import Main from './Main';
import Text from './Text';

const AuthExtension = () => {
    const location = useLocation<{ type: 'success' | 'error'; payload?: string }>();
    const children = (
        <Main>
            <Header title="Extension" />
            <Content>
                <Text>{location.state.type}</Text>
                <Text>{location.state.payload}</Text>
            </Content>
        </Main>
    );
    return <Layout hasDecoration={false}>{children}</Layout>;
};

export default AuthExtension;

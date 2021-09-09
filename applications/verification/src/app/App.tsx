import { ModalsChildren, ProtonApp } from '@proton/components';

import * as config from './config';
import './app.scss';
import Verification from './Verification';

const enhancedConfig = {
    APP_VERSION_DISPLAY: '4.0.0',
    ...config,
};

const App = () => {
    return (
        <ProtonApp config={enhancedConfig}>
            <Verification />
            <ModalsChildren />
        </ProtonApp>
    );
};

export default App;

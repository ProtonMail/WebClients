import { ProtonApp } from '@proton/components';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';

import * as config from './config';
import { ProtonMeetContainer } from './containers/ProtonMeetContainer';
import { ProviderContainer } from './containers/ProviderContainer';

export const App = () => {
    return (
        <ProtonApp config={config as ProtonConfig}>
            <ProviderContainer>
                <ProtonMeetContainer />
            </ProviderContainer>
        </ProtonApp>
    );
};

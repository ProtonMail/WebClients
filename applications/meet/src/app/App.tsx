import { ProtonApp } from '@proton/components';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';

import * as config from './config';
import { ProtonMeetContainer } from './containers/ProtonMeetContainer';
import { ProviderContainer } from './containers/ProviderContainer';

// @ts-ignore
import meetTheme from './styles/meet.theme.css';

export const App = () => {
    return (
        <ProtonApp config={config as ProtonConfig}>
            <style id="meet-dark-theme">{meetTheme.toString()}</style>
            <ProviderContainer>
                <ProtonMeetContainer />
            </ProviderContainer>
        </ProtonApp>
    );
};

import type { FC } from 'react';
import { HashRouter, Route } from 'react-router-dom';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';

import { SettingsTabs } from './SettingsTabs';

type Props = { ready: boolean };

export const SettingsRouter: FC<Props> = ({ ready }) =>
    ready ? (
        <HashRouter>
            <Route render={({ location }) => <SettingsTabs pathname={location.pathname} />} />
        </HashRouter>
    ) : (
        <div className="flex flex-column items-center justify-center my-auto">
            <CircleLoader />
        </div>
    );

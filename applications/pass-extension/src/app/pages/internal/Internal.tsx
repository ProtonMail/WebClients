import type { FC } from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';

import { Localized } from '@proton/pass/components/Core/Localized';

import { AutoClose } from './Views/AutoClose';
import { File } from './Views/File';
import { Logs } from './Views/Logs';

import './Internal.scss';

export const Internal: FC = () => (
    <div
        className="pass-internal flex flex-column ui-standard w-full mx-auto bg-weak min-h-custom anime-fade-in"
        style={{ '--min-h-custom': '100vh', '--anime-delay': '0.35s' }}
    >
        <Localized>
            <HashRouter>
                <Switch>
                    <Route exact path="/logs" component={Logs} />
                    <Route exact path="/file/:file" component={File} />
                    <Route component={AutoClose} />
                </Switch>
            </HashRouter>
        </Localized>
    </div>
);

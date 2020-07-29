import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { MinimalLoginContainer, StandardPublicApp } from 'react-components';
import { openpgpConfig } from './openpgpConfig';

interface Props {
    onLogin: (config: any) => void;
}

const PublicApp = ({ onLogin }: Props) => {
    return (
        <StandardPublicApp openpgpConfig={openpgpConfig}>
            <Switch>
                <Route render={() => <MinimalLoginContainer onLogin={onLogin} />} />
            </Switch>
        </StandardPublicApp>
    );
};

export default PublicApp;

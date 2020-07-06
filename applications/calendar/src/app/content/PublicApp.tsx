import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { StandardPublicApp, MinimalLoginContainer } from 'react-components';
import locales from '../locales';

interface Props {
    onLogin: () => void;
}
const PublicApp = ({ onLogin }: Props) => {
    return (
        <StandardPublicApp locales={locales}>
            <Switch>
                <Route render={() => <MinimalLoginContainer onLogin={onLogin} />} />
            </Switch>
        </StandardPublicApp>
    );
};

export default PublicApp;

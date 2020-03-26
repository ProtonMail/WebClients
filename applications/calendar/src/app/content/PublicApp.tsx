import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { StandardPublicApp, LoginForm } from 'react-components';
import locales from '../locales';

interface Props {
    onLogin: () => void;
}
const PublicApp = ({ onLogin }: Props) => {
    return (
        <StandardPublicApp locales={locales}>
            <Switch>
                <Route render={() => <LoginForm onLogin={onLogin} />} />
            </Switch>
        </StandardPublicApp>
    );
};

export default PublicApp;

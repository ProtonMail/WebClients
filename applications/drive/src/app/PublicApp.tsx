import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { MinimalLoginContainer, StandardPublicApp } from 'react-components';
import PublicLayout from './components/layout/PublicLayout';
import { openpgpConfig } from './openpgpConfig';

interface Props {
    onLogin: (config: any) => void;
}

const PublicApp = ({ onLogin }: Props) => {
    return (
        <StandardPublicApp openpgpConfig={openpgpConfig}>
            <PublicLayout>
                <Router>
                    <Switch>
                        <Route render={() => <MinimalLoginContainer onLogin={onLogin} />} />
                    </Switch>
                </Router>
            </PublicLayout>
        </StandardPublicApp>
    );
};

export default PublicApp;

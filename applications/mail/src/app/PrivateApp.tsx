import React from 'react';
import { RouteChildrenProps } from 'react-router';
import { Route } from 'react-router-dom';
import { StandardPrivateApp } from 'react-components';

import {
    UserModel,
    MailSettingsModel,
    UserSettingsModel,
    SubscriptionModel,
    OrganizationModel,
    LabelsModel,
    AddressesModel,
    ConversationCountsModel,
    MessageCountsModel
} from 'proton-shared/lib/models';

import locales from './locales';
import PageContainer from './containers/PageContainer';
import MessageProvider from './containers/MessageProvider';
import ComposerContainer from './containers/ComposerContainer';

export type RouteProps = RouteChildrenProps<{ labelID: string; elementID?: string }>;

interface Props {
    onLogout: () => void;
}

const PrivateApp = ({ onLogout }: Props) => {
    return (
        <StandardPrivateApp
            onLogout={onLogout}
            locales={locales}
            preloadModels={[UserModel, UserSettingsModel]}
            eventModels={[
                UserModel,
                AddressesModel,
                ConversationCountsModel,
                MessageCountsModel,
                MailSettingsModel,
                UserSettingsModel,
                LabelsModel,
                SubscriptionModel,
                OrganizationModel
            ]}
        >
            <MessageProvider>
                <ComposerContainer>
                    {({ onCompose }) => (
                        <Route
                            path="/:labelID/:elementID?"
                            render={(routeProps: RouteProps) => <PageContainer {...routeProps} onCompose={onCompose} />}
                        />
                    )}
                </ComposerContainer>
            </MessageProvider>
        </StandardPrivateApp>
    );
};

export default PrivateApp;

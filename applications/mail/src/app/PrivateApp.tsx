import React from 'react';
import { RouteChildrenProps } from 'react-router';
import { Route } from 'react-router-dom';
import { StandardPrivateApp, useActiveBreakpoint } from 'react-components';

import {
    UserModel,
    MailSettingsModel,
    UserSettingsModel,
    SubscriptionModel,
    OrganizationModel,
    LabelsModel,
    AddressesModel,
    ConversationCountsModel,
    MessageCountsModel,
    ContactsModel,
    ContactEmailsModel
} from 'proton-shared/lib/models';

import locales from './locales';
import PageContainer from './containers/PageContainer';
import ComposerContainer from './containers/ComposerContainer';
import MessageProvider from './containers/MessageProvider';
import ConversationProvider from './containers/ConversationProvider';
import AttachmentProvider from './containers/AttachmentProvider';

export type RouteProps = RouteChildrenProps<{ labelID: string; elementID?: string }>;

interface Props {
    throughLogin: boolean;
    onLogout: () => void;
}

const PrivateApp = ({ throughLogin, onLogout }: Props) => {
    const breakpoints = useActiveBreakpoint();

    return (
        <StandardPrivateApp
            fallback={false}
            openpgpConfig={{}}
            onLogout={onLogout}
            locales={locales}
            preloadModels={[UserModel, UserSettingsModel, LabelsModel, AddressesModel, MailSettingsModel]}
            eventModels={[
                UserModel,
                AddressesModel,
                ConversationCountsModel,
                MessageCountsModel,
                MailSettingsModel,
                UserSettingsModel,
                LabelsModel,
                SubscriptionModel,
                OrganizationModel,
                ContactsModel,
                ContactEmailsModel
            ]}
        >
            <MessageProvider>
                <ConversationProvider>
                    <AttachmentProvider>
                        <ComposerContainer breakpoints={breakpoints}>
                            {({ onCompose }) => (
                                <Route
                                    path="/:labelID?/:elementID?"
                                    render={(routeProps: RouteProps) => (
                                        <PageContainer
                                            {...routeProps}
                                            breakpoints={breakpoints}
                                            onCompose={onCompose}
                                            throughLogin={throughLogin}
                                        />
                                    )}
                                />
                            )}
                        </ComposerContainer>
                    </AttachmentProvider>
                </ConversationProvider>
            </MessageProvider>
        </StandardPrivateApp>
    );
};

export default PrivateApp;

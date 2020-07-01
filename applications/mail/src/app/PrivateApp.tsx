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
import { Model } from 'proton-shared/lib/interfaces/Model';

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
            preloadModels={[
                UserModel,
                UserSettingsModel as Model<any>,
                LabelsModel,
                AddressesModel,
                MailSettingsModel as Model<any>,
                MessageCountsModel as Model<any>,
                ConversationCountsModel as Model<any>
            ]}
            eventModels={[
                UserModel,
                AddressesModel,
                ConversationCountsModel as Model<any>,
                MessageCountsModel as Model<any>,
                MailSettingsModel as Model<any>,
                UserSettingsModel as Model<any>,
                LabelsModel,
                SubscriptionModel,
                OrganizationModel as Model<any>,
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

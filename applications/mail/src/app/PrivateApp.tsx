import React from 'react';
import { RouteChildrenProps } from 'react-router';
import { Route } from 'react-router-dom';
import { StandardPrivateApp, useActiveBreakpoint } from 'react-components';
import { TtagLocaleMap } from 'proton-shared/lib/interfaces/Locale';

import { Model } from 'proton-shared/lib/interfaces/Model';
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

import PageContainer from './containers/PageContainer';
import ComposerContainer from './containers/ComposerContainer';
import MessageProvider from './containers/MessageProvider';
import ConversationProvider from './containers/ConversationProvider';
import AttachmentProvider from './containers/AttachmentProvider';

export type RouteProps = RouteChildrenProps<{ labelID: string; elementID?: string; messageID?: string }>;

interface Props {
    onLogout: () => void;
    locales: TtagLocaleMap;
}

const PrivateApp = ({ onLogout, locales }: Props) => {
    const breakpoints = useActiveBreakpoint();

    return (
        <StandardPrivateApp
            fallback={false}
            openpgpConfig={{}}
            onLogout={onLogout}
            locales={locales}
            preloadModels={[
                UserModel,
                UserSettingsModel,
                LabelsModel,
                AddressesModel,
                MailSettingsModel,
                MessageCountsModel as Model<any>,
                ConversationCountsModel as Model<any>
            ]}
            eventModels={[
                UserModel,
                AddressesModel,
                ConversationCountsModel as Model<any>,
                MessageCountsModel as Model<any>,
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
                                    path="/:labelID?/:elementID?/:messageID?"
                                    render={(routeProps: RouteProps) => (
                                        <PageContainer
                                            {...routeProps}
                                            breakpoints={breakpoints}
                                            onCompose={onCompose}
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

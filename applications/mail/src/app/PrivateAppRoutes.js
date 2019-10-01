import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { ErrorBoundary } from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';

import PrivateLayout from './components/layout/PrivateLayout';
import MailboxContainer from './containers/MailboxContainer';

const LABEL_IDS = {
    inbox: MAILBOX_LABEL_IDS.INBOX,
    'all-drafts': MAILBOX_LABEL_IDS.ALL_DRAFTS,
    'all-sent': MAILBOX_LABEL_IDS.ALL_SENT,
    trash: MAILBOX_LABEL_IDS.TRASH,
    spam: MAILBOX_LABEL_IDS.SPAM,
    'all-mail': MAILBOX_LABEL_IDS.ALL_MAIL,
    archive: MAILBOX_LABEL_IDS.ARCHIVE,
    sent: MAILBOX_LABEL_IDS.SENT,
    drafts: MAILBOX_LABEL_IDS.DRAFTS,
    starred: MAILBOX_LABEL_IDS.STARRED
};

const PrivateAppRoutes = () => {
    return (
        <Switch>
            <Route
                path="/:labelID/:elementID?"
                render={({ match, location, history }) => {
                    const { elementID, labelID: currentLabelID } = match.params;
                    const labelID = LABEL_IDS[currentLabelID] || currentLabelID;

                    return (
                        <PrivateLayout labelID={labelID}>
                            <ErrorBoundary key={location.pathname}>
                                <MailboxContainer
                                    labelID={labelID}
                                    elementID={elementID}
                                    location={location}
                                    history={history}
                                />
                            </ErrorBoundary>
                        </PrivateLayout>
                    );
                }}
            />
        </Switch>
    );
};

export default PrivateAppRoutes;

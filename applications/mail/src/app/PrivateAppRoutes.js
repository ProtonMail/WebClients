import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { ErrorBoundary } from 'react-components';

import PrivateLayout from './components/layout/PrivateLayout';
import MailboxContainer from './containers/MailboxContainer';
import { HUMAN_TO_LABEL_IDS } from './constants';

const PrivateAppRoutes = () => {
    return (
        <Switch>
            <Route
                path="/:labelID/:elementID?"
                render={({ match, location, history }) => {
                    const { elementID, labelID: currentLabelID } = match.params;
                    const labelID = HUMAN_TO_LABEL_IDS[currentLabelID] || currentLabelID;
                    return (
                        <PrivateLayout labelID={labelID} location={location} history={history}>
                            <ErrorBoundary>
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

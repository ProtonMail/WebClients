import React from 'react';
import { match } from 'react-router';
import { Location, History } from 'history';
import { ErrorBoundary, useMailSettings, Loader } from 'react-components';

import PrivateLayout from '../components/layout/PrivateLayout';
import MailboxContainer from './MailboxContainer';
import { HUMAN_TO_LABEL_IDS } from '../constants';

interface Props {
    match: match<{ elementID?: string; labelID: string }>;
    location: Location;
    history: History;
}

const PageContainer = ({ match, location, history }: Props) => {
    const [mailSettings, loadingMailSettings] = useMailSettings();

    const { elementID, labelID: currentLabelID } = match.params;
    const labelID = HUMAN_TO_LABEL_IDS[currentLabelID] || currentLabelID;

    return (
        <PrivateLayout labelID={labelID} location={location} history={history}>
            <ErrorBoundary>
                {loadingMailSettings ? (
                    <Loader />
                ) : (
                    <MailboxContainer
                        labelID={labelID}
                        mailSettings={mailSettings}
                        elementID={elementID}
                        location={location}
                        history={history}
                    />
                )}
            </ErrorBoundary>
        </PrivateLayout>
    );
};

export default PageContainer;

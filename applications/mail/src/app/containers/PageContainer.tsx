import React from 'react';
import { Redirect } from 'react-router-dom';
import { ErrorBoundary, useMailSettings, useUserSettings, useLabels, useFolders } from 'react-components';
import { Label } from 'proton-shared/lib/interfaces/Label';
import { MailSettings, UserSettings } from 'proton-shared/lib/interfaces';

import PrivateLayout from '../components/layout/PrivateLayout';
import MailboxContainer from './MailboxContainer';
import { HUMAN_TO_LABEL_IDS } from '../constants';
import { RouteProps } from '../PrivateApp';
import { Breakpoints } from '../models/utils';
import { useLinkHandler } from '../hooks/useLinkHandler';
import { OnCompose } from '../hooks/useCompose';

interface Props extends RouteProps {
    breakpoints: Breakpoints;
    onCompose: OnCompose;
}

const PageContainer = ({ match, location, history, breakpoints, onCompose }: Props) => {
    const [mailSettings] = useMailSettings() as [MailSettings, boolean, Error];
    const [userSettings] = useUserSettings() as [UserSettings, boolean, Error];
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();
    const labelIDs = [...labels, ...folders].map(({ ID }: Label) => ID);
    const { elementID, labelID: currentLabelID = '', messageID } = (match || {}).params || {};
    const labelID = HUMAN_TO_LABEL_IDS[currentLabelID] || (labelIDs.includes(currentLabelID) && currentLabelID);

    useLinkHandler(onCompose);

    if (!labelID) {
        return <Redirect to="/inbox" />;
    }

    return (
        <PrivateLayout
            labelID={labelID}
            elementID={elementID}
            location={location}
            history={history}
            breakpoints={breakpoints}
            onCompose={onCompose}
        >
            <ErrorBoundary>
                <MailboxContainer
                    labelID={labelID}
                    userSettings={userSettings}
                    mailSettings={mailSettings}
                    breakpoints={breakpoints}
                    elementID={elementID}
                    messageID={messageID}
                    location={location}
                    history={history}
                    onCompose={onCompose}
                />
            </ErrorBoundary>
        </PrivateLayout>
    );
};

export default PageContainer;

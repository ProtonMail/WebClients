import React, { useLayoutEffect } from 'react';
import { Redirect } from 'react-router-dom';
import {
    ErrorBoundary,
    useMailSettings,
    useUserSettings,
    Loader,
    useEventManager,
    useLabels,
    useFolders
} from 'react-components';
import { Label } from 'proton-shared/lib/interfaces/Label';

import PrivateLayout from '../components/layout/PrivateLayout';
import MailboxContainer from './MailboxContainer';
import { HUMAN_TO_LABEL_IDS } from '../constants';
import { RouteProps } from '../PrivateApp';
import { Event } from '../models/event';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { setPathInUrl } from '../helpers/mailboxUrl';
import { Breakpoints } from '../models/utils';
import { useLinkHandler } from '../hooks/useLinkHandler';
import { OnCompose } from '../hooks/useCompose';

interface Props extends RouteProps {
    breakpoints: Breakpoints;
    onCompose: OnCompose;
}

const PageContainer = ({ match, location, history, breakpoints, onCompose }: Props) => {
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const [userSettings, loadingUserSettings] = useUserSettings();
    const { subscribe } = useEventManager();
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();
    const labelIDs = [...labels, ...folders].map(({ ID }: Label) => ID);
    const { elementID, labelID: currentLabelID = '' } = (match || {}).params || {};
    const labelID = HUMAN_TO_LABEL_IDS[currentLabelID] || (labelIDs.includes(currentLabelID) && currentLabelID);

    useLinkHandler(onCompose);

    // Detect if the element in URL has been deleted and come back to the label if so
    useLayoutEffect(
        () =>
            subscribe(({ Messages }: Event) => {
                const match = Messages?.find(({ ID, Action }) => Action === EVENT_ACTIONS.DELETE && ID === elementID);

                if (match) {
                    history.push(setPathInUrl(location, labelID));
                }
            }),
        [elementID]
    );

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
                {loadingMailSettings || loadingUserSettings ? (
                    <Loader />
                ) : (
                    <MailboxContainer
                        labelID={labelID}
                        userSettings={userSettings}
                        mailSettings={mailSettings}
                        breakpoints={breakpoints}
                        elementID={elementID}
                        location={location}
                        history={history}
                        onCompose={onCompose}
                    />
                )}
            </ErrorBoundary>
        </PrivateLayout>
    );
};

export default PageContainer;

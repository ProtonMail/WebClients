import React, { useLayoutEffect } from 'react';
import { ErrorBoundary, useMailSettings, Loader, useEventManager } from 'react-components';

import PrivateLayout from '../components/layout/PrivateLayout';
import MailboxContainer from './MailboxContainer';
import { HUMAN_TO_LABEL_IDS } from '../constants';
import { OnCompose } from './ComposerContainer';
import { RouteProps } from '../PrivateApp';
import { Event } from '../models/event';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { setPathInUrl } from '../helpers/mailboxUrl';

interface Props extends RouteProps {
    onCompose: OnCompose;
}

const PageContainer = ({ match, location, history, onCompose }: Props) => {
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const { subscribe } = useEventManager();

    const { elementID, labelID: currentLabelID = '' } = (match || {}).params || {};
    const labelID = HUMAN_TO_LABEL_IDS[currentLabelID] || currentLabelID;

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

    return (
        <PrivateLayout labelID={labelID} location={location} history={history} onCompose={onCompose}>
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
                        onCompose={onCompose}
                    />
                )}
            </ErrorBoundary>
        </PrivateLayout>
    );
};

export default PageContainer;

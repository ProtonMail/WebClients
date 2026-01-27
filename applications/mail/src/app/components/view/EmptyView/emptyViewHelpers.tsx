import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { CUSTOM_VIEWS_LABELS } from '@proton/shared/lib/mail/constants';

export const getEmptyViewTitle = ({
    isSearch,
    isFolder,
    isScheduled,
    labelID,
    isTaskRunningInLabel,
}: {
    isSearch: boolean;
    isFolder: boolean;
    isScheduled: boolean;
    labelID: string;
    isTaskRunningInLabel: boolean;
}) => {
    if (labelID === CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS) {
        return c('Info').t`No messages to show`;
    }

    if (isSearch) {
        return c('Search - no results').t`No results found`;
    }

    if (isTaskRunningInLabel) {
        // TODO check text
        return c('Search - no results').t`An action is being processed`;
    }

    if (isFolder) {
        return c('Search - no results').t`No messages found`;
    }

    if (isScheduled) {
        return c('Search - no results').t`No messages scheduled`;
    }

    return c('Search - no results').t`No messages found`;
};

export const getEmptyViewDescription = ({
    isSearch,
    isEncryptedSearchEnabled,
    isFolder,
    isScheduled,
    labelID,
    scheduleButtonOnClick,
    isTaskRunningInLabel,
}: {
    isSearch: boolean;
    isEncryptedSearchEnabled: boolean;
    isFolder: boolean;
    isScheduled: boolean;
    labelID: string;
    scheduleButtonOnClick: () => void;
    isTaskRunningInLabel: boolean;
}) => {
    if (labelID === CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS) {
        return c('Info').t`There are no messages from this sender in your inbox.`;
    }

    if (isSearch) {
        if (isEncryptedSearchEnabled) {
            return c('Info').t`You can either update your search query or clear it`;
        }

        return (
            <>
                {c('Info')
                    .t`For more search results, try searching for this keyword in the content of your email messages.`}
                <br />
                <Href href={getKnowledgeBaseUrl('/search-message-content')}>{c('Info').t`Learn more`}</Href>
            </>
        );
    }

    // TODO check text
    if (isTaskRunningInLabel) {
        return c('Info').t`Please wait for the action to be completed`;
    }

    if (isFolder) {
        return c('Info').t`You do not have any messages here`;
    }

    if (isScheduled) {
        return (
            <Button
                data-testid="empty-view-placeholder--create-message-button"
                title={c('Action').t`Create new message`}
                onClick={scheduleButtonOnClick}
            >
                {c('Action').t`Create new message`}
            </Button>
        );
    }

    return c('Info').t`Seems like you are all caught up for now`;
};

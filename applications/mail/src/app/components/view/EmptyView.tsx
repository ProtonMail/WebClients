import { c } from 'ttag';

import { Button, EmptyViewContainer } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import noResultInboxSvg from '@proton/styles/assets/img/illustrations/empty-mailbox.svg';
import noResultSearchSvg from '@proton/styles/assets/img/illustrations/empty-search.svg';
import noSpamSvg from '@proton/styles/assets/img/illustrations/no-messages-in-spam.svg';
import noUnreadSvg from '@proton/styles/assets/img/illustrations/no-unread-messages.svg';

import { MESSAGE_ACTIONS } from '../../constants';
import { useOnCompose } from '../../containers/ComposeProvider';

interface Props {
    labelID: string;
    isSearch: boolean;
    isUnread: boolean;
}

const EmptyView = ({ labelID, isSearch, isUnread }: Props) => {
    const isInbox = labelID === MAILBOX_LABEL_IDS.INBOX && !isSearch;
    const isScheduled = labelID === MAILBOX_LABEL_IDS.SCHEDULED && !isSearch;
    const isSpam = labelID === MAILBOX_LABEL_IDS.SPAM && !isSearch;
    const isFolder = !isInbox && !isScheduled && !isSearch && !isSpam;

    const onCompose = useOnCompose();

    const scheduleCTAButton = (
        <Button title={c('Action').t`Create new message`} onClick={() => onCompose({ action: MESSAGE_ACTIONS.NEW })}>
            {c('Action').t`Create new message`}
        </Button>
    );

    const imageProps = (() => {
        if (isSpam) {
            return { src: noSpamSvg, alt: c('Search - no results').t`No messages found` };
        }
        if (isUnread) {
            return { src: noUnreadSvg, alt: c('Search - no results').t`No unread messages found` };
        }
        if (isSearch) {
            return { src: noResultSearchSvg, alt: c('Search - no results').t`No results found` };
        }
        if (isFolder) {
            return { src: noResultSearchSvg, alt: c('Search - no results').t`No messages found` };
        }
        if (isInbox) {
            return { src: noResultInboxSvg, alt: c('Search - no results').t`No messages found` };
        }
        if (isScheduled) {
            return { src: noResultSearchSvg, alt: c('Search - no results').t`No messages scheduled` };
        }
    })();

    return (
        <EmptyViewContainer imageProps={imageProps}>
            <h3 className="text-bold">
                {isSearch
                    ? c('Search - no results').t`No results found`
                    : isFolder
                    ? c('Search - no results').t`No messages found`
                    : isScheduled
                    ? c('Search - no results').t`No messages scheduled`
                    : c('Search - no results').t`No messages found`}
            </h3>
            <p data-if="folder">
                {isSearch
                    ? // TODO: Add a link on clear it when search will work
                      c('Info').t`You can either update your search query or clear it`
                    : isFolder
                    ? c('Info').t`You do not have any messages here`
                    : isScheduled
                    ? scheduleCTAButton
                    : c('Info').t`Seems like you are all caught up for now`}
            </p>
        </EmptyViewContainer>
    );
};

export default EmptyView;

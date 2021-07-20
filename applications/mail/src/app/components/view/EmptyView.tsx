import React from 'react';
import { c } from 'ttag';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import noResultSearchSvg from '@proton/styles/assets/img/placeholders/empty-search.svg';
import noResultInboxSvg from '@proton/styles/assets/img/placeholders/empty-mailbox.svg';
import { Button } from '@proton/components';
import { useOnCompose } from '../../containers/ComposeProvider';
import { MESSAGE_ACTIONS } from '../../constants';

interface Props {
    labelID: string;
    isSearch: boolean;
}

const EmptyView = ({ labelID, isSearch }: Props) => {
    const isInbox = labelID === MAILBOX_LABEL_IDS.INBOX && !isSearch;
    const isScheduled = labelID === MAILBOX_LABEL_IDS.SCHEDULED && !isSearch;
    const isFolder = !isInbox && !isScheduled && !isSearch;

    const onCompose = useOnCompose();

    const scheduleCTAButton = (
        <Button title={c('Action').t`Create new message`} onClick={() => onCompose({ action: MESSAGE_ACTIONS.NEW })}>
            {c('Action').t`Create new message`}
        </Button>
    );

    return (
        <div className="mauto p1">
            <figure className="flex-item-fluid text-center p3">
                {isSearch && (
                    <img src={noResultSearchSvg} className="hauto" alt={c('Search - no results').t`No results found`} />
                )}
                {isFolder && (
                    <img
                        src={noResultSearchSvg}
                        className="hauto"
                        alt={c('Search - no results').t`No messages found`}
                    />
                )}
                {isInbox && (
                    <img src={noResultInboxSvg} className="hauto" alt={c('Search - no results').t`No messages found`} />
                )}
                {isScheduled && (
                    <img
                        src={noResultSearchSvg}
                        className="hauto"
                        alt={c('Search - no results').t`No messages found`}
                    />
                )}

                <figcaption className="mt2">
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
                </figcaption>
            </figure>
        </div>
    );
};

export default EmptyView;

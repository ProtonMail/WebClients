import React from 'react';
import { c } from 'ttag';

import { MAILBOX_LABEL_IDS } from 'react-components/node_modules/proton-shared/lib/constants';
import noResultSearchSvg from 'design-system/assets/img/shared/no-result-search.svg';
import noResultFolderSvg from 'design-system/assets/img/shared/no-result-folder.svg';
import noResultInboxSvg from 'design-system/assets/img/shared/no-result-inbox.svg';

interface Props {
    labelID: string;
}

const EmptyView = ({ labelID }: Props) => {
    const isInbox = labelID === MAILBOX_LABEL_IDS.INBOX;
    const isFolder = !isInbox;
    const isSearch = false; // TODO: when the search will be implemented

    return (
        <div className="m2">
            <figure className="flex-item-fluid aligncenter p3">
                {isSearch && <img src={noResultSearchSvg} alt={c('Search - no results').t`No results found`} />}
                {isFolder && <img src={noResultFolderSvg} alt={c('Search - no results').t`No messages found`} />}
                {isInbox && <img src={noResultInboxSvg} alt={c('Search - no results').t`No messages found`} />}

                <figcaption className="mt2">
                    <h3 className="bold">
                        {isSearch
                            ? c('Search - no results').t`No results found`
                            : isFolder
                            ? c('Search - no results').t`No messages found`
                            : c('Search - no results').t`No messages found`}
                    </h3>
                    <p data-if="folder">
                        {isSearch
                            ? // TODO: Add a link on clear it when search will work
                              c('Info').t`Search - no results: You can either update your search query or clear it`
                            : isFolder
                            ? c('Info').t`You do not have any messages here`
                            : c('Info').t`Seems like you are all caught up for now`}
                    </p>
                </figcaption>
            </figure>
        </div>
    );
};

export default EmptyView;

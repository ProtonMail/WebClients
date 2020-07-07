import React from 'react';
import { c } from 'ttag';

import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { getLightOrDark } from 'proton-shared/lib/themes/helpers';
import noResultSearchSvgLight from 'design-system/assets/img/shared/no-result-search.svg';
import noResultSearchSvgDark from 'design-system/assets/img/shared/no-result-search-dark.svg';
import noResultInboxSvgLight from 'design-system/assets/img/shared/no-result-inbox.svg';
import noResultInboxSvgDark from 'design-system/assets/img/shared/no-result-inbox-dark.svg';

interface Props {
    labelID: string;
    isSearch: boolean;
}

const EmptyView = ({ labelID, isSearch }: Props) => {
    const isInbox = labelID === MAILBOX_LABEL_IDS.INBOX && !isSearch;
    const isFolder = !isInbox && !isSearch;
    const noResultSearchSvg = getLightOrDark(noResultSearchSvgLight, noResultSearchSvgDark);
    const noResultInboxSvg = getLightOrDark(noResultInboxSvgLight, noResultInboxSvgDark);

    return (
        <div className="mauto p1">
            <figure className="flex-item-fluid aligncenter p3">
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
                              c('Info').t`You can either update your search query or clear it`
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

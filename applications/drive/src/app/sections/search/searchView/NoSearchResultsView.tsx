import { c } from 'ttag';

import noResultSearchSvg from '@proton/styles/assets/img/illustrations/empty-search.svg';

import { DriveEmptyView } from '../../../components/layout/DriveEmptyView';

export const NoSearchResultsView = () => {
    // translator: Shown when searching and no results are found
    const title = c('Title').t`No results found`;

    const subtitle = [
        // translator: Shown when searching and no results are found
        c('Info').t`Try searching by file name, date, or type.`,
        // translator: Shown when searching and no results are found
        c('Info').t`Also try looking in Trash.`,
    ];
    return <DriveEmptyView image={noResultSearchSvg} title={title} subtitle={subtitle}></DriveEmptyView>;
};

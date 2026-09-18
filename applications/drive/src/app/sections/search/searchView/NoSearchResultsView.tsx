import { c } from 'ttag';

import noResultSearchSvg from '@proton/styles/assets/img/illustrations/empty-search.svg';

import { DriveEmptyView } from '../../../legacy/components/layout/DriveEmptyView';

type Props = {
    isIndexPartial?: boolean;
};

export const NoSearchResultsView = ({ isIndexPartial = false }: Props) => {
    // translator: Shown when searching and no results are found
    const title = c('Title').t`No results found`;

    const subtitle = [
        // translator: Shown when searching and no results are found
        c('Info').t`Try searching by file name, date, or type.`,
        // translator: Shown when searching and no results are found
        c('Info').t`Also try looking in Trash.`,
        isIndexPartial &&
            // translator: Shown when searching and no results are found, and the search index only covers recent items
            c('Info').t`Some older files aren't indexed because your Drive is too large to index fully.`,
    ];
    return <DriveEmptyView image={noResultSearchSvg} title={title} subtitle={subtitle}></DriveEmptyView>;
};

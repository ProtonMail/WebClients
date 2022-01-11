import { c } from 'ttag';

import { EmptyViewContainer } from '@proton/components';
import noResultSearchSvg from '@proton/styles/assets/img/placeholders/empty-search.svg';

export const NoSearchResultsView = () => {
    const imageProps = { src: noResultSearchSvg, alt: c('Info').t`No results found` };

    return (
        <EmptyViewContainer imageProps={imageProps}>
            <h3 className="text-bold">{c('Title').t`No results found`}</h3>
            <p data-if="folder">{c('Info').t`Try different keywords`}</p>
        </EmptyViewContainer>
    );
};

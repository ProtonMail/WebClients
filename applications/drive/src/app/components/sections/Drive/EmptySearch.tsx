import { c } from 'ttag';

import { EmptyViewContainer } from '@proton/components';
import emptySearch from '@proton/styles/assets/img/illustrations/empty-search.svg';

const EmptySearch = () => (
    <div role="presentation" onClick={close} className="flex w100 flex flex-item-fluid">
        <EmptyViewContainer
            imageProps={{ src: emptySearch, title: c('Info').t`No results found` }}
            data-test-id="search-empty-placeholder"
        >
            <h3 className="text-bold">{c('Info').t`No results found`}</h3>
            <p className="color-weak mb0-5">{c('Info').t`Try searching by file name, date, or type.`}</p>
            <p className="color-weak mt0">{c('Info').t`Also try looking in Trash.`}</p>
        </EmptyViewContainer>
    </div>
);

export default EmptySearch;

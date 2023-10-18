import { useLocation } from 'react-router';

import { c } from 'ttag';

import { Scroll } from '@proton/atoms';
import { DropdownMenu, DropdownMenuButton, EllipsisLoader, Icon, ToolbarButton } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { isSearch as testIsSearch } from '../../helpers/elements';
import { extractSearchParameters } from '../../helpers/mailboxUrl';
import { usePaging } from '../../hooks/usePaging';
import ToolbarDropdown from './ToolbarDropdown';

interface Props {
    loading: boolean;
    page: number;
    total: number | undefined;
    onPage: (page: number) => void;
}

const PagingControls = ({ loading, page: inputPage, total: inputTotal, onPage: inputOnPage }: Props) => {
    const location = useLocation();
    const { onPrevious, onNext, onPage, page, total } = usePaging(inputPage, inputTotal, inputOnPage);
    const { esStatus } = useEncryptedSearchContext();
    const { dbExists, esEnabled, isSearchPartial, getCacheStatus, isSearching } = esStatus;
    const searchParameters = extractSearchParameters(location);
    const isSearch = testIsSearch(searchParameters);

    const { isCacheLimited } = getCacheStatus();
    const useLoadMore = isSearch && !loading && dbExists && esEnabled && isCacheLimited && isSearchPartial;

    const loadMore = isSearching ? (
        <div className="flex flex-justify-center">
            <EllipsisLoader />
        </div>
    ) : (
        <DropdownMenuButton
            className="text-underline"
            onClick={() => onPage(total)}
            aria-label={c('Action').t`Load more`}
            data-testid="toolbar:load-more"
        >
            {c('Action').t`Load more`}
        </DropdownMenuButton>
    );

    const totalText = total || 1; // total is 0 when no items
    const paginationLabel = (
        <>
            {page}
            <span>/</span>
            {totalText}
        </>
    );

    return (
        <div className="flex flex-item-noshrink">
            <ToolbarButton
                disabled={loading || page <= 1}
                title={c('Action').t`Previous page`}
                onClick={onPrevious}
                className="on-rtl-mirror toolbar-button--small toolbar-button--small-icon"
                icon={<Icon name="chevron-left" alt={c('Action').t`Previous page`} />}
                data-testid="toolbar:previous-page"
            />
            <ToolbarDropdown
                title={c('Action').t`Change page`}
                content={paginationLabel}
                disabled={loading || total <= 1}
                data-testid="toolbar:page-number-dropdown"
                hasCaret={false}
                className="toolbar-button--small interactive--no-background toolbar-page-number-dropdown text-tabular-nums"
            >
                {{
                    render: () => (
                        <DropdownMenu>
                            <Scroll>
                                {[...Array(total)].map((_, i) => {
                                    const pageNumber = i + 1; // paging tooling is 0 based
                                    const active = page === pageNumber;
                                    return (
                                        <DropdownMenuButton
                                            key={i} // eslint-disable-line react/no-array-index-key
                                            loading={loading}
                                            aria-selected={active}
                                            isSelected={active}
                                            onClick={() => onPage(i + 1)}
                                            aria-label={c('Action').t`Page ${pageNumber}`}
                                            data-testid={`toolbar:page-number-${pageNumber}`}
                                            className={clsx(['flex flex-row'])}
                                        >
                                            <span className="text-left flex-item-fluid">{pageNumber}</span>
                                            {active ? <Icon name="checkmark" className="mt-0.5" /> : null}
                                        </DropdownMenuButton>
                                    );
                                })}
                                {useLoadMore && loadMore}
                            </Scroll>
                        </DropdownMenu>
                    ),
                }}
            </ToolbarDropdown>
            <ToolbarButton
                disabled={loading || page >= total}
                title={c('Action').t`Next page`}
                onClick={onNext}
                className="on-rtl-mirror toolbar-button--small toolbar-button--small-icon"
                icon={<Icon name="chevron-right" alt={c('Action').t`Next page`} />}
                data-testid="toolbar:next-page"
            />
        </div>
    );
};

export default PagingControls;

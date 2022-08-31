import { useLocation } from 'react-router';

import { c } from 'ttag';

import {
    DropdownMenu,
    DropdownMenuButton,
    EllipsisLoader,
    Icon,
    Scroll,
    ToolbarButton,
    classnames,
} from '@proton/components';

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
    narrowMode: boolean;
}

const PagingControls = ({ loading, page: inputPage, total: inputTotal, onPage: inputOnPage, narrowMode }: Props) => {
    const location = useLocation();
    const { onPrevious, onNext, onPage, page, total } = usePaging(inputPage, inputTotal, inputOnPage);
    const { getESDBStatus } = useEncryptedSearchContext();
    const { dbExists, esEnabled, isSearchPartial, isCacheLimited, isSearching } = getESDBStatus();
    const searchParameters = extractSearchParameters(location);
    const isSearch = testIsSearch(searchParameters);

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
        >
            {c('Action').t`Load more`}
        </DropdownMenuButton>
    );

    if (narrowMode) {
        return (
            <>
                <ToolbarDropdown
                    title={c('Action').t`Change page`}
                    content={String(page)}
                    disabled={total <= 1}
                    size="narrow"
                    data-testid="toolbar:page-number-dropdown"
                >
                    {() => (
                        <DropdownMenu>
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
                                        className={classnames(['flex flex-row'])}
                                    >
                                        <span className="text-left flex-item-fluid">{pageNumber}</span>
                                        {active ? <Icon name="checkmark" /> : null}
                                    </DropdownMenuButton>
                                );
                            })}
                            {useLoadMore && loadMore}
                        </DropdownMenu>
                    )}
                </ToolbarDropdown>
            </>
        );
    }

    const totalText = total || 1; // total is 0 when no items
    // translator: Used for pagination, both values are number. Ex: "3 of 15"
    const paginationLabel = c('Pagination').t`${page} of ${totalText}`;

    return (
        <>
            <ToolbarButton
                disabled={loading || page <= 1}
                title={c('Action').t`Previous page`}
                onClick={onPrevious}
                className="on-rtl-mirror"
                icon={<Icon name="chevron-left" alt={c('Action').t`Previous page`} />}
                data-testid="toolbar:previous-page"
            />
            <ToolbarDropdown
                title={c('Action').t`Change page`}
                content={paginationLabel}
                disabled={loading || total <= 1}
                size="narrow"
                data-testid="toolbar:page-number-dropdown"
                hasCaret={false}
            >
                {() => (
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
                                        className={classnames(['flex flex-row'])}
                                    >
                                        <span className="text-left flex-item-fluid">{pageNumber}</span>
                                        {active ? <Icon name="checkmark" className="mt0-2" /> : null}
                                    </DropdownMenuButton>
                                );
                            })}
                            {useLoadMore && loadMore}
                        </Scroll>
                    </DropdownMenu>
                )}
            </ToolbarDropdown>
            <ToolbarButton
                disabled={loading || page >= total}
                title={c('Action').t`Next page`}
                onClick={onNext}
                className="on-rtl-mirror"
                icon={<Icon name="chevron-right" alt={c('Action').t`Next page`} />}
                data-testid="toolbar:next-page"
            />
        </>
    );
};

export default PagingControls;

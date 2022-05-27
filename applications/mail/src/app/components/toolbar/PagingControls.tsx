import {
    Icon,
    DropdownMenu,
    DropdownMenuButton,
    EllipsisLoader,
    ToolbarButton,
    ToolbarSeparator,
    Scroll,
    classnames,
} from '@proton/components';
import { c } from 'ttag';
import { useLocation } from 'react-router';
import ToolbarDropdown from './ToolbarDropdown';
import { usePaging } from '../../hooks/usePaging';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { extractSearchParameters } from '../../helpers/mailboxUrl';
import { isSearch as testIsSearch } from '../../helpers/elements';

interface Props {
    loading: boolean;
    page: number;
    total: number | undefined;
    onPage: (page: number) => void;
}

const PagingControls = ({ loading, page: inputPage, total: inputTotal, onPage: inputOnPage }: Props) => {
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

    // translator: Used for pagination, both values are number. Ex: "3 of 15"
    const paginationLabel = c('Pagination').t`${page} of ${total}`;

    return (
        <>
            <ToolbarSeparator />
            <ToolbarButton
                disabled={loading || page <= 1}
                title={c('Action').t`Previous page`}
                onClick={onPrevious}
                className="no-tablet no-mobile on-rtl-mirror"
                icon={<Icon name="chevron-left" alt={c('Action').t`Previous page`} />}
                data-testid="toolbar:previous-page"
            />
            <ToolbarDropdown
                title={c('Action').t`Change page`}
                content={paginationLabel}
                disabled={total <= 1}
                size="narrow"
                data-testid="toolbar:page-number-dropdown"
                hasCaret={false}
            >
                {() => (
                    <DropdownMenu>
                        <DropdownMenuButton
                            loading={loading}
                            disabled={page === 1}
                            onClick={() => onPage(1)}
                            aria-label={c('Action').t`Go to first page`}
                            data-testid={`toolbar:first-page`}
                        >
                            {c('Action').t`Go to first page`}
                        </DropdownMenuButton>
                        <DropdownMenuButton
                            loading={loading}
                            disabled={page === total}
                            onClick={() => onPage(total)}
                            aria-label={c('Action').t`Go to last page`}
                            data-testid={`toolbar:last-page`}
                            className="border-bottom"
                        >
                            {c('Action').t`Go to last page`}
                        </DropdownMenuButton>
                        <Scroll style={{ height: '120px' }}>
                            {[...Array(total)].map((_, i) => {
                                const pageNumber = i + 1; // paging tooling is 0 based
                                const active = page === pageNumber;
                                return (
                                    <DropdownMenuButton
                                        key={i} // eslint-disable-line react/no-array-index-key
                                        loading={loading}
                                        disabled={active}
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
                        </Scroll>
                    </DropdownMenu>
                )}
            </ToolbarDropdown>
            <ToolbarButton
                disabled={loading || page >= total}
                title={c('Action').t`Next page`}
                onClick={onNext}
                className="no-tablet no-mobile on-rtl-mirror"
                icon={<Icon name="chevron-right" alt={c('Action').t`Next page`} />}
                data-testid="toolbar:next-page"
            />
        </>
    );
};

export default PagingControls;

import { Icon, DropdownMenu, DropdownMenuButton, ToolbarButton } from '@proton/components';
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
    const { dbExists, esEnabled, isSearchPartial, isCacheLimited } = getESDBStatus();
    const searchParameters = extractSearchParameters(location);
    const isSearch = testIsSearch(searchParameters);

    const useLoadMore = isSearch && !loading && dbExists && esEnabled && isCacheLimited && isSearchPartial;
    const loadMore = (
        <DropdownMenuButton
            className="text-underline"
            onClick={() => onPage(total + 1)}
            aria-label={c('Action').t`Load more`}
        >
            {c('Action').t`Load more`}
        </DropdownMenuButton>
    );

    return (
        <>
            <ToolbarButton
                disabled={loading || page <= 1}
                title={c('Action').t`Previous page`}
                onClick={onPrevious}
                className="no-tablet no-mobile"
                icon={<Icon className="rotateZ-90" name="angle-down" alt={c('Action').t`Previous page`} />}
                data-testid="toolbar:previous-page"
            />
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
                            return (
                                <DropdownMenuButton
                                    key={i} // eslint-disable-line react/no-array-index-key
                                    loading={loading}
                                    disabled={page - 1 === i}
                                    onClick={() => onPage(i + 1)}
                                    aria-label={c('Action').t`Page ${pageNumber}`}
                                    data-testid={`toolbar:page-number-${pageNumber}`}
                                >
                                    {pageNumber}
                                </DropdownMenuButton>
                            );
                        })}
                        {useLoadMore && loadMore}
                    </DropdownMenu>
                )}
            </ToolbarDropdown>
            <ToolbarButton
                disabled={loading || page >= total}
                title={c('Action').t`Next page`}
                onClick={onNext}
                className="no-tablet no-mobile"
                icon={<Icon className="rotateZ-270" name="angle-down" alt={c('Action').t`Next page`} />}
                data-testid="toolbar:next-page"
            />
        </>
    );
};

export default PagingControls;

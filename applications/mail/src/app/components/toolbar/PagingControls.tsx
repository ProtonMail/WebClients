import { useLocation } from 'react-router';

import { c } from 'ttag';

import { Scroll } from '@proton/atoms/Scroll/Scroll';
import { DropdownMenu, DropdownMenuButton, EllipsisLoader, ToolbarButton } from '@proton/components';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcChevronLeft } from '@proton/icons/icons/IcChevronLeft';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { TelemetryMailPagingControlsEvents } from '@proton/shared/lib/api/telemetry';
import type { MAIL_PAGE_SIZE } from '@proton/shared/lib/mail/mailSettings';
import clsx from '@proton/utils/clsx';

import { isPageConsecutive } from 'proton-mail/helpers/paging';
import useTelemetryPagingControls from 'proton-mail/hooks/useTelemetryPagingControls';
import { contextPages } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { isSearch as testIsSearch } from '../../helpers/elements';
import { extractSearchParameters } from '../../helpers/mailboxUrl';
import { usePaging } from '../../hooks/usePaging';
import ToolbarDropdown from './ToolbarDropdown';

interface Props {
    loading: boolean;
    page: number;
    pageSize: MAIL_PAGE_SIZE;
    total: number | undefined;
    onPage: (page: number) => void;
}

const PagingControls = ({
    loading,
    page: inputPage,
    pageSize: inputPageSize,
    total: inputTotal,
    onPage: inputOnPage,
}: Props) => {
    const pagesState = useMailSelector(contextPages);

    const location = useLocation();
    const { onPrevious, onNext, onPage, page, total } = usePaging(inputPage, inputPageSize, inputTotal, inputOnPage);
    const { esStatus } = useEncryptedSearchContext();
    const { dbExists, esEnabled, isSearchPartial, getCacheStatus, isSearching } = esStatus;
    const searchParameters = extractSearchParameters(location);
    const isSearch = testIsSearch(searchParameters);
    const sendPagingTelemetryReport = useTelemetryPagingControls();

    const { isCacheLimited } = getCacheStatus();
    const useLoadMore = isSearch && !loading && dbExists && esEnabled && isCacheLimited && isSearchPartial;

    const handleClickPrevious = () => {
        onPrevious();
        void sendPagingTelemetryReport({ event: TelemetryMailPagingControlsEvents.move_to_previous_page });
    };

    const handleClickNext = () => {
        onNext();
        void sendPagingTelemetryReport({ event: TelemetryMailPagingControlsEvents.move_to_next_page });
    };

    const handleClickCustomPage = (page: number) => {
        onPage(page);

        /* One tricky things that we have to manage with the page is when a user is "creating a gap' in the pages.
         * E.g. the user has loaded page 1 and 2, and goes to page 10
         * All items in between are not in the cache, and it makes the items management difficult when users then
         * navigates to other pages, because we need to predict what needs to be loaded.
         * => Here we want to track how often users are creating this gap.
         * note: in the state pages start with index 0, so we need to decrease the destination page to compare them
         */
        void sendPagingTelemetryReport({
            event: TelemetryMailPagingControlsEvents.move_to_custom_page,
            dimensions: { isPageConsecutive: isPageConsecutive(pagesState, page - 1) ? 'true' : 'false' },
        });
    };

    const handleClickLoadMore = () => {
        onPage(total);
        void sendPagingTelemetryReport({ event: TelemetryMailPagingControlsEvents.clicked_load_more_search_results });
    };

    const loadMore = isSearching ? (
        <div className="flex justify-center">
            <EllipsisLoader />
        </div>
    ) : (
        <DropdownMenuButton
            className="text-underline"
            onClick={handleClickLoadMore}
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
        <div className="flex shrink-0">
            <ToolbarButton
                disabled={loading || page <= 1}
                title={c('Action').t`Previous page`}
                onClick={handleClickPrevious}
                className="rtl:mirror toolbar-button--small toolbar-button--small-icon"
                icon={<IcChevronLeft alt={c('Action').t`Previous page`} />}
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
                                            key={i}
                                            loading={loading}
                                            aria-selected={active}
                                            isSelected={active}
                                            onClick={() => handleClickCustomPage(i + 1)}
                                            aria-label={c('Action').t`Page ${pageNumber}`}
                                            data-testid={`toolbar:page-number-${pageNumber}`}
                                            className={clsx(['flex flex-row'])}
                                        >
                                            <span className="text-left flex-1">{pageNumber}</span>
                                            {active ? <IcCheckmark className="mt-0.5" /> : null}
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
                onClick={handleClickNext}
                className="rtl:mirror toolbar-button--small toolbar-button--small-icon"
                icon={<IcChevronRight alt={c('Action').t`Next page`} />}
                data-testid="toolbar:next-page"
            />
        </div>
    );
};

export default PagingControls;

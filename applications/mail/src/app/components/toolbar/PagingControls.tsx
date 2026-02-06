import { useLocation } from 'react-router';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Scroll } from '@proton/atoms/Scroll/Scroll';
import {
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuButton,
    EllipsisLoader,
    usePopperAnchor,
} from '@proton/components';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcChevronLeft } from '@proton/icons/icons/IcChevronLeft';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { TelemetryMailPagingControlsEvents } from '@proton/shared/lib/api/telemetry';

import { isPageConsecutive } from 'proton-mail/helpers/paging';
import useTelemetryPagingControls from 'proton-mail/hooks/useTelemetryPagingControls';
import { contextPages, pageSize as selectPageSize } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { isSearch as testIsSearch } from '../../helpers/elements';
import { extractSearchParameters } from '../../helpers/mailboxUrl';
import { usePaging } from '../../hooks/usePaging';

interface Props {
    loading: boolean;
    page: number;
    total: number | undefined;
    onPage: (page: number) => void;
}

const LoadMore = ({ isSearching, handleClickLoadMore }: { isSearching: boolean; handleClickLoadMore: () => void }) => {
    return isSearching ? (
        <div className="flex justify-center">
            <EllipsisLoader />
        </div>
    ) : (
        <DropdownMenuButton className="text-underline" onClick={handleClickLoadMore} data-testid="toolbar:load-more">
            {c('Action').t`Load more`}
        </DropdownMenuButton>
    );
};

const PagingControls = ({ loading, page: inputPage, total: inputTotal, onPage: inputOnPage }: Props) => {
    const pagesState = useMailSelector(contextPages);
    const pageSize = useMailSelector(selectPageSize);

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const location = useLocation();
    const { onPrevious, onNext, onPage, page, total } = usePaging(inputPage, pageSize, inputTotal, inputOnPage);
    const { esStatus } = useEncryptedSearchContext();
    const { dbExists, esEnabled, isSearchPartial, getCacheStatus, isSearching } = esStatus;
    const searchParameters = extractSearchParameters(location);
    const isSearch = testIsSearch(searchParameters);
    const sendPagingTelemetryReport = useTelemetryPagingControls();

    const { isCacheLimited } = getCacheStatus();

    const useLoadMore = isSearch && !loading && dbExists && esEnabled && isCacheLimited && isSearchPartial;
    const previousDisableDisabled = loading || page <= 1;
    const dropdownDisabled = loading || total <= 1;
    const nextDisableDisabled = loading || page >= total;

    const handleClickPrevious = () => {
        if (previousDisableDisabled) {
            return;
        }

        onPrevious();
        void sendPagingTelemetryReport({ event: TelemetryMailPagingControlsEvents.move_to_previous_page });
    };

    const handleClickNext = () => {
        if (nextDisableDisabled) {
            return;
        }

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

    // total is 0 when no items
    const totalText = total || 1;

    return (
        <>
            <div className="flex shrink-0">
                <Button
                    onClick={handleClickPrevious}
                    tabIndex={previousDisableDisabled ? -1 : undefined}
                    disabled={previousDisableDisabled}
                    icon
                    shape="ghost"
                    size="tiny"
                    data-testid="toolbar:previous-page"
                >
                    <IcChevronLeft alt={c('Action').t`Previous page`} className="rtl:mirror" />
                </Button>
                <DropdownButton
                    size="tiny"
                    shape="ghost"
                    data-testid="toolbar:page-number-dropdown"
                    ref={anchorRef}
                    isOpen={isOpen}
                    onClick={toggle}
                    disabled={dropdownDisabled}
                    tabIndex={dropdownDisabled ? -1 : undefined}
                >
                    <>
                        {page}
                        <span>/</span>
                        {totalText}
                    </>
                </DropdownButton>
                <Button
                    onClick={handleClickNext}
                    tabIndex={nextDisableDisabled ? -1 : undefined}
                    disabled={nextDisableDisabled}
                    icon
                    shape="ghost"
                    size="tiny"
                    data-testid="toolbar:next-page"
                >
                    <IcChevronRight alt={c('Action').t`Next page`} className="rtl:mirror" />
                </Button>
            </div>

            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
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
                                    className="flex flex-row"
                                >
                                    <span className="text-left flex-1">{pageNumber}</span>
                                    {active ? <IcCheckmark className="mt-0.5" /> : null}
                                </DropdownMenuButton>
                            );
                        })}
                        {useLoadMore && (
                            <LoadMore isSearching={isSearching} handleClickLoadMore={handleClickLoadMore} />
                        )}
                    </Scroll>
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export default PagingControls;

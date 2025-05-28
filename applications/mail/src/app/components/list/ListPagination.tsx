import { memo, useMemo } from 'react';

import { c } from 'ttag';

import { Button, Tooltip } from '@proton/atoms';
import { Icon } from '@proton/components';
import { TelemetryMailPagingControlsEvents } from '@proton/shared/lib/api/telemetry';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import unique from '@proton/utils/unique';

import { isPageConsecutive } from 'proton-mail/helpers/paging';
import useTelemetryPagingControls from 'proton-mail/hooks/useTelemetryPagingControls';
import { contextPages } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

interface Props {
    onPrevious: () => void;
    onNext: () => void;
    onPage: (pageNumber: number) => void;
    page: number;
    total: number;
    loading?: boolean;
}

const ListPagination = ({ onPrevious, onNext, onPage, page, loading, total }: Props) => {
    const pagesState = useMailSelector(contextPages);
    const sendPagingTelemetryReport = useTelemetryPagingControls();

    const goToPageTitle = (page: number) => c('Action').t`Go to page ${page}`;
    const disablePrevious = page === 1;
    const disableNext = page === total;

    const pageNumbersToDisplay: number[] = useMemo(() => {
        const lastPage = total;

        switch (page) {
            case 1:
                /**
                 * We display buttons for 3 first pages and last one
                 */
                return unique([1, page + 1, Math.min(page + 2, lastPage), lastPage]);
            case lastPage:
                /**
                 * We display buttons for first page and 3 last pages
                 */
                return unique([1, Math.max(1, lastPage - 2), lastPage - 1, lastPage]);
            default:
                /**
                 * We display buttons for first, last, current-1, current and current+1 pages
                 */
                return unique([1, page - 1, page, page + 1, lastPage]);
        }
    }, [page, total]);

    const handleClickPrevious = () => {
        onPrevious();
        void sendPagingTelemetryReport({ event: TelemetryMailPagingControlsEvents.move_to_previous_page });
    };

    const handleClickNext = () => {
        onNext();
        void sendPagingTelemetryReport({ event: TelemetryMailPagingControlsEvents.move_to_previous_page });
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

    return (
        <div className="flex flex-column items-center">
            <div className="flex flex-row gap-2 items-inherit">
                <Tooltip title={c('Action').t`Go to previous page`}>
                    <Button
                        size="small"
                        icon
                        shape="ghost"
                        className="rtl:mirror"
                        disabled={loading || disablePrevious}
                        onClick={handleClickPrevious}
                        data-testid="pagination-row:go-to-previous-page"
                    >
                        <Icon name="chevron-left" className="block" alt={c('Action').t`Go to previous page`} />
                    </Button>
                </Tooltip>
                {pageNumbersToDisplay.reduce((acc: React.JSX.Element[], pageNumber: number, index: number) => {
                    const isActive = pageNumber === page;
                    const needsEllispsis = index > 0 && pageNumber - pageNumbersToDisplay[index - 1] > 1;
                    const buttonTitle = goToPageTitle(pageNumber);

                    return [
                        ...acc,
                        needsEllispsis && <div key={`pagination_ellipsis_${pageNumber}`}>...</div>,
                        <Tooltip key={`pagination_${pageNumber}`} title={buttonTitle}>
                            <Button
                                size="small"
                                aria-current={isActive}
                                shape={isActive ? 'solid' : 'ghost'}
                                className={clsx([isActive && 'text-bold pointer-events-none', 'px-2'])}
                                disabled={loading}
                                onClick={() => handleClickCustomPage(pageNumber)}
                                data-testid={`pagination-row:go-to-page-${pageNumber}`}
                            >
                                <span className="sr-only">{buttonTitle}</span>
                                <span aria-hidden="true">{pageNumber}</span>
                            </Button>
                        </Tooltip>,
                    ].filter(isTruthy);
                }, [])}
                <Tooltip title={c('Action').t`Go to next page`}>
                    <Button
                        size="small"
                        shape="ghost"
                        className="rtl:mirror"
                        icon
                        disabled={loading || disableNext}
                        onClick={handleClickNext}
                        data-testid="pagination-row:go-to-next-page"
                    >
                        <Icon name="chevron-right" className="block" alt={c('Action').t`Go to next page`} />
                    </Button>
                </Tooltip>
            </div>
        </div>
    );
};

export default memo(ListPagination);

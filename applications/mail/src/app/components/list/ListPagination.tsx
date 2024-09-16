import { memo, useMemo } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Tooltip } from '@proton/components';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import unique from '@proton/utils/unique';

interface Props {
    onPrevious: () => void;
    onNext: () => void;
    onPage: (pageNumber: number) => void;
    page: number;
    total: number;
    loading?: boolean;
}

const ListPagination = ({ onPrevious, onNext, onPage, page, loading, total }: Props) => {
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
                        onClick={() => onPrevious()}
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
                                onClick={() => onPage(pageNumber)}
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
                        onClick={() => onNext()}
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

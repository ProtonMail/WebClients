import { c } from 'ttag';
import { range } from '@proton/shared/lib/helpers/array';
import { memo } from 'react';
import { ButtonGroup, Button } from '../button';
import { Icon } from '../icon';
import { classnames } from '../../helpers';
import { Tooltip } from '../tooltip';

interface Props {
    onStart: () => void;
    onEnd: () => void;
    onPrevious: () => void;
    onNext: () => void;
    onPage: (pageNumber: number) => void;
    page: number;
    total: number;
    disabled?: boolean;
    step?: number;
    className?: string;
    disableGoToLast?: boolean;
}

const PaginationRow = ({
    onStart,
    onEnd,
    onPrevious,
    onNext,
    onPage,
    page,
    disabled,
    total,
    step = 1,
    className,
    disableGoToLast = false,
}: Props) => {
    const pages = range(page - step, page + step + 1).filter((pageNumber) => pageNumber > 0 && pageNumber <= total);
    const goToPageTitle = (page: number) => c('Action').t`Go to page ${page}`;
    const disablePrevious = page === 1;
    const disableNext = page === total;

    return (
        <ButtonGroup className={className}>
            <Tooltip title={c('Action').t`Go to first page`}>
                <Button
                    className="on-rtl-mirror"
                    icon
                    disabled={disabled || disablePrevious}
                    onClick={() => onStart()}
                    data-testid="pagination-row:go-to-first-page"
                >
                    <Icon name="angles-left" className="block" alt={c('Action').t`Go to first page`} />
                </Button>
            </Tooltip>
            <Tooltip title={c('Action').t`Go to previous page`}>
                <Button
                    className="on-rtl-mirror"
                    disabled={disabled || disablePrevious}
                    onClick={() => onPrevious()}
                    data-testid="pagination-row:go-to-previous-page"
                >
                    <Icon name="angle-down" className="block rotateZ-90" alt={c('Action').t`Go to previous page`} />
                </Button>
            </Tooltip>
            {pages.map((pageNumber) => {
                const isActive = pageNumber === page;
                return (
                    <Tooltip key={pageNumber} title={goToPageTitle(pageNumber)}>
                        <Button
                            aria-current={isActive}
                            className={classnames([isActive && 'text-bold', isActive && 'no-pointer-events'])}
                            disabled={disabled}
                            onClick={() => onPage(pageNumber)}
                            data-testid={`pagination-row:go-to-page-${pageNumber}`}
                        >
                            <span className="sr-only">{goToPageTitle(pageNumber)}</span>
                            <span aria-hidden="true">{pageNumber}</span>
                        </Button>
                    </Tooltip>
                );
            })}
            <Tooltip title={c('Action').t`Go to next page`}>
                <Button
                    className="on-rtl-mirror"
                    icon
                    disabled={disabled || disableNext}
                    onClick={() => onNext()}
                    data-testid="pagination-row:go-to-next-page"
                >
                    <Icon name="angle-down" className="block rotateZ-270" alt={c('Action').t`Go to next page`} />
                </Button>
            </Tooltip>
            <Tooltip title={c('Action').t`Go to last page`}>
                <Button
                    icon
                    disabled={disabled || disableNext || disableGoToLast}
                    onClick={() => onEnd()}
                    data-testid="pagination-row:go-to-last-page"
                >
                    <Icon name="angles-left" className="block mirror" alt={c('Action').t`Go to last page`} />
                </Button>
            </Tooltip>
        </ButtonGroup>
    );
};

export default memo(PaginationRow);

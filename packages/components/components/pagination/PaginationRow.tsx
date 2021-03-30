import React from 'react';
import { c } from 'ttag';
import { range } from 'proton-shared/lib/helpers/array';

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
}: Props) => {
    const pages = range(page - step, page + step + 1).filter((pageNumber) => pageNumber > 0 && pageNumber <= total);
    const goToPageTitle = (page: number) => c('Action').t`Go to page ${page}`;
    const disablePrevious = page === 1;
    const disableNext = page === total;
    return (
        <ButtonGroup className={className}>
            <Tooltip title={c('Action').t`Go to first page`}>
                <Button icon group shape="ghost" disabled={disabled || disablePrevious} onClick={() => onStart()}>
                    <Icon name="caret-double-left" alt={c('Action').t`Go to first page`} />
                </Button>
            </Tooltip>
            <Tooltip title={c('Action').t`Go to previous page`}>
                <Button group icon shape="ghost" disabled={disabled || disablePrevious} onClick={() => onPrevious()}>
                    <Icon name="caret" className="rotateZ-90" alt={c('Action').t`Go to previous page`} />
                </Button>
            </Tooltip>
            {pages.map((pageNumber) => {
                const isActive = pageNumber === page;
                return (
                    <Tooltip key={pageNumber} title={goToPageTitle(pageNumber)}>
                        <Button
                            group
                            icon
                            shape="ghost"
                            aria-current={isActive}
                            className={classnames([isActive && 'text-bold', isActive && 'no-pointer-events'])}
                            disabled={disabled}
                            onClick={() => onPage(pageNumber)}
                        >
                            <span className="sr-only">{goToPageTitle(pageNumber)}</span>
                            <span aria-hidden="true">{pageNumber}</span>
                        </Button>
                    </Tooltip>
                );
            })}
            <Tooltip title={c('Action').t`Go to next page`}>
                <Button group icon shape="ghost" disabled={disabled || disableNext} onClick={() => onNext()}>
                    <Icon name="caret" className="rotateZ-270" alt={c('Action').t`Go to next page`} />
                </Button>
            </Tooltip>
            <Tooltip title={c('Action').t`Go to last page`}>
                <Button group icon shape="ghost" disabled={disabled || disableNext} onClick={() => onEnd()}>
                    <Icon name="caret-double-left" className="mirror" alt={c('Action').t`Go to last page`} />
                </Button>
            </Tooltip>
        </ButtonGroup>
    );
};

export default PaginationRow;

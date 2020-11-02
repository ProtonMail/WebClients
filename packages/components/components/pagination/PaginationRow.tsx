import React from 'react';
import { c } from 'ttag';
import { range } from 'proton-shared/lib/helpers/array';

import { Group, ButtonGroup } from '../button';
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
        <Group className={className}>
            <ButtonGroup
                className="pm-button--for-icon relative"
                disabled={disabled || disablePrevious}
                onClick={() => onStart()}
            >
                <Tooltip title={c('Action').t`Go to first page`} className="flex increase-surface-click">
                    <Icon name="caret-double-left" />
                </Tooltip>
            </ButtonGroup>
            <ButtonGroup
                className="pm-button--for-icon relative"
                disabled={disabled || disablePrevious}
                onClick={() => onPrevious()}
            >
                <Tooltip title={c('Action').t`Go to previous page`} className="flex increase-surface-click">
                    <Icon name="caret" className="rotateZ-90" />
                </Tooltip>
            </ButtonGroup>
            {pages.map((pageNumber) => {
                const isActive = pageNumber === page;
                return (
                    <ButtonGroup
                        aria-current={isActive}
                        disabled={disabled || isActive}
                        className={classnames(['pm-button--for-icon relative', isActive && 'is-active'])}
                        key={pageNumber}
                        onClick={() => onPage(pageNumber)}
                    >
                        <Tooltip title={goToPageTitle(pageNumber)} className="flex increase-surface-click">
                            {pageNumber}
                        </Tooltip>
                    </ButtonGroup>
                );
            })}
            <ButtonGroup
                className="pm-button--for-icon relative"
                disabled={disabled || disableNext}
                onClick={() => onNext()}
            >
                <Tooltip title={c('Action').t`Go to next page`} className="flex increase-surface-click">
                    <Icon name="caret" className="rotateZ-270" />
                </Tooltip>
            </ButtonGroup>
            <ButtonGroup
                className="pm-button--for-icon relative"
                disabled={disabled || disableNext}
                onClick={() => onEnd()}
            >
                <Tooltip title={c('Action').t`Go to last page`} className="flex increase-surface-click">
                    <Icon name="caret-double-left" className="mirror" />
                </Tooltip>
            </ButtonGroup>
        </Group>
    );
};

export default PaginationRow;

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
                className={classnames([
                    'button--for-icon no-outline relative',
                    (disabled || disablePrevious) && 'no-pointer-events no-pointer-events-children',
                ])}
                onClick={() => onStart()}
            >
                <Tooltip title={c('Action').t`Go to first page`} className="flex increase-click-surface">
                    <Icon
                        name="caret-double-left"
                        className={classnames([(disabled || disablePrevious) && 'opacity-50'])}
                        alt={c('Action').t`Go to first page`}
                    />
                </Tooltip>
            </ButtonGroup>
            <ButtonGroup
                className={classnames([
                    'button--for-icon no-outline relative',
                    (disabled || disablePrevious) && 'no-pointer-events no-pointer-events-children',
                ])}
                onClick={() => onPrevious()}
            >
                <Tooltip title={c('Action').t`Go to previous page`} className="flex increase-click-surface">
                    <Icon
                        name="caret"
                        className={classnames(['rotateZ-90', (disabled || disablePrevious) && 'opacity-50'])}
                        alt={c('Action').t`Go to previous page`}
                    />
                </Tooltip>
            </ButtonGroup>
            {pages.map((pageNumber) => {
                const isActive = pageNumber === page;
                return (
                    <ButtonGroup
                        aria-current={isActive}
                        className={classnames([
                            'button--for-icon no-outline relative',
                            isActive && 'text-bold',
                            (disabled || isActive) && 'no-pointer-events no-pointer-events-children',
                        ])}
                        key={pageNumber}
                        onClick={() => onPage(pageNumber)}
                    >
                        <Tooltip title={goToPageTitle(pageNumber)} className="flex increase-click-surface">
                            <span className="sr-only">{goToPageTitle(pageNumber)}</span>
                            <span aria-hidden="true">{pageNumber}</span>
                        </Tooltip>
                    </ButtonGroup>
                );
            })}
            <ButtonGroup
                className={classnames([
                    'button--for-icon no-outline relative',
                    (disabled || disableNext) && 'no-pointer-events no-pointer-events-children',
                ])}
                onClick={() => onNext()}
            >
                <Tooltip title={c('Action').t`Go to next page`} className="flex increase-click-surface">
                    <Icon
                        name="caret"
                        className={classnames(['rotateZ-270', (disabled || disableNext) && 'opacity-50'])}
                        alt={c('Action').t`Go to next page`}
                    />
                </Tooltip>
            </ButtonGroup>
            <ButtonGroup
                className={classnames([
                    'button--for-icon no-outline relative',
                    (disabled || disableNext) && 'no-pointer-events no-pointer-events-children',
                ])}
                onClick={() => onEnd()}
            >
                <Tooltip title={c('Action').t`Go to last page`} className="flex increase-click-surface">
                    <Icon
                        name="caret-double-left"
                        className={classnames(['mirror', (disabled || disableNext) && 'opacity-50'])}
                        alt={c('Action').t`Go to last page`}
                    />
                </Tooltip>
            </ButtonGroup>
        </Group>
    );
};

export default PaginationRow;

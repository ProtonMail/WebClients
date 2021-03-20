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
                <Button
                    icon
                    group
                    className={classnames([
                        'no-outline relative',
                        (disabled || disablePrevious) && 'no-pointer-events no-pointer-events-children',
                    ])}
                    onClick={() => onStart()}
                >
                    <Icon
                        name="caret-double-left"
                        className={classnames([(disabled || disablePrevious) && 'opacity-50'])}
                        alt={c('Action').t`Go to first page`}
                    />
                </Button>
            </Tooltip>
            <Tooltip title={c('Action').t`Go to previous page`}>
                <Button
                    group
                    icon
                    className={classnames([
                        'no-outline relative',
                        (disabled || disablePrevious) && 'no-pointer-events no-pointer-events-children',
                    ])}
                    onClick={() => onPrevious()}
                >
                    <Icon
                        name="caret"
                        className={classnames(['rotateZ-90', (disabled || disablePrevious) && 'opacity-50'])}
                        alt={c('Action').t`Go to previous page`}
                    />
                </Button>
            </Tooltip>
            {pages.map((pageNumber) => {
                const isActive = pageNumber === page;
                return (
                    <Tooltip key={pageNumber} title={goToPageTitle(pageNumber)}>
                        <Button
                            group
                            icon
                            aria-current={isActive}
                            className={classnames([
                                'no-outline relative',
                                isActive && 'text-bold',
                                (disabled || isActive) && 'no-pointer-events no-pointer-events-children',
                            ])}
                            onClick={() => onPage(pageNumber)}
                        >
                            <span className="sr-only">{goToPageTitle(pageNumber)}</span>
                            <span aria-hidden="true">{pageNumber}</span>
                        </Button>
                    </Tooltip>
                );
            })}
            <Tooltip title={c('Action').t`Go to next page`}>
                <Button
                    group
                    icon
                    className={classnames([
                        'no-outline relative',
                        (disabled || disableNext) && 'no-pointer-events no-pointer-events-children',
                    ])}
                    onClick={() => onNext()}
                >
                    <Icon
                        name="caret"
                        className={classnames(['rotateZ-270', (disabled || disableNext) && 'opacity-50'])}
                        alt={c('Action').t`Go to next page`}
                    />
                </Button>
            </Tooltip>
            <Tooltip title={c('Action').t`Go to last page`}>
                <Button
                    group
                    icon
                    className={classnames([
                        'no-outline relative',
                        (disabled || disableNext) && 'no-pointer-events no-pointer-events-children',
                    ])}
                    onClick={() => onEnd()}
                >
                    <Icon
                        name="caret-double-left"
                        className={classnames(['mirror', (disabled || disableNext) && 'opacity-50'])}
                        alt={c('Action').t`Go to last page`}
                    />
                </Button>
            </Tooltip>
        </ButtonGroup>
    );
};

export default PaginationRow;

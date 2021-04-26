import React from 'react';
import { c } from 'ttag';
import { ButtonGroup, Button } from '../button';
import DropdownMenuButton from '../dropdown/DropdownMenuButton';
import DropdownMenu from '../dropdown/DropdownMenu';
import SimpleDropdown from '../dropdown/SimpleDropdown';
import { Icon } from '../icon';

interface Props {
    total: number;
    limit: number;
    onSelect: (index: number) => void;
    page?: number;
    onNext?: () => void;
    onPrevious?: () => void;
    hasNext?: boolean;
    hasPrevious?: boolean;
}

const Pagination = ({
    onNext,
    onPrevious,
    onSelect,
    hasNext = true,
    hasPrevious = true,
    page = 1,
    total,
    limit,
}: Props) => {
    if (!total) {
        return null;
    }

    const pages = Math.ceil(total / limit);

    if (pages === 1) {
        return null;
    }

    const actions = Array.from({ length: pages }, (a, i) => {
        const index = i + 1;
        return (
            <DropdownMenuButton
                key={index}
                onClick={() => onSelect(index)}
                aria-current={index === page}
                className={index === page ? 'is-active text-center' : 'text-center'}
            >
                {index.toString()}
            </DropdownMenuButton>
        );
    });

    const disablePrevious = page === 1;
    const disableNext = page === pages;

    return (
        <ButtonGroup>
            {hasPrevious ? (
                <Button
                    icon
                    className="previous-button"
                    disabled={disablePrevious}
                    onClick={onPrevious}
                    title={c('Title').t`Previous`}
                >
                    <Icon name="arrow-left" />
                </Button>
            ) : null}
            <SimpleDropdown as={Button} title={c('Title').t`Open pagination`} content={page}>
                <DropdownMenu>{actions}</DropdownMenu>
            </SimpleDropdown>
            {hasNext ? (
                <Button icon className="next-button" disabled={disableNext} onClick={onNext} title={c('Title').t`Next`}>
                    <Icon name="arrow-right" />
                </Button>
            ) : null}
        </ButtonGroup>
    );
};

export default Pagination;

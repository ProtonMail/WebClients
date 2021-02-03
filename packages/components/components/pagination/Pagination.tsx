import React from 'react';
import { c } from 'ttag';
import { Group, Button } from '../button';
import DropdownMenuButton from '../dropdown/DropdownMenuButton';
import DropdownMenu from '../dropdown/DropdownMenu';
import SimpleDropdown from '../dropdown/SimpleDropdown';

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
                disabled={index === page}
                className={index === page ? 'is-active text-center' : 'text-center'}
            >
                {index.toString()}
            </DropdownMenuButton>
        );
    });

    const disablePrevious = page === 1;
    const disableNext = page === pages;

    return (
        <Group>
            {hasPrevious ? (
                <Button
                    icon="arrow-left"
                    className="previous-button grouped-button"
                    disabled={disablePrevious}
                    onClick={onPrevious}
                />
            ) : null}
            <SimpleDropdown
                className="button grouped-button button--for-icon"
                title={c('Title').t`Open pagination`}
                content={page}
            >
                <DropdownMenu>{actions}</DropdownMenu>
            </SimpleDropdown>
            {hasNext ? (
                <Button
                    icon="arrow-right"
                    className="next-button grouped-button"
                    disabled={disableNext}
                    onClick={onNext}
                />
            ) : null}
        </Group>
    );
};

export default Pagination;

import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Group, Button } from '../button';
import DropdownMenuButton from '../dropdown/DropdownMenuButton';
import DropdownMenu from '../dropdown/DropdownMenu';
import SimpleDropdown from '../dropdown/SimpleDropdown';

const Pagination = ({ onNext, onPrevious, onSelect, hasNext = true, hasPrevious = true, page = 1, total, limit }) => {
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
                className={index === page ? 'is-active aligncenter' : 'aligncenter'}
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
                    className="previous-button pm-group-button"
                    disabled={disablePrevious}
                    onClick={onPrevious}
                />
            ) : null}
            <SimpleDropdown
                size="narrow"
                className="pm-group-button pm-button--for-icon"
                title={c('Title').t`Open pagination`}
                content={page}
            >
                <DropdownMenu>{actions}</DropdownMenu>
            </SimpleDropdown>
            {hasNext ? (
                <Button
                    icon="arrow-right"
                    className="next-button pm-group-button"
                    disabled={disableNext}
                    onClick={onNext}
                />
            ) : null}
        </Group>
    );
};

Pagination.propTypes = {
    onNext: PropTypes.func,
    onPrevious: PropTypes.func,
    onSelect: PropTypes.func.isRequired,
    page: PropTypes.number,
    total: PropTypes.number.isRequired,
    limit: PropTypes.number.isRequired,
    hasNext: PropTypes.bool,
    hasPrevious: PropTypes.bool
};

export default Pagination;

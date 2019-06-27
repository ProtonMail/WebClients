import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

import { Group } from '../button';
import { Dropdown, DropdownMenu, DropdownButton } from '../dropdown';
import IconButton from '../button/IconButton';

const Pagination = ({ onNext, onPrevious, onSelect, hasNext, hasPrevious, page, total, limit }) => {
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
            <DropdownButton
                key={index}
                onClick={() => onSelect(index)}
                disabled={index === page}
                className={index === page ? 'is-active aligncenter' : 'aligncenter'}
            >
                {index.toString()}
            </DropdownButton>
        );
    });

    const disablePrevious = page === 1;
    const disableNext = page === pages;

    return (
        <Group>
            {hasPrevious ? (
                <IconButton
                    icon="arrow-left"
                    className="previous-button pm-group-button"
                    disabled={disablePrevious}
                    onClick={onPrevious}
                />
            ) : null}
            <Dropdown
                narrow
                caret
                className="pm-button pm-group-button pm-button--for-icon"
                title={c('Title').t`Open pagination`}
                content={page}
            >
                <DropdownMenu>{actions}</DropdownMenu>
            </Dropdown>
            {hasNext ? (
                <IconButton
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
    page: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
    limit: PropTypes.number.isRequired,
    hasNext: PropTypes.bool.isRequired,
    hasPrevious: PropTypes.bool.isRequired
};

Pagination.defaultProps = {
    page: 1,
    hasNext: true,
    hasPrevious: true
};

export default Pagination;

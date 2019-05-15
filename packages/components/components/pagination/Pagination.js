import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

import { ButtonGroup, Group } from '../button';
import { Dropdown, DropdownMenu, DropdownButton } from '../dropdown';
import Icon from '../icon/Icon';

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
                <ButtonGroup
                    className="previous-button pm-button--for-icon"
                    disabled={disablePrevious}
                    onClick={onPrevious}
                >
                    <Icon name="arrow-left" />
                </ButtonGroup>
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
                <ButtonGroup className="next-button pm-button--for-icon" disabled={disableNext} onClick={onNext}>
                    <Icon name="arrow-right" />
                </ButtonGroup>
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

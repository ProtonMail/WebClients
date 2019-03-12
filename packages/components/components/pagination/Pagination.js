import React from 'react';
import PropTypes from 'prop-types';

import { ButtonGroup, Group } from '../button';
import { Dropdown, DropdownMenu } from '../dropdown';
import Icon from '../icon/Icon';

const Pagination = ({ onNext, onPrevious, onSelect, page, total, limit }) => {
    if (!total) {
        return null;
    }

    const pages = Math.ceil(total / limit);

    if (pages === 1) {
        return null;
    }

    const list = [];
    const disablePrevious = page === 1;
    const disableNext = page === pages;

    for (let index = 1; index <= pages; index++) {
        list.push({
            text: index.toString(),
            type: 'button',
            disabled: index === page,
            className: index === page ? 'is-active' : '',
            onClick: onSelect(index)
        });
    }

    return (
        <Group>
            <ButtonGroup disabled={disablePrevious} onClick={onPrevious}>
                <Icon name="arrow-left" />
            </ButtonGroup>
            <Dropdown className="pm-button pm-group-button" content={page}>
                <DropdownMenu list={list} />
            </Dropdown>
            <ButtonGroup disabled={disableNext} onClick={onNext}>
                <Icon name="arrow-right" />
            </ButtonGroup>
        </Group>
    );
};

Pagination.propTypes = {
    onNext: PropTypes.func.isRequired,
    onPrevious: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
    page: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
    limit: PropTypes.number.isRequired
};

Pagination.defaultProps = {
    page: 1
};

export default Pagination;

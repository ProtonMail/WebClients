import React from 'react';
import PropTypes from 'prop-types';

import { ButtonGroup, Group } from '../button';
import { Dropdown, DropdownMenu } from '../dropdown';
import Icon from '../icon/Icon';

const Pagination = ({ onNext, onPrevious, onSelect, hasNext, hasPrevious, page, total, limit }) => {
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
            onClick: () => onSelect(index)
        });
    }

    return (
        <Group>
            {hasPrevious ? (
                <ButtonGroup className="previous-button" disabled={disablePrevious} onClick={onPrevious}>
                    <Icon name="arrow-left" />
                </ButtonGroup>
            ) : null}
            <Dropdown
                className="pm-group-button page-button"
                content={
                    <>
                        {page} <Icon name="caret" />
                    </>
                }
            >
                <DropdownMenu list={list} />
            </Dropdown>
            {hasNext ? (
                <ButtonGroup className="next-button" disabled={disableNext} onClick={onNext}>
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

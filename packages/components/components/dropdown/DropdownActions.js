import React from 'react';
import PropTypes from 'prop-types';
import { Info, Button, Group, ButtonGroup } from 'react-components';
import { c } from 'ttag';

import Dropdown from './Dropdown';
import DropdownMenu from './DropdownMenu';
import DropdownButton from './DropdownButton';

const wrapTooltip = (text, tooltip) => {
    if (!tooltip) {
        return text;
    }
    return (
        <>
            <span className="mr0-5">{text}</span>
            <Info title={tooltip} />
        </>
    );
};

const DropdownActions = ({ loading, disabled, list, className }) => {
    if (!list.length) {
        return null;
    }

    const [{ text, tooltip, ...restProps }, ...restList] = list;

    if (list.length === 1) {
        return (
            <Button loading={loading} disabled={disabled} className={className} {...restProps}>
                {wrapTooltip(text, tooltip)}
            </Button>
        );
    }

    return (
        <Group>
            <ButtonGroup disabled={disabled} loading={loading} className={className} {...restProps}>
                {wrapTooltip(text, tooltip)}
            </ButtonGroup>
            <Dropdown
                align="right"
                caret
                disabled={disabled}
                loading={loading}
                className={`pm-button pm-group-button pm-button--for-icon ${className}`}
                title={c('Title').t`Open actions dropdown`}
                content={''}
            >
                <DropdownMenu>
                    {restList.map(({ text, tooltip, key = text, ...restProps }) => {
                        return (
                            <DropdownButton className="alignleft" key={key} {...restProps}>
                                {wrapTooltip(text, tooltip)}
                            </DropdownButton>
                        );
                    })}
                </DropdownMenu>
            </Dropdown>
        </Group>
    );
};

DropdownActions.propTypes = {
    list: PropTypes.array.isRequired,
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    className: PropTypes.string
};

DropdownActions.defaultProps = {
    list: [],
    disabled: false,
    loading: false,
    className: ''
};

export default DropdownActions;

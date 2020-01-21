import React from 'react';
import PropTypes from 'prop-types';
import { Info, Button, Group, ButtonGroup } from 'react-components';
import { c } from 'ttag';

import DropdownMenu from './DropdownMenu';
import DropdownMenuButton from './DropdownMenuButton';
import SimpleDropdown from './SimpleDropdown';
import { classnames } from '../../helpers/component';

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

const DropdownActions = ({ loading = false, disabled = false, list = [], className = '' }) => {
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
            <SimpleDropdown
                originalPlacement="bottom-right"
                disabled={disabled}
                loading={loading}
                className={classnames(['pm-button pm-group-button pm-button--for-icon', className])}
                title={c('Title').t`Open actions dropdown`}
                content=""
                data-test-id="dropdown:open"
            >
                <DropdownMenu>
                    {restList.map(({ text, tooltip, key = text, ...restProps }) => {
                        return (
                            <DropdownMenuButton className="alignleft" key={key} {...restProps}>
                                {wrapTooltip(text, tooltip)}
                            </DropdownMenuButton>
                        );
                    })}
                </DropdownMenu>
            </SimpleDropdown>
        </Group>
    );
};

const DropdownActionPropTypes = {
    text: PropTypes.string,
    onClick: PropTypes.func
};

DropdownActions.propTypes = {
    list: PropTypes.arrayOf(PropTypes.shape(DropdownActionPropTypes)).isRequired,
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    className: PropTypes.string
};

export default DropdownActions;

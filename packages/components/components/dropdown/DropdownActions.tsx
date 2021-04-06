import React, { ReactNode } from 'react';
import { c } from 'ttag';
import { Info } from '../link';
import { ButtonGroup } from '../button';

import Button, { ButtonProps } from '../button/Button';
import DropdownMenu from './DropdownMenu';
import DropdownMenuButton, { Props as DropdownMenuButtonProps } from './DropdownMenuButton';
import SimpleDropdown from './SimpleDropdown';

import { classnames } from '../../helpers';

const wrapTooltip = (text: string | ReactNode, tooltip?: string) => {
    if (!tooltip) {
        return text;
    }
    if (typeof text !== 'string') {
        return text;
    }
    return (
        <>
            <span className="mr0-5">{text}</span>
            <Info title={tooltip} />
        </>
    );
};

interface DropdownActionProps extends DropdownMenuButtonProps {
    key?: string;
    text: string | ReactNode;
    tooltip?: string;
    onClick?: () => void;
}

interface Props extends ButtonProps {
    loading?: boolean;
    disabled?: boolean;
    list?: DropdownActionProps[];
    className?: string;
    autoFocus?: boolean;
}

const DropdownActions = ({
    loading = false,
    disabled = false,
    list = [],
    className = '',
    autoFocus = false,
    size,
    ...restButtonProps
}: Props) => {
    if (!list.length) {
        return null;
    }

    const [{ text, tooltip, ...restProps }, ...restList] = list;

    if (list.length === 1) {
        return (
            <Button
                size={size}
                loading={loading}
                disabled={disabled}
                className={className}
                {...restProps}
                {...restButtonProps}
            >
                {wrapTooltip(text, tooltip)}
            </Button>
        );
    }

    return (
        <ButtonGroup>
            <Button
                group
                disabled={disabled}
                loading={loading}
                className={className}
                size={size}
                {...restProps}
                {...restButtonProps}
            >
                {wrapTooltip(text, tooltip)}
            </Button>
            <SimpleDropdown
                icon
                group
                size={size}
                autoFocus={autoFocus}
                originalPlacement="bottom-right"
                disabled={disabled}
                loading={loading}
                className={classnames(['flex-item-noshrink', className])}
                title={c('Title').t`Open actions dropdown`}
                data-test-id="dropdown:open"
            >
                <DropdownMenu>
                    {restList.map(({ text, tooltip, ...restProps }, index) => {
                        return (
                            <DropdownMenuButton className="text-left" key={index} {...restProps}>
                                {wrapTooltip(text, tooltip)}
                            </DropdownMenuButton>
                        );
                    })}
                </DropdownMenu>
            </SimpleDropdown>
        </ButtonGroup>
    );
};

export default DropdownActions;

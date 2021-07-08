import React, { MouseEvent, ReactNode, useState } from 'react';
import { c } from 'ttag';
import { Info } from '../link';

import ButtonGroup, { Color, Shape } from '../button/ButtonGroup';
import Button, { ButtonProps } from '../button/Button';
import DropdownMenu from './DropdownMenu';
import DropdownMenuButton, { Props as DropdownMenuButtonProps } from './DropdownMenuButton';
import SimpleDropdown from './SimpleDropdown';

import { classnames, generateUID } from '../../helpers';
import { Tooltip } from '../tooltip';

const wrapTooltip = (text: string | ReactNode, tooltip?: string | ReactNode) => {
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

export interface DropdownActionProps extends DropdownMenuButtonProps {
    key?: string;
    text: string | ReactNode;
    tooltip?: string | ReactNode;
    onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}

interface Props extends ButtonProps {
    loading?: boolean;
    disabled?: boolean;
    list?: DropdownActionProps[];
    className?: string;
    autoFocus?: boolean;
    color?: Color;
    shape?: Shape;
}

const DropdownActions = ({
    loading = false,
    disabled = false,
    list = [],
    className = '',
    autoFocus = false,
    size,
    color,
    shape,
    ...restButtonProps
}: Props) => {
    const [uid] = useState(generateUID('composer-send-button'));

    if (!list.length) {
        return null;
    }

    const [{ text, tooltip, ...restProps }, ...restList] = list;

    const isTextString = typeof text === 'string';

    if (list.length === 1) {
        const buttonProps = {
            size,
            loading,
            disabled,
            className,
            ...restProps,
            ...restButtonProps,
        };

        return isTextString ? (
            <Button {...buttonProps}>{wrapTooltip(text, tooltip)}</Button>
        ) : (
            <Tooltip title={tooltip}>
                <Button {...buttonProps}>{text}</Button>
            </Tooltip>
        );
    }

    const mainButtonProps = {
        disabled,
        loading,
        className,
        ...restProps,
        ...restButtonProps,
    };

    return (
        <ButtonGroup shape={shape} color={color} size={size}>
            {isTextString ? (
                <Button {...mainButtonProps}>{wrapTooltip(text, tooltip)}</Button>
            ) : (
                <Tooltip title={tooltip}>
                    <Button {...mainButtonProps}>{text}</Button>
                </Tooltip>
            )}

            <SimpleDropdown
                as={Button}
                icon
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
                        const dropdownMenuButtonProps = {
                            className: 'text-left',
                            ...restProps,
                        };

                        const key = `${uid}-${index}`;

                        if (isTextString) {
                            return (
                                <DropdownMenuButton key={key} {...dropdownMenuButtonProps}>
                                    {wrapTooltip(text, tooltip)}
                                </DropdownMenuButton>
                            );
                        }

                        return (
                            <Tooltip title={tooltip} key={key}>
                                <DropdownMenuButton {...dropdownMenuButtonProps}>{text}</DropdownMenuButton>
                            </Tooltip>
                        );
                    })}
                </DropdownMenu>
            </SimpleDropdown>
        </ButtonGroup>
    );
};

export default DropdownActions;

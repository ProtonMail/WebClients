import { MouseEvent, ReactNode } from 'react';

import { c } from 'ttag';

import { Button, ButtonProps } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

import ButtonGroup from '../button/ButtonGroup';
import { Icon, IconName } from '../icon';
import { Info } from '../link';
import DropdownMenu from './DropdownMenu';
import DropdownMenuButton, { Props as DropdownMenuButtonProps } from './DropdownMenuButton';
import SimpleDropdown from './SimpleDropdown';

const wrapTooltip = (text: string | ReactNode, tooltip?: string) => {
    if (!tooltip) {
        return text;
    }
    if (typeof text !== 'string') {
        return text;
    }
    return (
        <>
            <span className="mr-2">{text}</span>
            <Info title={tooltip} />
        </>
    );
};

export interface DropdownActionProps extends DropdownMenuButtonProps {
    key?: string;
    text: string | ReactNode;
    tooltip?: string;
    onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export interface Props extends ButtonProps {
    loading?: boolean;
    disabled?: boolean;
    list?: DropdownActionProps[];
    className?: string;
    autoFocus?: boolean;
    iconName?: IconName;
}

const DropdownActions = ({
    loading = false,
    disabled = false,
    list = [],
    className = '',
    autoFocus = false,
    size,
    iconName,
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

    if (iconName) {
        return (
            <SimpleDropdown
                as={Button}
                icon
                size={size}
                autoFocus={autoFocus}
                originalPlacement="bottom-end"
                disabled={disabled}
                loading={loading}
                className={clsx(['flex-item-noshrink', className])}
                title={c('Title').t`Open actions dropdown`}
                data-testid="dropdownActions:dropdown"
                content={<Icon name={iconName} alt={c('Title').t`Open actions dropdown`} />}
                hasCaret={false}
                {...restButtonProps}
            >
                <DropdownMenu>
                    {list.map(({ text, tooltip, ...restProps }, index) => {
                        return (
                            <DropdownMenuButton className="text-left" key={index} {...restProps}>
                                {wrapTooltip(text, tooltip)}
                            </DropdownMenuButton>
                        );
                    })}
                </DropdownMenu>
            </SimpleDropdown>
        );
    }

    return (
        <ButtonGroup size={size}>
            <Button disabled={disabled || loading} className={className} {...restProps} {...restButtonProps}>
                {wrapTooltip(text, tooltip)}
            </Button>
            <SimpleDropdown
                as={Button}
                icon
                autoFocus={autoFocus}
                originalPlacement="bottom-end"
                disabled={disabled}
                loading={loading}
                className={clsx(['flex-item-noshrink', className])}
                title={c('Title').t`Open actions dropdown`}
                data-testid="dropdownActions:dropdown"
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

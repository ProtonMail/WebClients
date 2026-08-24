import type { MouseEvent, ReactNode } from 'react';

import { c } from 'ttag';

import type { ButtonProps } from '@proton/atoms/Button/Button';
import { Button } from '@proton/atoms/Button/Button';
import type { IconName } from '@proton/icons/types';
import clsx from '@proton/utils/clsx';

import { ButtonGroup } from '../button/ButtonGroup';
import Icon from '../icon/Icon';
import Info from '../link/Info';
import DropdownActionsIcon from './DropdownActionsIcon';
import DropdownMenu from './DropdownMenu';
import type { Props as DropdownMenuButtonProps } from './DropdownMenuButton';
import DropdownMenuButton from './DropdownMenuButton';
import SimpleDropdown from './SimpleDropdown';

const wrapTooltip = (text: string | ReactNode, tooltip?: string, fakeDisabled?: boolean) => {
    if (!tooltip) {
        return text;
    }
    if (typeof text !== 'string') {
        return text;
    }
    return (
        <>
            <span className="mr-2">{text}</span>
            <Info title={tooltip} fakeDisabled={fakeDisabled} />
        </>
    );
};

export interface DropdownActionProps extends DropdownMenuButtonProps {
    key?: string;
    text: string | ReactNode;
    tooltip?: string;
    label?: string;
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

    const [{ text, tooltip, label, id, key, ...restProps }, ...restList] = list;

    if (list.length === 1) {
        return (
            <Button
                size={size}
                loading={loading}
                disabled={disabled}
                className={className}
                aria-label={label}
                key={key}
                {...restProps}
                {...restButtonProps}
            >
                {wrapTooltip(text, tooltip)}
            </Button>
        );
    }

    if (iconName) {
        return (
            <DropdownActionsIcon
                list={list}
                size={size}
                autoFocus={autoFocus}
                disabled={disabled}
                loading={loading}
                className={className}
                iconElement={<Icon name={iconName} alt={c('Title').t`Open actions dropdown`} />}
                {...restButtonProps}
            />
        );
    }

    return (
        <ButtonGroup size={size} className="shrink-0">
            <Button
                disabled={disabled || loading}
                className={className}
                aria-label={label}
                {...restProps}
                {...restButtonProps}
            >
                {wrapTooltip(text, tooltip)}
            </Button>
            <SimpleDropdown
                as={Button}
                icon
                autoFocus={autoFocus}
                originalPlacement="bottom-end"
                disabled={disabled}
                loading={loading}
                className={clsx(['shrink-0', className])}
                title={c('Title').t`Open actions dropdown`}
                data-testid="dropdownActions:dropdown"
            >
                <DropdownMenu>
                    {restList.map(({ text, tooltip, disabled, label, key, ...restProps }) => {
                        // Fake disabled is used to have enabled tooltip while the bottom is supposed to be disabled
                        const fakeDisabled = !!(disabled && tooltip);
                        const rest = fakeDisabled ? {} : restProps;

                        return (
                            <DropdownMenuButton
                                className="text-left"
                                key={key}
                                fakeDisabled={fakeDisabled}
                                disabled={fakeDisabled ? false : disabled}
                                aria-label={label}
                                {...rest}
                            >
                                {wrapTooltip(text, tooltip, fakeDisabled)}
                            </DropdownMenuButton>
                        );
                    })}
                </DropdownMenu>
            </SimpleDropdown>
        </ButtonGroup>
    );
};

export default DropdownActions;

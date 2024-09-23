import type { MouseEvent, ReactNode } from 'react';

import { c } from 'ttag';

import type { ButtonProps } from '@proton/atoms';
import { Button } from '@proton/atoms';
import ButtonGroup from '@proton/components/components/button/ButtonGroup';
import type { Props as DropdownMenuButtonProps } from '@proton/components/components/dropdown/DropdownMenuButton';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import Icon, { type IconName } from '@proton/components/components/icon/Icon';
import Info from '@proton/components/components/link/Info';
import clsx from '@proton/utils/clsx';

import DropdownMenu from './DropdownMenu';
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
                className={clsx(['shrink-0', className])}
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
                className={clsx(['shrink-0', className])}
                title={c('Title').t`Open actions dropdown`}
                data-testid="dropdownActions:dropdown"
            >
                <DropdownMenu>
                    {restList.map(({ text, tooltip, disabled, ...restProps }, index) => {
                        // Fake disabled is used to have enabled tooltipe while the buttom is supposed to be disabled
                        const fakeDisabled = !!(disabled && tooltip);
                        const rest = fakeDisabled ? {} : restProps;

                        return (
                            <DropdownMenuButton
                                className="text-left"
                                key={index}
                                fakeDisabled={fakeDisabled}
                                disabled={fakeDisabled ? false : disabled}
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

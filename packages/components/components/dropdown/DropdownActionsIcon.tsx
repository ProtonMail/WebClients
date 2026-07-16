import type { ReactNode } from 'react';

import { c } from 'ttag';

import type { ButtonProps } from '@proton/atoms/Button/Button';
import { Button } from '@proton/atoms/Button/Button';
import clsx from '@proton/utils/clsx';

import Info from '../link/Info';
import type { DropdownActionProps } from './DropdownActions';
import DropdownMenu from './DropdownMenu';
import DropdownMenuButton from './DropdownMenuButton';
import SimpleDropdown from './SimpleDropdown';

export interface Props extends ButtonProps {
    list: DropdownActionProps[];
    iconElement: React.JSX.Element;
    loading?: boolean;
    disabled?: boolean;
    className?: string;
    autoFocus?: boolean;
}

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

const DropdownActionsIcon = ({
    list,
    iconElement,
    loading = false,
    disabled = false,
    className = '',
    autoFocus = false,
    size,
    ...restButtonProps
}: Props) => {
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
            content={iconElement}
            hasCaret={false}
            {...restButtonProps}
        >
            <DropdownMenu>
                {list.map(({ text, tooltip, label, key, ...restProps }) => {
                    return (
                        <DropdownMenuButton className="text-left" aria-label={label} key={key} {...restProps}>
                            {wrapTooltip(text, tooltip)}
                        </DropdownMenuButton>
                    );
                })}
            </DropdownMenu>
        </SimpleDropdown>
    );
};

export default DropdownActionsIcon;

import { ReactNode, Ref, forwardRef } from 'react';

import { c } from 'ttag';

import Button from '@proton/components/components/button/Button';
import ButtonGroup, { Color, Shape } from '@proton/components/components/button/ButtonGroup';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';

interface Props {
    loading?: boolean;
    disabled?: boolean;
    color?: Color;
    shape?: Shape;
    mainAction: ReactNode;
    secondAction?: ReactNode;
    dropdownRef?: Ref<HTMLElement>;
}

const SendActions = (
    { loading = false, disabled = false, color, shape, mainAction, secondAction, dropdownRef }: Props,
    ref: Ref<HTMLDivElement>
) => {
    return (
        <ButtonGroup ref={ref} shape={shape} color={color} data-testid="composer:send-actions">
            {mainAction}

            {secondAction && (
                <SimpleDropdown
                    ref={dropdownRef}
                    as={Button}
                    icon
                    originalPlacement="bottom-right"
                    disabled={disabled}
                    loading={loading}
                    className="flex-item-noshrink composer-actions-secondary"
                    title={c('Title').t`Open actions dropdown`}
                    data-test-id="dropdown:open"
                >
                    <DropdownMenu>{secondAction}</DropdownMenu>
                </SimpleDropdown>
            )}
        </ButtonGroup>
    );
};

export default forwardRef(SendActions);

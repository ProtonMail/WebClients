import { ReactNode } from 'react';
import { c } from 'ttag';

import ButtonGroup, { Color, Shape } from '@proton/components/components/button/ButtonGroup';
import Button from '@proton/components/components/button/Button';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';

import { classnames } from '@proton/components/helpers';

interface Props {
    loading?: boolean;
    disabled?: boolean;
    color?: Color;
    shape?: Shape;
    mainAction: ReactNode;
    secondAction?: ReactNode;
}

const SendActions = ({ loading = false, disabled = false, color, shape, mainAction, secondAction }: Props) => {
    return (
        <ButtonGroup shape={shape} color={color}>
            {mainAction}

            {secondAction && (
                <SimpleDropdown
                    as={Button}
                    icon
                    originalPlacement="bottom-right"
                    disabled={disabled}
                    loading={loading}
                    className={classnames(['flex-item-noshrink'])}
                    title={c('Title').t`Open actions dropdown`}
                    data-test-id="dropdown:open"
                >
                    <DropdownMenu>{secondAction}</DropdownMenu>
                </SimpleDropdown>
            )}
        </ButtonGroup>
    );
};

export default SendActions;

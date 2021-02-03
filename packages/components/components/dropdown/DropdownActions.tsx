import React, { ReactNode } from 'react';
import { c } from 'ttag';
import { Info } from '../link';
import { Button, Group, ButtonGroup } from '../button';

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

interface Props {
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
}: Props) => {
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
                autoFocus={autoFocus}
                originalPlacement="bottom-right"
                disabled={disabled}
                loading={loading}
                className={classnames(['button grouped-button button--for-icon', className])}
                title={c('Title').t`Open actions dropdown`}
                content=""
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
        </Group>
    );
};

export default DropdownActions;

import { useState } from 'react';
import * as React from 'react';

import { c } from 'ttag';

import { Dropdown, DropdownMenu, usePopperAnchor } from '@proton/components';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

import SupportDropdownButton from './SupportDropdownButton';

interface Props {
    children?: React.ReactNode;
    content?: React.ReactNode;
    buttonClassName?: string;
}

const SupportDropdown = ({ content = c('Action').t`Need help?`, children, buttonClassName, ...rest }: Props) => {
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <SupportDropdownButton
                className={clsx('relative color-primary', buttonClassName)}
                aria-describedby={uid}
                buttonRef={anchorRef}
                isOpen={isOpen}
                noCaret
                onClick={toggle}
                {...rest}
            >
                {content}
            </SupportDropdownButton>
            <Dropdown id={uid} isOpen={isOpen} anchorRef={anchorRef} onClose={close} originalPlacement="bottom">
                <DropdownMenu>{children}</DropdownMenu>
            </Dropdown>
        </>
    );
};

export default SupportDropdown;

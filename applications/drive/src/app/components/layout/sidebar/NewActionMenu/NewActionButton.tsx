import { PropsWithChildren } from 'react';

import { c } from 'ttag';

import {
    Dropdown,
    DropdownMenu,
    DropdownSizeUnit,
    Icon,
    SidebarPrimaryButton,
    usePopperAnchor,
} from '@proton/components';
import clsx from '@proton/utils/clsx';

import { CreateNewFolderButton, UploadFileButton, UploadFolderButton } from './NewActionMenuButtons';

interface Props {
    disabled?: boolean;
    className?: string;
}
export const NewActionButton = ({ disabled, className }: PropsWithChildren<Props>) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <SidebarPrimaryButton
                ref={anchorRef}
                disabled={disabled}
                className={clsx(className, 'flex flex-justify-center flex-align-items-center')}
                onClick={toggle}
            >
                <Icon className="mr0-5" name="plus" />
                {c('Action').t`New`}
            </SidebarPrimaryButton>
            <Dropdown
                size={{ width: DropdownSizeUnit.Anchor, height: DropdownSizeUnit.Dynamic }}
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
            >
                <DropdownMenu className="mt0-25 mb0-25">
                    <UploadFileButton />
                    <UploadFolderButton />
                    <hr className="mt0-5 mb0-5" />
                    <CreateNewFolderButton />
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export default NewActionButton;

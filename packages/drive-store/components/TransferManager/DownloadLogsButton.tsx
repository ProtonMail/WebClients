import { c } from 'ttag';

import { Dropdown, DropdownButton, DropdownMenu, DropdownMenuButton, Icon, usePopperAnchor } from '@proton/components';

export default function DownloadLogsButton({ onClick }: { onClick: () => void }) {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <DropdownButton
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                icon
                className="transfers-manager-list-item-controls-button"
            >
                <Icon size={3} name="wrench" alt={'More'} />
            </DropdownButton>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>
                    <DropdownMenuButton className="text-left" onClick={onClick}>
                        {c('Action').t`Download logs`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </>
    );
}

import React, { useMemo } from 'react';
import { generateUID, usePopperAnchor, Dropdown, DropdownMenu, DropdownMenuButton, Icon } from 'react-components';
import Breadcrumb from './Breadcrumb';

export interface BreadcrumbInfo {
    name: string;
    key: string | number;
    onClick: () => void;
}
interface Props {
    breadcrumbs: BreadcrumbInfo[];
}

function GroupedBreadcrumb({ breadcrumbs }: Props) {
    const uid = useMemo(() => generateUID('dropdown'), []);

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLLIElement>();

    return (
        <>
            <Breadcrumb ref={anchorRef} onClick={toggle}>
                ...
            </Breadcrumb>
            <Dropdown id={uid} isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>
                    {breadcrumbs.map((breadcrumb) => (
                        <DropdownMenuButton
                            className="flex alignleft flex-nowrap "
                            key={breadcrumb.key}
                            onClick={breadcrumb.onClick}
                            title={breadcrumb.name}
                        >
                            <Icon name="folder" className="mt0-25 mr0-5 flex-item-noshrink color-global-attention" />{' '}
                            <span title={breadcrumb.name} className="ellipsis">
                                {breadcrumb.name}
                            </span>
                        </DropdownMenuButton>
                    ))}
                </DropdownMenu>
            </Dropdown>
        </>
    );
}

export default GroupedBreadcrumb;

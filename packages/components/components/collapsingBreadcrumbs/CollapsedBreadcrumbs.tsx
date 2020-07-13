import React, { useMemo } from 'react';
import { generateUID } from '../../helpers/component';
import { usePopperAnchor } from '../popper';
import Breadcrumb from './Breadcrumb';
import Dropdown from '../dropdown/Dropdown';
import DropdownMenu from '../dropdown/DropdownMenu';
import DropdownMenuButton from '../dropdown/DropdownMenuButton';
import { BreadcrumbInfo } from './interfaces';

interface Props {
    breadcrumbs: BreadcrumbInfo[];
}

function CollapsedBreadcrumb({ breadcrumbs }: Props) {
    const uid = useMemo(() => generateUID('dropdown'), []);

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLLIElement>();

    return (
        <>
            <Breadcrumb ref={anchorRef} onClick={toggle}>
                ...
            </Breadcrumb>
            <Dropdown id={uid} isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>
                    {breadcrumbs.map((breadcrumb) => {
                        const collapsedText = breadcrumb.collapsedText ?? breadcrumb.text;
                        return (
                            <DropdownMenuButton
                                className="flex alignleft flex-nowrap"
                                key={breadcrumb.key}
                                onClick={breadcrumb.onClick}
                                title={breadcrumb.text}
                            >
                                {typeof collapsedText === 'string' ? (
                                    <span title={collapsedText} className="ellipsis">
                                        {collapsedText}
                                    </span>
                                ) : (
                                    collapsedText
                                )}
                            </DropdownMenuButton>
                        );
                    })}
                </DropdownMenu>
            </Dropdown>
        </>
    );
}

export default CollapsedBreadcrumb;

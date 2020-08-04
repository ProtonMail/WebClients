import React, { useMemo } from 'react';
import { omit } from 'proton-shared/lib/helpers/object';
import { generateUID, classnames } from '../../helpers/component';
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

    const { anchorRef, isOpen, toggle, open, close } = usePopperAnchor<HTMLLIElement>();

    return (
        <>
            <Breadcrumb ref={anchorRef} onClick={toggle} onDragEnter={open}>
                ...
            </Breadcrumb>
            <Dropdown id={uid} isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>
                    {breadcrumbs.map((breadcrumb) => {
                        const {
                            key,
                            text,
                            highlighted,
                            collapsedText = breadcrumb.text,
                            ...breadcrumbProps
                        } = breadcrumb;
                        return (
                            <DropdownMenuButton
                                {...omit(breadcrumbProps, ['noShrink'])}
                                className={classnames([
                                    'flex alignleft flex-nowrap no-pointer-events-children',
                                    highlighted && 'strong',
                                ])}
                                title={text}
                                key={key}
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

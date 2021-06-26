import React, { useMemo, useRef } from 'react';
import { omit } from '@proton/shared/lib/helpers/object';
import { generateUID, classnames } from '../../helpers';
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

    const closeTimeout = useRef<any>();
    const mouseEnterCounter = useRef(0);

    const closeWithTimeout = () => {
        clearTimeout(closeTimeout.current);
        mouseEnterCounter.current = 0;

        closeTimeout.current = setTimeout(() => {
            close();
        }, 1000);
    };

    const handleDragLeave = () => {
        mouseEnterCounter.current -= 1;

        if (mouseEnterCounter.current <= 0) {
            closeWithTimeout();
        }
    };

    const handleDragEnter = () => {
        clearTimeout(closeTimeout.current);
        mouseEnterCounter.current += 1;

        if (!isOpen) {
            open();
        }
    };

    return (
        <>
            <Breadcrumb ref={anchorRef} onClick={toggle} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}>
                ...
            </Breadcrumb>
            <Dropdown
                id={uid}
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                onDragLeave={handleDragLeave}
                onDragEnter={handleDragEnter}
                onDrop={closeWithTimeout}
            >
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
                                    'flex text-left flex-nowrap no-pointer-events-children',
                                    highlighted && 'text-strong',
                                ])}
                                title={text}
                                key={key}
                            >
                                {typeof collapsedText === 'string' ? (
                                    <span title={collapsedText} className="text-ellipsis">
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

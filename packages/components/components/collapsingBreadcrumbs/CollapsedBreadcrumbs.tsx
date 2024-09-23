import { useMemo, useRef } from 'react';

import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import { omit } from '@proton/shared/lib/helpers/object';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

import Breadcrumb from './Breadcrumb';
import type { BreadcrumbInfo } from './interfaces';

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
            <Breadcrumb
                ref={anchorRef}
                onClick={toggle}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                className={isOpen ? 'collapsed-breadcrumb-active' : ''}
            >
                ...
            </Breadcrumb>
            <Dropdown
                id={uid}
                isOpen={isOpen}
                anchorRef={anchorRef}
                originalPlacement="bottom-start"
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
                                className={clsx([
                                    'flex text-left flex-nowrap *:pointer-events-none',
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

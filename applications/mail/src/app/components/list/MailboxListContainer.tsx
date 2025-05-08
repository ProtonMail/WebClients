import { forwardRef } from 'react';
import type { ReactNode, Ref } from 'react';

import clsx from '@proton/utils/clsx';

import { useMailboxListContext } from './MailboxListProvider';

interface MailboxListContainerProps {
    className?: string;
    show?: boolean;
    showContentPanel?: boolean;
    children?: ReactNode;
    noBorder?: boolean;
}

const MailboxListContainer = (
    { className, show = true, showContentPanel = false, children, noBorder = false }: MailboxListContainerProps,
    ref: Ref<HTMLDivElement>
) => {
    const { contextMenu, blockSenderModal } = useMailboxListContext();
    return (
        <div
            className={clsx([
                'relative items-column-list w-full',
                !show && 'hidden',
                showContentPanel ? 'is-column' : 'is-row',
                className,
            ])}
        >
            <div
                ref={ref}
                className={clsx(
                    'overflow-auto flex flex-nowrap flex-column relative h-full w-full',
                    noBorder ? '' : 'items-column-list-inner'
                )}
            >
                {children}
            </div>
            {contextMenu}
            {blockSenderModal}
        </div>
    );
};

export default forwardRef(MailboxListContainer);

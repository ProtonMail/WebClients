import type { ReactNode, Ref } from 'react';
import { forwardRef } from 'react';

import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { useMailboxListContext } from './MailboxListProvider';
import MailboxListScreenReaderHeading from './MailboxListScreenReaderHeading';

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
    const { contextMenu, blockSenderModal, mailboxListLoading, conversationMode, labelID } = useMailboxListContext();

    return (
        <section
            aria-label={c('Info').t`Message list`}
            className={clsx([
                'relative items-column-list w-full',
                !show && 'hidden',
                showContentPanel ? 'is-column' : 'is-row',
                className,
            ])}
        >
            <MailboxListScreenReaderHeading conversationMode={conversationMode} labelID={labelID} />
            <div
                ref={ref}
                className={clsx(
                    'items-column-list-container overflow-auto flex flex-nowrap flex-column relative h-full w-full',
                    noBorder ? '' : 'items-column-list-inner'
                )}
                data-testid={mailboxListLoading ? 'message-list-loading' : 'message-list-loaded'}
            >
                {children}
            </div>
            {contextMenu}
            {blockSenderModal}
        </section>
    );
};

export default forwardRef(MailboxListContainer);

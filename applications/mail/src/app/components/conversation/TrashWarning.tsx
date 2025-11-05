import * as React from 'react';
import { forwardRef } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { useHotkeys } from '@proton/components';
import { IcTrash } from '@proton/icons';

interface Props {
    inTrash: boolean;
    filter: boolean;
    onToggle: () => void;
}

const TrashWarning = ({ inTrash, filter, onToggle }: Props, ref: React.Ref<HTMLDivElement>) => {
    useHotkeys(ref as React.RefObject<HTMLDivElement>, [
        [
            'Enter',
            (e) => {
                e.stopPropagation();
                onToggle();
            },
        ],
        [
            'ArrowDown',
            (e) => {
                e.stopPropagation();
                const messages = document.querySelectorAll('[data-shortcut-target="message-container"]');
                if (messages.length) {
                    const firstMessage = messages[0] as HTMLElement;
                    firstMessage.focus();
                }
            },
        ],
    ]);

    return (
        <div
            ref={ref}
            tabIndex={0}
            className="border rounded m-2 mb-4 p-4 flex flex-nowrap items-center justify-space-between trashed-messages outline-none"
            data-shortcut-target="trash-warning"
        >
            <div className="flex flex-nowrap items-center">
                <IcTrash className="mr-4 shrink-0" />
                <span>
                    {inTrash
                        ? c('Info').t`This conversation contains non-trashed messages.`
                        : c('Info').t`This conversation contains trashed messages.`}
                </span>
            </div>
            <InlineLinkButton
                onClick={onToggle}
                className="ml-2 text-underline"
                data-testid="conversation-view:toggle-trash-messages-button"
            >
                {inTrash
                    ? filter
                        ? c('Action').t`Show messages`
                        : c('Action').t`Hide messages`
                    : filter
                      ? c('Action').t`Show messages`
                      : c('Action').t`Hide messages`}
            </InlineLinkButton>
        </div>
    );
};

export default forwardRef(TrashWarning);

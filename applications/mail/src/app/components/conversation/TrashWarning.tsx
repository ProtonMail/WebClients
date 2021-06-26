import React, { forwardRef } from 'react';
import { c } from 'ttag';
import { InlineLinkButton, Icon, useHotkeys } from 'react-components';

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
            tabIndex={-1}
            className="bordered m0-5 mb1 p1 flex flex-nowrap flex-align-items-center flex-justify-space-between trashed-messages no-outline"
            data-shortcut-target="trash-warning"
        >
            <div className="flex flex-nowrap flex-align-items-center">
                <Icon name="trash" className="mr1" />
                <span>
                    {inTrash
                        ? c('Info').t`This conversation contains non-trashed messages.`
                        : c('Info').t`This conversation contains trashed messages.`}
                </span>
            </div>
            <InlineLinkButton onClick={onToggle} className="ml0-5 text-underline">
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

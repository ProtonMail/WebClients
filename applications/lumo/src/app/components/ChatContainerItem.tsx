import React from 'react';

import { clsx } from 'clsx';

type ChatContainerItemProps = {
    className?: string;
    children: React.ReactNode;
};

/**
 * ChatContainerItem - A standard container for chat messages
 * Provides consistent width, margins, and layout for messages
 */
const ChatContainerItem = ({ className, children, ...props }: ChatContainerItemProps) => {
    return (
        <div
            className={clsx(
                'lumo-chat-item flex flex-row flex-nowrap w-full max-w-custom mx-auto reset4print',
                className
            )}
            style={{ '--max-w-custom': '45rem' }}
            {...props}
        >
            {children}
        </div>
    );
};

export default ChatContainerItem;

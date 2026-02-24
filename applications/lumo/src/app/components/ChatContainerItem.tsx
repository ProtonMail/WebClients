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
                'lumo-chat-item reset4print flex flex-row flex-nowrap w-full md:w-2/3 mx-auto max-w-custom',
                className
            )}
            style={{
                '--max-w-custom': '46.5rem',
            }}
            {...props}
        >
            {children}
        </div>
    );
};

export default ChatContainerItem;

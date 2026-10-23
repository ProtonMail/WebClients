import type { ComponentType, Context, ReactNode } from 'react';
import { useState } from 'react';

export interface PublisherProps<T> {
    onValue: (value: T | null) => void;
}

interface Props<T> {
    context: Context<T | null>;
    isEnabled: boolean;
    Publisher: ComponentType<PublisherProps<T>>;
    children: ReactNode;
}

/**
 * Provides the value `Publisher` hands up, and `null` while disabled. `Publisher` is mounted only while
 * enabled, as a sibling of `children`, so toggling never moves or remounts `children`.
 */
export const PublishedProvider = <T,>({ context, isEnabled, Publisher, children }: Props<T>) => {
    const [value, setValue] = useState<T | null>(null);

    return (
        <context.Provider value={isEnabled ? value : null}>
            {isEnabled && <Publisher onValue={setValue} />}
            {children}
        </context.Provider>
    );
};

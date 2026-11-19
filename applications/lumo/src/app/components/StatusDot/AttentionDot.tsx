import { c } from 'ttag';

import type { StatusDotVariant } from './StatusDot';
import { StatusDot } from './StatusDot';

interface Props {
    /** Identifies what is waiting on the user; a new key pops the dot in again. */
    attentionKey: string;
    className?: string;
    label?: string;
    screenReaderOnly?: boolean;
    variant?: StatusDotVariant;
}

function getAttentionLabel(attentionKey: string): string {
    if (attentionKey.startsWith('approval:')) {
        // translator: Read out after a chat's name in the sidebar when Lumo is waiting for the user to allow a tool it wants to use.
        return c('collider_2025:Info').t`Waiting for your approval`;
    }
    // translator: Read out after a chat's name in the sidebar when Lumo asked the user something and is waiting for their answer.
    return c('collider_2025:Info').t`Waiting for your answer`;
}

/** Marks something that waits on the user. */
export const AttentionDot = ({ attentionKey, className, label, screenReaderOnly, variant = 'attention' }: Props) => (
    <>
        {!screenReaderOnly && (
            <StatusDot key={attentionKey} variant={variant} animationKey={attentionKey} className={className} />
        )}
        <span className="sr-only">{label ?? getAttentionLabel(attentionKey)}</span>
    </>
);

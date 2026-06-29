import type { ComponentPropsWithoutRef } from 'react';

import { useEncryptedTextAnimation } from '../../hooks/useEncryptedTextAnimation';

interface EncryptedTextProps extends ComponentPropsWithoutRef<'span'> {
    text: string;
    duration?: number;
}

export const EncryptedText = ({ text, duration, className, ...rest }: EncryptedTextProps) => {
    const { displayText } = useEncryptedTextAnimation(text, { animateOnChange: true, duration });

    return (
        <span className={className} aria-label={text} {...rest}>
            {displayText}
        </span>
    );
};

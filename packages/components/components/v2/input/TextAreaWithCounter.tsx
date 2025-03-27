import { forwardRef } from 'react';

import clsx from '@proton/utils/clsx';

import TextAreaTwo, { type TextAreaTwoProps } from './TextArea';

export type CounterPosition = 'bottom-right' | 'bottom-left';

interface CharacterCountProps {
    currentCount: number;
    maxCount?: number;
    className?: string;
    isOverLimit?: boolean;
    position?: CounterPosition;
}

const CharacterCount = ({
    currentCount,
    maxCount,
    className,
    isOverLimit,
    position = 'bottom-right',
}: CharacterCountProps) => (
    <div
        className={clsx([
            'text-sm',
            position === 'bottom-right' ? 'text-right' : 'text-left',
            isOverLimit ? 'color-danger' : 'color-weak',
            className,
        ])}
    >
        {currentCount}
        {maxCount !== undefined && `/${maxCount}`}
    </div>
);

export interface TextAreaWithCounterProps extends TextAreaTwoProps {
    maxCharacterCount?: number;
    showCharacterCount?: boolean;
    characterCountClassName?: string;
    counterPosition?: CounterPosition;
}

/**
 * TextAreaWithCounter is a component that extends the TextAreaTwo component with a character counter.
 * It allows you to display the character count of the input text.
 *
 * @example
 * <TextAreaWithCounter
 *     maxCharacterCount={128}
 *     showCharacterCount={true}
 *     characterCountClassName="text-sm"
 *     counterPosition="bottom-right"
 * />
 *
 * @param props - Some of the props specific to this component:
 *  - maxCharacterCount: The maximum number of characters allowed in the input.
 *  - showCharacterCount: Whether to show the character count.
 *  - characterCountClassName: The class name for the character count.
 *  - counterPosition: The position of the character count.
 *  - ref: The ref for the TextAreaTwo component.
 *
 * The remaining props are same as the TextAreaTwo component.
 */
const TextAreaWithCounter = forwardRef<HTMLTextAreaElement, TextAreaWithCounterProps>((props, ref) => {
    const {
        maxCharacterCount,
        showCharacterCount = false,
        value = '',
        onChange,
        onValue,
        error,
        characterCountClassName,
        counterPosition = 'bottom-right',
        ...rest
    } = props;

    const currentCharacterCount = typeof value === 'string' ? value.length : 0;
    const isOverLimit = maxCharacterCount !== undefined && currentCharacterCount > maxCharacterCount;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        if (maxCharacterCount !== undefined && newValue.length > maxCharacterCount) {
            return;
        }

        onValue?.(newValue);
        onChange?.(e);
    };

    return (
        <div className="flex flex-column gap-1">
            <TextAreaTwo
                ref={ref}
                value={value}
                error={error || isOverLimit}
                onChange={handleChange}
                maxLength={maxCharacterCount}
                {...rest}
            />
            {showCharacterCount && (
                <CharacterCount
                    currentCount={currentCharacterCount}
                    maxCount={maxCharacterCount}
                    isOverLimit={isOverLimit}
                    className={characterCountClassName}
                    position={counterPosition}
                />
            )}
        </div>
    );
});

export default TextAreaWithCounter;

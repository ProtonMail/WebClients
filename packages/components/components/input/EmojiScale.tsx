import { ChangeEvent, ComponentPropsWithoutRef, useRef } from 'react';
import { c } from 'ttag';

import InputButton, { InputButtonProps } from './InputButton';
import { classnames, concatStringProp, generateUID } from '../../helpers';
import { Tooltip } from '../tooltip';
import ScaleLabel from './ScaleLabel';
import './EmojiScale.scss';

export interface EmojiScaleProps extends Omit<ComponentPropsWithoutRef<'div'>, 'onChange'> {
    fromLabel: string;
    toLabel: string;
    value?: number;
    InputButtonProps?: Partial<InputButtonProps>;
    onChange: (value: number) => void;
}

const scale = [
    { value: 1, emoji: '😫', label: () => c('Label').t`Awful` },
    { value: 2, emoji: '🙁', label: () => c('Label').t`Bad` },
    { value: 3, emoji: '😐', label: () => c('Label').t`OK` },
    { value: 4, emoji: '😊', label: () => c('Label').t`Good` },
    { value: 5, emoji: '😍', label: () => c('Label').t`Wonderful` },
];

const EmojiScale = ({ fromLabel, toLabel, value, InputButtonProps, onChange, className, ...rest }: EmojiScaleProps) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        onChange(Number(e.target.value));
    };

    const { current: scaleFromToId } = useRef(generateUID('scale-from-to'));

    const ariaDescribedBy = concatStringProp([InputButtonProps?.['aria-describedby'], scaleFromToId]);

    return (
        <div className={classnames([className, 'flex flex-column flex-gap-1'])} {...rest}>
            <div className="flex flex-justify-space-between flex-align-items-center">
                {scale.map((option) => (
                    <Tooltip title={option.label()} key={option.value}>
                        <span>
                            <InputButton
                                id={`score-${option.value}`}
                                name="score"
                                type="radio"
                                value={option.value}
                                checked={value === option.value}
                                onChange={handleChange}
                                ButtonLikeProps={{ className: 'emoji-scale_input-button' }}
                                {...InputButtonProps}
                                aria-describedby={ariaDescribedBy}
                            >
                                <span className="emoji-scale_emoji" aria-hidden="true">
                                    {option.emoji}
                                </span>
                                <span className="sr-only">{option.label()}</span>
                            </InputButton>
                        </span>
                    </Tooltip>
                ))}
            </div>
            <ScaleLabel id={scaleFromToId} fromLabel={fromLabel} toLabel={toLabel} />
        </div>
    );
};

export default EmojiScale;

import { ChangeEvent, ComponentPropsWithoutRef } from 'react';
import { c } from 'ttag';

import emojiAwful from '@proton/styles/assets/img/emojis/emoji-awful.svg';
import emojiBad from '@proton/styles/assets/img/emojis/emoji-bad.svg';
import emojiOk from '@proton/styles/assets/img/emojis/emoji-ok.svg';
import emojiGood from '@proton/styles/assets/img/emojis/emoji-good.svg';
import emojiWonderful from '@proton/styles/assets/img/emojis/emoji-wonderful.svg';

import InputButton, { InputButtonProps } from './InputButton';
import { classnames } from '../../helpers';
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
    { value: 1, emoji: emojiAwful, label: () => c('Label').t`Awful` },
    { value: 2, emoji: emojiBad, label: () => c('Label').t`Bad` },
    { value: 3, emoji: emojiOk, label: () => c('Label').t`OK` },
    { value: 4, emoji: emojiGood, label: () => c('Label').t`Good` },
    { value: 5, emoji: emojiWonderful, label: () => c('Label').t`Wonderful` },
];

const EmojiScale = ({ fromLabel, toLabel, value, InputButtonProps, onChange, className, ...rest }: EmojiScaleProps) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        onChange(Number(e.target.value));
    };

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
                            >
                                <img src={option.emoji} alt={option.label()} aria-hidden="true" />
                                <span className="sr-only">{option.label()}</span>
                            </InputButton>
                        </span>
                    </Tooltip>
                ))}
            </div>
            <ScaleLabel fromLabel={fromLabel} toLabel={toLabel} />
        </div>
    );
};

export default EmojiScale;

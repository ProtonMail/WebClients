import type { ChangeEvent, FC, KeyboardEvent, KeyboardEventHandler } from 'react';
import { useEffect, useReducer } from 'react';

import { Button } from '@proton/atoms';
import { Icon, InputFieldTwo } from '@proton/components';
import clsx from '@proton/utils/clsx';

import './IncrementableInput.scss';

type State = {
    value: number;
    disabledDecrement?: boolean;
    disabledIncrement?: boolean;
};

export enum Actions {
    Increment = 'INCREMENT',
    Decrement = 'DECREMENT',
    SetValue = 'SET_VALUE',
}

type Action = { type: Actions.Increment } | { type: Actions.Decrement } | { type: Actions.SetValue; payload: number };

const getInitialState = ({ value }: State): State => ({ value, disabledDecrement: false, disabledIncrement: false });

const reducer =
    (min: number, max: number) =>
    (state: State, action: Action): State => {
        switch (action.type) {
            case Actions.Increment: {
                if (state.value >= max) return { ...state, disabledIncrement: true };

                const newValue = state.value + 1;
                return {
                    ...state,
                    value: newValue,
                    disabledDecrement: false,
                    disabledIncrement: newValue >= max,
                };
            }
            case Actions.Decrement: {
                if (state.value <= min) return { ...state, disabledDecrement: true };

                const newValue = state.value - 1;
                return {
                    ...state,
                    value: newValue,
                    disabledIncrement: false,
                    disabledDecrement: newValue <= min,
                };
            }
            case Actions.SetValue: {
                const { payload } = action;
                return {
                    ...state,
                    value: payload,
                    disabledDecrement: payload <= min,
                    disabledIncrement: payload >= max,
                };
            }
            default:
                return state;
        }
    };

type Props = {
    className?: string;
    disabled?: boolean;
    max?: number;
    min?: number;
    value: number;
    onChange: (value: number) => void;
    onPressEnter?: KeyboardEventHandler<HTMLInputElement>;
};

export const IncrementableInput: FC<Props> = ({
    className,
    disabled,
    max = Number.MAX_SAFE_INTEGER,
    min = Number.MIN_SAFE_INTEGER,
    value = 0,
    onChange,
    onPressEnter,
}) => {
    const [state, dispatch] = useReducer(reducer(min, max), getInitialState({ value }));

    const onDecrement = () => dispatch({ type: Actions.Decrement });
    const onIncrement = () => dispatch({ type: Actions.Increment });

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && onPressEnter) onPressEnter(event);
        if (event.key === 'ArrowDown') onDecrement();
        if (event.key === 'ArrowUp') onIncrement();
    };

    const onChangeValue = ({ target: { value: newValue } }: ChangeEvent<HTMLInputElement>) => {
        const maxReads = parseInt(newValue);
        if (!maxReads || maxReads < min || maxReads > max) return;

        dispatch({ type: Actions.SetValue, payload: maxReads });
    };

    useEffect(() => onChange(state.value), [state.value]);

    return (
        <div className={clsx(['flex flex-nowrap justify-center items-center incrementable-input relative', className])}>
            <Button
                className="bg-weak -mr-8 z-1"
                onClick={onDecrement}
                color="weak"
                shape="solid"
                size="large"
                pill
                disabled={state.disabledDecrement}
            >
                <Icon name="minus" alt="Decrement value" />
            </Button>
            <InputFieldTwo
                rootClassName="flex items-center bg-weak"
                inputClassName="py-0 text-center"
                value={state.value}
                onChange={onChangeValue}
                min={min}
                max={max}
                disabled={disabled}
                onKeyDown={onKeyDown}
                unstyled
                dense
            />
            <Button
                className="bg-weak z-1"
                onClick={onIncrement}
                color="weak"
                shape="solid"
                size="large"
                pill
                disabled={state.disabledIncrement}
            >
                <Icon name="plus" alt="Increment value" />
            </Button>
        </div>
    );
};

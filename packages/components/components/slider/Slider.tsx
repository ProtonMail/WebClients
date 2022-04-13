import {
    ComponentPropsWithoutRef,
    useRef,
    MouseEvent as ReactMouseEvent,
    TouchEvent as ReactTouchEvent,
    useState,
    useLayoutEffect,
    ChangeEvent,
} from 'react';

import { clamp } from '@proton/shared/lib/helpers/math';
import percentage from '@proton/shared/lib/helpers/percentage';

import useSynchronizingState from '../../hooks/useSynchronizingState';
import { classnames } from '../../helpers';
import { usePrevious } from '../../hooks';
import { Icon } from '../icon';
import SliderMark from './SliderMark';
import './Slider.scss';

interface SliderProps extends Omit<ComponentPropsWithoutRef<'input'>, 'value' | 'onChange' | 'onInput'> {
    /**
     * The current value of the Slider. Allows for external control of the Slider.
     */
    value?: number;
    /**
     * The minimum allowed value that can be selected using the Slider
     */
    min?: number;
    /**
     * The maximum allowed value that can be selected using the Slider
     */
    max?: number;
    /**
     * Minimum numeric interval / unit in which the Slider should operate
     */
    step?: number;
    /**
     * Emits the number selected via the Slider on change.
     * Change in this context is defined as the number selected at the
     * moment of the thumb drag ending. (same as `<input type="range" />`)
     */
    onChange?: (value: number) => void;
    /**
     * Same as the onChange prop, however on input instead, defined in
     * this context as any ongoing input to the Slider component even if
     * not considered "ended".
     */
    onInput?: (value: number) => void;
}

const Slider = ({ value, min = 0, max = 100, step, onChange, onInput, ...rest }: SliderProps) => {
    const [internalValue, setInternalValue] = useSynchronizingState(value || min);
    const [dragging, setDragging] = useState(false);

    const rootRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLInputElement>(null);

    const previousDragging = usePrevious(dragging);

    useLayoutEffect(() => {
        if (!previousDragging && dragging) {
            thumbRef.current?.focus();
        }
    }, []);

    const clampInsideInterval = (n: number) => clamp(n || min, min, max);

    const clampedInternalValue = clampInsideInterval(internalValue);

    const interval = max - min;

    const getValueFromXCoordinate = (x: number) => {
        const rootRect = rootRef.current?.getBoundingClientRect();

        if (!rootRect) {
            return NaN;
        }

        const intervalInPx = rootRect.right - rootRect.left;

        const distanceToStart = x - rootRect.left;

        const pxToValueRatio = intervalInPx / interval;

        const valueFromMouseEvent = distanceToStart / pxToValueRatio;

        return min + (step ? Math.round(valueFromMouseEvent / step) * step : valueFromMouseEvent);
    };

    const handleInput = (v: number) => {
        const clamped = clampInsideInterval(v);

        if (!isNaN(Number(clamped))) {
            setInternalValue(clamped);
            onInput?.(clamped);
        }
    };

    const handleCommit = (v: number) => {
        const clamped = clampInsideInterval(v);

        if (!isNaN(Number(clamped))) {
            setInternalValue(clamped);
            onChange?.(clamped);
        }
    };

    const handleXCoordinateInput = (x: number) => {
        handleInput(getValueFromXCoordinate(x));
    };

    const handleXCoordinateCommit = (x: number) => {
        handleCommit(getValueFromXCoordinate(x));
    };

    const handleMouseMove = (e: MouseEvent) => {
        handleXCoordinateInput(e.clientX);
    };

    const handleMouseUp = (e: MouseEvent) => {
        handleXCoordinateCommit(e.clientX);

        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        setDragging(false);
    };

    const handleMouseDown = ({ nativeEvent }: ReactMouseEvent) => {
        handleXCoordinateInput(nativeEvent.clientX);

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        setDragging(true);
    };

    const handleMouseLeave = () => {
        thumbRef.current?.blur();
    };

    const handleTouchMove = (e: TouchEvent) => {
        handleXCoordinateInput(e.touches[0].clientX);
    };

    const handleTouchEnd = (e: TouchEvent) => {
        handleXCoordinateCommit(e.touches[0].clientX);

        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);

        setDragging(false);
    };

    const handleTouchStart = (e: ReactTouchEvent) => {
        handleXCoordinateInput(e.nativeEvent.touches[0].clientX);

        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);

        setDragging(true);
    };

    /* as in handle the onInput event of the <input /> element */
    const handleInputInput = (e: ChangeEvent<HTMLInputElement>) => {
        handleInput(Number(e.target.value));
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        handleCommit(Number(e.target.value));
    };

    const valueInPercent = percentage(interval, clampedInternalValue - min);

    // const styleSliderMarkMin =
    // const sliderMarkMin = getCustomSizingClasses(styleSliderMarkMin);

    return (
        <div ref={rootRef} className="slider relative" onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}>
            <div className="slider-rail" />

            <div style={{ width: `${valueInPercent}%` }} className="slider-track" />

            <SliderMark className="slider-mark-min" aria-hidden="true">
                {min}
            </SliderMark>

            <SliderMark className="slider-mark-max" aria-hidden="true">
                {max}
            </SliderMark>

            <span
                style={{ left: `${valueInPercent}%` }}
                className={classnames(['slider-thumb', dragging && 'slider-thumb-dragging'])}
                onMouseLeave={handleMouseLeave}
            >
                <div
                    className="slider-thumb-tooltip absolute tooltip tooltip--top"
                    style={{ bottom: 'calc(100% + 16px)' }}
                >
                    {clampedInternalValue.toFixed(2)}
                </div>

                <input
                    type="range"
                    ref={thumbRef}
                    min={min}
                    max={max}
                    aria-orientation="horizontal"
                    className="sr-only slider-thumb-input"
                    onChange={handleInputChange}
                    onInput={handleInputInput}
                    {...rest}
                />

                <Icon name="arrows-left-right" />
            </span>
        </div>
    );
};

export default Slider;

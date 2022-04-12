import {
    ComponentPropsWithoutRef,
    useRef,
    MouseEvent as ReactMouseEvent,
    TouchEvent as ReactTouchEvent,
    useState,
} from 'react';

import { clamp } from '@proton/shared/lib/helpers/math';
import percentage from '@proton/shared/lib/helpers/percentage';

import useSynchronizingState from '../../hooks/useSynchronizingState';
import { classnames } from '../../helpers';
import { Icon } from '../icon';
import SliderMark from './SliderMark';
import './Slider.scss';

interface SliderProps extends Omit<ComponentPropsWithoutRef<'input'>, 'value' | 'onChange'> {
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
}

const Slider = ({ value, min = 0, max = 100, step, onChange }: SliderProps) => {
    const [internalValue, setInternalValue] = useSynchronizingState(value || min);
    const [dragging, setDragging] = useState(false);

    const rootRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLButtonElement>(null);

    const clampedInternalValue = clamp(min, max, internalValue || min);

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

    const handleXCoordinateInput = (x: number) => {
        const nextValue = getValueFromXCoordinate(x);

        if (!isNaN(Number(nextValue))) {
            setInternalValue(nextValue);
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        handleXCoordinateInput(e.clientX);
    };

    const handleMouseUp = (e: MouseEvent) => {
        handleXCoordinateInput(e.clientX);

        const nextValue = getValueFromXCoordinate(e.clientX);

        if (!isNaN(Number(nextValue))) {
            onChange?.(nextValue);
        }

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
        const xCoordinate = e.touches[0].clientX;

        handleXCoordinateInput(xCoordinate);

        const nextValue = getValueFromXCoordinate(xCoordinate);

        if (!isNaN(Number(nextValue))) {
            onChange?.(nextValue);
        }

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

    const valueInPercent = percentage(interval, clampedInternalValue - min);

    return (
        <div ref={rootRef} className="slider" onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}>
            <div className="slider-rail" />

            <div style={{ width: `${valueInPercent}%` }} className="slider-track" />

            <SliderMark style={{ left: 0 }}>{min}</SliderMark>

            <SliderMark style={{ left: 'calc(100% - 1px)' }}>{max}</SliderMark>

            <button
                ref={thumbRef}
                style={{ left: `${valueInPercent}%`, position: 'relative' }}
                className={classnames(['slider-thumb', dragging && 'slider-thumb-dragging'])}
                onMouseLeave={handleMouseLeave}
            >
                <div
                    className="slider-thumb-tooltip tooltip tooltip--top"
                    style={{ position: 'absolute', wordBreak: 'initial', bottom: 'calc(100% + 16px)' }}
                >
                    {clampedInternalValue.toFixed(2)}
                </div>

                <Icon name="arrows-left-right" />
            </button>
        </div>
    );
};

export default Slider;

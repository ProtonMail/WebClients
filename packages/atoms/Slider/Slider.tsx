import type {
    ChangeEvent,
    ComponentPropsWithoutRef,
    MouseEvent as ReactMouseEvent,
    TouchEvent as ReactTouchEvent,
} from 'react';
import { useRef, useState } from 'react';

import type { ThemeColorUnion } from '@proton/colors';
import Icon from '@proton/components/components/icon/Icon';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import { useRightToLeft } from '@proton/components/containers/rightToLeft/useRightToLeft';
import useSynchronizingState from '@proton/hooks/useSynchronizingState';
import clamp from '@proton/utils/clamp';
import clsx from '@proton/utils/clsx';
import percentage from '@proton/utils/percentage';

import ButtonLike from '../Button/ButtonLike';
import SliderMark from './SliderMark';

import './Slider.scss';

interface SliderProps extends Omit<ComponentPropsWithoutRef<'input'>, 'value' | 'size' | 'onChange' | 'onInput'> {
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
     * Size of the Slider.
     */
    size?: 'small' | 'medium';
    /**
     * Adds marks to the beginning and end of the Slider's rail indicating
     * min and max values visually.
     */
    marks?: boolean;
    /**
     * Controls the color of the track (filled out portion of the Slider rail)
     * And maybe the color of other things in the future, hehe. #future-proof-docs
     */
    color?: ThemeColorUnion;
    /**
     * Allows for custom formatting of the value that is displayed in the
     * Slider's label. By default, unless `step` is specified the number shown
     * is formatted using Math.round, however internally the actual number can
     * be decimal.
     */
    getDisplayedValue?: (value: number) => number | string;
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

const Slider = ({
    value,
    min = 0,
    max = 100,
    marks = false,
    size = 'medium',
    color = 'success',
    step,
    getDisplayedValue,
    onChange,
    onInput,
    ...rest
}: SliderProps) => {
    const [rtl] = useRightToLeft();
    const [tooltipOpen, setTooltipOpen] = useState(false);
    const [internalValue, setInternalValue] = useSynchronizingState(value || min);
    const [dragging, setDragging] = useState(false);

    const rootRef = useRef<HTMLDivElement>(null);
    const thumbInputRef = useRef<HTMLInputElement>(null);
    /**
     * The "touches" property of the TouchEvent emitted on "touchend" is an empty array
     * (at least in the case of dealing with a single touch). Since we're using touches
     * to computed the value from the clientX of any given touch, we run into a problem
     * where we don't have a value to emit a commit (change) with on touchend.
     *
     * We also don't have access to the current "internalValue" state since our touchend
     * handler dissapears inside document.addEventListener with a stale closure over
     * internalValue.
     *
     * To solve this we manually track the most recent touch event in a mutative,
     * pointer-referenced manner via this react ref and consume it on touchend.
     *
     */
    const latestTouchRef = useRef<TouchEvent | null>(null);

    /**
     * Doesn't fit semantically to have max smaller than min, however this allows
     * it to be technically possible to do. Slider would then start with the higher
     * number and end with the lower number if considered from left-to-right e.g.:
     *
     *  |-----------|
     * 10         -10
     *
     * Without this the component is not functional should min be larger than max.
     * Also potentially useful for dynamic min max props which might accidentally be inverted.
     */
    const clampInsideInterval = min < max ? (n: number) => clamp(n, min, max) : (n: number) => clamp(n, max, min);

    const clampedInternalValue = clampInsideInterval(internalValue);

    const interval = max - min;

    const getValueFromXCoordinate = (x: number) => {
        const rootRect = rootRef.current?.getBoundingClientRect();

        if (!rootRect) {
            return NaN;
        }

        const intervalInPx = rootRect.right - rootRect.left;

        const distanceToStart = rtl ? rootRect.right - x : x - rootRect.left;

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

    const handleStart = (e: ReactMouseEvent | ReactTouchEvent, x: number) => {
        /*
         * Prevents text from being selected while user
         * is mousemoving after a mousedown event.
         *
         * Implementation taken from react material-ui.
         */
        e.preventDefault();

        thumbInputRef.current?.focus();

        handleXCoordinateInput(x);

        setDragging(true);
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

    const handleMouseDown = (e: ReactMouseEvent) => {
        const { nativeEvent } = e;

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        handleStart(e, nativeEvent.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
        latestTouchRef.current = e;

        handleXCoordinateInput(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
        const latestClientXTouch = latestTouchRef.current?.touches[0].clientX;

        /**
         * Since both handleTouchStart & hadleTouchMove set latestTouchRef.current
         * to the most recent touch event, it shouldn't ever be possible for this
         * to actually be undefined. Still I'm not 100% sure a touchend event can't
         * fire without a prior touchstart, so just in case this is a little physical
         * safeguard instead of a typecast.
         */
        if (latestClientXTouch) {
            handleXCoordinateCommit(latestClientXTouch);
        }

        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);

        thumbInputRef.current?.blur();

        setDragging(false);
    };

    const handleTouchStart = (e: ReactTouchEvent) => {
        latestTouchRef.current = e.nativeEvent;

        handleStart(e, e.nativeEvent.touches[0].clientX);

        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);
    };

    /* as in handle the onInput event of the <input /> element */
    const handleInputInput = (e: ChangeEvent<HTMLInputElement>) => {
        handleInput(Number(e.target.value));
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        handleCommit(Number(e.target.value));
    };

    const renderDisplayedValue = () => {
        if (getDisplayedValue) {
            return getDisplayedValue(clampedInternalValue);
        }

        /**
         * If "step" is specified, render the displayed value with
         * padded zeros based on the decimals of the step value.
         * There are no decimals if "step" is an integer to begin with.
         */
        if (step && step !== Math.floor(step)) {
            const [, decimals] = String(step).split('.');

            return clampedInternalValue.toFixed(decimals.length);
        }

        return Math.round(clampedInternalValue);
    };

    const valueInPercent = percentage(interval, clampedInternalValue - min);

    return (
        <div
            dir={rtl ? 'rtl' : 'ltr'}
            ref={rootRef}
            className={clsx('slider', marks && 'slider-marks', size === 'small' && 'slider-small', 'relative')}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
        >
            <div className="slider-rail">
                <div
                    className="slider-track"
                    style={{
                        width: `${valueInPercent}%`,
                        '--track-background': `var(--signal-${color}, var(--interaction-${color}))`,
                    }}
                />
            </div>

            {marks && (
                <>
                    <SliderMark className="slider-mark-min" aria-hidden="true" data-testid="slider-mark-min">
                        {min}
                    </SliderMark>

                    <SliderMark className="slider-mark-max" aria-hidden="true" data-testid="slider-mark-max">
                        {max}
                    </SliderMark>
                </>
            )}

            <Tooltip
                title={renderDisplayedValue()}
                isOpen={tooltipOpen || dragging}
                closeDelay={0}
                openDelay={0}
                updateAnimationFrame={
                    true /* Needed to ensure it's next to the button. Otherwise only updated on title change. */
                }
            >
                <ButtonLike
                    icon
                    color="weak"
                    shape="outline"
                    as="span"
                    style={{ '--left-custom': `${valueInPercent}%` }}
                    data-testid="slider-thumb"
                    className={clsx(
                        'slider-thumb left-custom shadow-norm relative',
                        dragging && 'slider-thumb-dragging'
                    )}
                >
                    <input
                        onFocus={() => {
                            setTooltipOpen(true);
                        }}
                        onBlur={() => {
                            setTooltipOpen(false);
                        }}
                        type="range"
                        ref={thumbInputRef}
                        value={value}
                        min={min}
                        max={max}
                        step={step}
                        aria-valuenow={clampedInternalValue}
                        aria-orientation="horizontal"
                        data-testid="slider-input"
                        className="sr-only slider-thumb-input"
                        onChange={handleInputChange}
                        onInput={handleInputInput}
                        {...rest}
                    />
                    <Icon name="arrows-left-right" />
                </ButtonLike>
            </Tooltip>
        </div>
    );
};

export default Slider;

import { ClockDigit } from './ClockDigit';

import './VintageClock.scss';

// Displays time in HH:MM or MM:SS format. Looks like an old digital clock.
export function VintageClock({
    coarseValue,
    coarseUnit,
    fineValue,
    fineUnit,
}: {
    coarseValue: number;
    coarseUnit?: string;
    fineValue: number;
    fineUnit?: string;
}) {
    const coarseTwoChars = coarseValue.toString().padStart(2, '0');
    const fineTwoChars = fineValue.toString().padStart(2, '0');
    const showUnits = coarseUnit && fineUnit;

    if (showUnits) {
        return (
            <div className="flex gap-0.5 items-start">
                {/* Coarse, e.g. minutes */}
                <div className="flex flex-column gap-1 text-center">
                    <div className="twoDigits">
                        <ClockDigit digit={coarseTwoChars[0]} />
                        <ClockDigit digit={coarseTwoChars[1]} />
                    </div>
                    <span className="color-weak">{coarseUnit}</span>
                </div>
                <div className="text-4xl p-2">:</div>
                {/* Fine, e.g. seconds */}
                <div className="flex flex-column gap-1 text-center">
                    <div className="twoDigits">
                        <ClockDigit digit={fineTwoChars[0]} />
                        <ClockDigit digit={fineTwoChars[1]} />
                    </div>
                    <span className="color-weak">{fineUnit}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="vintageClock">
            <ClockDigit digit={coarseTwoChars[0]} />
            <ClockDigit digit={coarseTwoChars[1]} />

            <div className="text-4xl py-1">:</div>

            <ClockDigit digit={fineTwoChars[0]} />
            <ClockDigit digit={fineTwoChars[1]} />
        </div>
    );
}

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

    return (
        <>
            <div className="vintage-clock">
                <ClockDigit digit={coarseTwoChars[0]} />
                <ClockDigit digit={coarseTwoChars[1]} />

                <div className="text-4xl py-1">:</div>

                <ClockDigit digit={fineTwoChars[0]} />
                <ClockDigit digit={fineTwoChars[1]} />

                {showUnits && (
                    <>
                        <span className="vintage-clock-unit-coarse color-weak text-center">{coarseUnit}</span>
                        <span className="vintage-clock-unit-fine color-weak text-center">{fineUnit}</span>
                    </>
                )}
            </div>
        </>
    );
}

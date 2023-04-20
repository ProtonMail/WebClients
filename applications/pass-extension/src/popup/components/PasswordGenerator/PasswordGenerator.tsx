import type { VFC } from 'react';

import { c, msgid } from 'ttag';

import { Slider } from '@proton/atoms/Slider';
import { Toggle } from '@proton/components';

import { type UsePasswordGeneratorResult, getCharsGroupedByColor } from '../../../shared/hooks/usePasswordGenerator';

import './PasswordGenerator.scss';

export const PasswordGenerator: VFC<UsePasswordGeneratorResult> = ({
    password,
    numberOfChars,
    useSpecialChars,
    setNumberOfChars,
    setUseSpecialChars,
}) => (
    <div className="flex-column flex gap-y-5">
        <div className="mb-4 px-4 py-2 flex flex-align-items-center">
            <span
                className="text-2xl text-center text-break-all text-monospace mauto h-custom"
                style={{ '--height-custom': '72px' }}
            >
                {getCharsGroupedByColor(password)}
            </span>
        </div>

        <div className="flex flex-align-items-center gap-x-2">
            <label htmlFor="password-length" className="w-custom" style={{ '--width-custom': '120px' }}>
                {c('Info').ngettext(msgid`${numberOfChars} character`, `${numberOfChars} characters`, numberOfChars)}
            </label>
            <div className="flex flex-item-fluid">
                <Slider
                    id="password-length"
                    min={4}
                    max={64}
                    step={1}
                    size="small"
                    color="norm"
                    value={numberOfChars}
                    onInput={setNumberOfChars}
                />
            </div>
        </div>

        <div className="flex flex-align-items-center flex-justify-space-between gap-x-2">
            <label htmlFor="special-chars">{c('Label').t`Special characters`}</label>
            <Toggle
                id="special-chars"
                checked={useSpecialChars}
                onChange={() => setUseSpecialChars(!useSpecialChars)}
            />
        </div>
    </div>
);

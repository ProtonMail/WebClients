import { type FC } from 'react';

import { c, msgid } from 'ttag';

import { Slider } from '@proton/atoms';
import { Option, SelectTwo, Toggle } from '@proton/components';
import type { UsePasswordGeneratorResult } from '@proton/pass/hooks/usePasswordGenerator';
import { SeperatorOptions } from '@proton/pass/lib/password/constants';
import type { MemorablePasswordOptions } from '@proton/pass/lib/password/memorable';
import { getSeperatorTranslation } from '@proton/pass/lib/password/memorable';
import clsx from '@proton/utils/clsx';

type Props = UsePasswordGeneratorResult<'memorable'> & { advanced: boolean; dense?: boolean };

export const PasswordMemorableOptions: FC<Props> = ({ advanced, config, dense = false, setPasswordOptions }) => (
    <>
        <div className="flex items-center justify-space-between">
            <label htmlFor="password-word-count" className="w-custom" style={{ '--w-custom': '6.875rem' }}>
                {c('Label').ngettext(
                    msgid`${config.options.wordCount} word`,
                    `${config.options.wordCount} words`,
                    config.options.wordCount
                )}
            </label>
            <div className="flex flex-1">
                <Slider
                    id="password-word-count"
                    min={1}
                    max={10}
                    step={1}
                    size="small"
                    color="norm"
                    value={config.options.wordCount}
                    onInput={(wordCount) => setPasswordOptions('memorable', { wordCount })}
                />
            </div>
        </div>
        {!dense && <hr className="m-0" />}
        <div className="flex items-center justify-space-between">
            <label htmlFor="password-capitalise" className="w-custom" style={{ '--w-custom': '10rem' }}>
                {c('Label').t`Capitalise`}
            </label>
            <Toggle
                id="password-capitalise"
                checked={config.options.capitalize}
                onChange={(e) => setPasswordOptions('memorable', { capitalize: e.target.checked })}
            />
        </div>
        {advanced && (
            <>
                {!dense && <hr className="m-0" />}
                <div className="flex items-center gap-x-2">
                    <label htmlFor="password-seperator" className="shrink-0">
                        {c('Label').t`Type`}
                    </label>
                    <SelectTwo<MemorablePasswordOptions['seperator']>
                        id="password-seperator"
                        value={config.options.seperator}
                        className="pass-password-generator--select border-none flex flex-1 text-rg"
                        onValue={(seperator) => setPasswordOptions('memorable', { seperator })}
                    >
                        {Object.values(SeperatorOptions).map((seperator) => (
                            <Option<MemorablePasswordOptions['seperator']>
                                key={seperator}
                                title={getSeperatorTranslation(seperator)}
                                value={seperator}
                                className={clsx(dense && 'text-sm')}
                                preventScroll
                            />
                        ))}
                    </SelectTwo>
                </div>
                {!dense && <hr className="m-0" />}
                <div className="flex items-center justify-space-between">
                    <label htmlFor="password-extra-numbers" className="w-custom" style={{ '--w-custom': '10rem' }}>
                        {c('Label').t`Include numbers`}
                    </label>

                    <Toggle
                        id="password-extra-numbers"
                        checked={config.options.extraNumbers}
                        onChange={(e) => setPasswordOptions('memorable', { extraNumbers: e.target.checked })}
                    />
                </div>
            </>
        )}
    </>
);

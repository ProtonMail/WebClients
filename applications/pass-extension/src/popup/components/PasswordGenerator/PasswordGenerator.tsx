import type { VFC } from 'react';
import { useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Slider } from '@proton/atoms/Slider';
import { Icon, Option, SelectTwo, Toggle } from '@proton/components/components';
import type { GeneratePasswordOptions } from '@proton/pass/password';
import type { MemorablePasswordOptions } from '@proton/pass/password/memorable';
import { SeperatorOptions, getSeperatorTranslation } from '@proton/pass/password/memorable';

import { type UsePasswordGeneratorResult, getCharsGroupedByColor } from '../../../shared/hooks/usePasswordGenerator';

import './PasswordGenerator.scss';

export const PasswordGenerator: VFC<UsePasswordGeneratorResult> = ({
    password,
    passwordOptions,
    setPasswordOptions,
}) => {
    const [showAdvanced, setShowAdvanced] = useState(false);

    return (
        <div className="flex-column flex gap-y-2">
            <div className="my-4 px-4 py-2 flex flex-align-items-center">
                <span
                    className="text-2xl text-center text-break-all text-monospace m-auto min-h-custom"
                    style={{ '--min-h-custom': '72px' }}
                >
                    {getCharsGroupedByColor(password)}
                </span>
            </div>

            <div className="flex flex-align-items-center gap-x-2">
                <label htmlFor="password-type" className="w-custom" style={{ '--w-custom': '90px' }}>
                    {c('Label').t`Type`}
                </label>
                <SelectTwo<GeneratePasswordOptions['type']>
                    id="password-type"
                    value={passwordOptions.type}
                    className="pass-password-generator--select border-none flex flex-item-fluid"
                    onValue={(type) => setPasswordOptions(type)}
                >
                    <Option title={c('Option').t`Memorable Password`} value="memorable" />
                    <Option title={c('Option').t`Random Password`} value="random" />
                </SelectTwo>
            </div>

            <hr className="m-0" />

            {passwordOptions.type === 'random' && (
                <>
                    <div className="flex flex-align-items-center flex-justify-space-between">
                        <label htmlFor="password-length" className="w-custom" style={{ '--w-custom': '110px' }}>
                            {c('Label').ngettext(
                                msgid`${passwordOptions.options.length} character`,
                                `${passwordOptions.options.length} characters`,
                                passwordOptions.options.length
                            )}
                        </label>
                        <div className="flex flex-item-fluid">
                            <Slider
                                id="password-length"
                                min={4}
                                max={64}
                                step={1}
                                size="small"
                                color="norm"
                                value={passwordOptions.options.length}
                                onInput={(length) => setPasswordOptions('random', { length })}
                            />
                        </div>
                    </div>
                    <hr className="m-0" />
                    <div className="flex flex-align-items-center flex-justify-space-between">
                        <label htmlFor="password-special-chars" className="w-custom" style={{ '--w-custom': '160px' }}>
                            {c('Label').t`Special characters (!&*)`}
                        </label>

                        <Toggle
                            id="password-special-chars"
                            checked={passwordOptions.options.useSpecialChars}
                            onChange={(e) => setPasswordOptions('random', { useSpecialChars: e.target.checked })}
                        />
                    </div>
                    {showAdvanced && (
                        <>
                            <hr className="m-0" />
                            <div className="flex flex-align-items-center flex-justify-space-between">
                                <label
                                    htmlFor="password-capitalise"
                                    className="w-custom"
                                    style={{ '--w-custom': '160px' }}
                                >
                                    {c('Label').t`Capital letters (A-Z)`}
                                </label>

                                <Toggle
                                    id="password-capitalise"
                                    checked={passwordOptions.options.useUppercase}
                                    onChange={(e) => setPasswordOptions('random', { useUppercase: e.target.checked })}
                                />
                            </div>
                            <hr className="m-0" />
                            <div className="flex flex-align-items-center flex-justify-space-between">
                                <label htmlFor="password-digits" className="w-custom" style={{ '--w-custom': '160px' }}>
                                    {c('Label').t`Include numbers (0-9)`}
                                </label>

                                <Toggle
                                    id="password-digits"
                                    checked={passwordOptions.options.useDigits}
                                    onChange={(e) => setPasswordOptions('random', { useDigits: e.target.checked })}
                                />
                            </div>
                        </>
                    )}
                </>
            )}

            {passwordOptions.type === 'memorable' && (
                <>
                    <div className="flex flex-align-items-center flex-justify-space-between">
                        <label htmlFor="password-word-count" className="w-custom" style={{ '--w-custom': '110px' }}>
                            {c('Label').ngettext(
                                msgid`${passwordOptions.options.wordCount} word`,
                                `${passwordOptions.options.wordCount} words`,
                                passwordOptions.options.wordCount
                            )}
                        </label>
                        <div className="flex flex-item-fluid">
                            <Slider
                                id="password-word-count"
                                min={1}
                                max={10}
                                step={1}
                                size="small"
                                color="norm"
                                value={passwordOptions.options.wordCount}
                                onInput={(wordCount) => setPasswordOptions('memorable', { wordCount })}
                            />
                        </div>
                    </div>
                    <hr className="m-0" />
                    <div className="flex flex-align-items-center flex-justify-space-between">
                        <label htmlFor="password-capitalise" className="w-custom" style={{ '--w-custom': '160px' }}>
                            {c('Label').t`Capitalise`}
                        </label>
                        <Toggle
                            id="password-capitalise"
                            checked={passwordOptions.options.capitalize}
                            onChange={(e) => setPasswordOptions('memorable', { capitalize: e.target.checked })}
                        />
                    </div>
                    {showAdvanced && (
                        <>
                            {' '}
                            <hr className="m-0" />
                            <div className="flex flex-align-items-center gap-x-2">
                                <label
                                    htmlFor="password-seperator"
                                    className="w-custom"
                                    style={{ '--w-custom': '90px' }}
                                >
                                    {c('Label').t`Type`}
                                </label>
                                <SelectTwo<MemorablePasswordOptions['seperator']>
                                    id="password-seperator"
                                    value={passwordOptions.options.seperator}
                                    className="pass-password-generator--select border-none flex flex-item-fluid"
                                    onValue={(seperator) => setPasswordOptions('memorable', { seperator })}
                                >
                                    {Object.values(SeperatorOptions).map((seperator) => (
                                        <Option<MemorablePasswordOptions['seperator']>
                                            key={seperator}
                                            title={getSeperatorTranslation(seperator)}
                                            value={seperator}
                                        />
                                    ))}
                                </SelectTwo>
                            </div>
                            <hr className="m-0" />
                            <div className="flex flex-align-items-center flex-justify-space-between">
                                <label
                                    htmlFor="password-extra-numbers"
                                    className="w-custom"
                                    style={{ '--w-custom': '160px' }}
                                >
                                    {c('Label').t`Include numbers`}
                                </label>

                                <Toggle
                                    id="password-extra-numbers"
                                    checked={passwordOptions.options.extraNumbers}
                                    onChange={(e) =>
                                        setPasswordOptions('memorable', { extraNumbers: e.target.checked })
                                    }
                                />
                            </div>
                        </>
                    )}
                </>
            )}

            <hr className="m-0" />

            <div className="flex flex-justify-end">
                <Button shape="ghost" onClick={() => setShowAdvanced((advanced) => !advanced)}>
                    <span className="flex flex-align-items-center color-weak text-sm">
                        <Icon name={showAdvanced ? 'cross' : 'cog-wheel'} className="mr-1" />
                        {showAdvanced ? c('Action').t`Close advanced options` : c('Action').t`Advanced options`}
                    </span>
                </Button>
            </div>
        </div>
    );
};

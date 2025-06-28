import { type FC } from 'react';

import { c, msgid } from 'ttag';

import { Slider, SliderSizeEnum } from '@proton/atoms';
import { Option, SelectTwo, Toggle } from '@proton/components';
import { OrganizationPolicyTooltip } from '@proton/pass/components/Organization/OrganizationPolicyTooltip';
import type { PasswordGeneratorResult } from '@proton/pass/hooks/usePasswordGenerator';
import { getSeperatorTranslation } from '@proton/pass/lib/password/memorable';
import type { MemorablePasswordOptions } from '@proton/pass/lib/password/types';
import { SeperatorOptions } from '@proton/pass/lib/password/types';
import { oneOf } from '@proton/pass/utils/fp/predicates';
import clsx from '@proton/utils/clsx';

type Props = PasswordGeneratorResult<'memorable'> & { advanced: boolean; dense?: boolean };

export const PasswordMemorableOptions: FC<Props> = ({
    advanced,
    config,
    dense = false,
    policy = null,
    setPasswordOptions,
}) => {
    const capitalizePolicyEnforced = typeof policy?.MemorablePasswordMustCapitalize === 'boolean';
    const numbersPolicyEnforced = typeof policy?.MemorablePasswordMustIncludeNumbers === 'boolean';

    return (
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
                        min={policy?.MemorablePasswordMinWords ?? 1}
                        max={policy?.MemorablePasswordMaxWords ?? 10}
                        step={1}
                        size={SliderSizeEnum.Small}
                        color="norm"
                        value={config.options.wordCount}
                        onInput={(wordCount) => setPasswordOptions('memorable', { wordCount })}
                    />
                </div>
            </div>
            {!dense && <hr className="m-0" />}
            <OrganizationPolicyTooltip enforced={capitalizePolicyEnforced}>
                <div className="flex items-center justify-space-between">
                    <label htmlFor="password-capitalise" className="w-custom" style={{ '--w-custom': '10rem' }}>
                        {c('Label').t`Capitalize`}
                    </label>
                    <Toggle
                        id="password-capitalise"
                        checked={config.options.capitalize}
                        onChange={(e) => setPasswordOptions('memorable', { capitalize: e.target.checked })}
                        disabled={capitalizePolicyEnforced}
                    />
                </div>
            </OrganizationPolicyTooltip>
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
                                    disabled={
                                        oneOf(SeperatorOptions.NUMBER, SeperatorOptions.NUMBER_OR_SYMBOL)(seperator) &&
                                        policy?.MemorablePasswordMustIncludeNumbers === false
                                    }
                                />
                            ))}
                        </SelectTwo>
                    </div>
                    {!dense && <hr className="m-0" />}
                    <OrganizationPolicyTooltip enforced={numbersPolicyEnforced}>
                        <div className="flex items-center justify-space-between">
                            <label
                                htmlFor="password-extra-numbers"
                                className="w-custom"
                                style={{ '--w-custom': '10rem' }}
                            >
                                {c('Label').t`Include numbers`}
                            </label>

                            <Toggle
                                id="password-extra-numbers"
                                checked={config.options.extraNumbers}
                                onChange={(e) => setPasswordOptions('memorable', { extraNumbers: e.target.checked })}
                                disabled={numbersPolicyEnforced}
                            />
                        </div>
                    </OrganizationPolicyTooltip>
                </>
            )}
        </>
    );
};

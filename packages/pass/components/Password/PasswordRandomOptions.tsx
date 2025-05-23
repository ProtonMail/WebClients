import { type FC } from 'react';

import { c, msgid } from 'ttag';

import { Slider, SliderSizeEnum } from '@proton/atoms';
import Toggle from '@proton/components/components/toggle/Toggle';
import { OrganizationPolicyTooltip } from '@proton/pass/components/Organization/OrganizationPolicyTooltip';
import type { PasswordGeneratorResult } from '@proton/pass/hooks/usePasswordGenerator';

type Props = PasswordGeneratorResult<'random'> & { advanced: boolean; dense?: boolean };

export const PasswordRandomOptions: FC<Props> = ({
    advanced,
    config,
    dense = false,
    policy = null,
    setPasswordOptions,
}) => {
    const symbolsPolicyEnforced = typeof policy?.RandomPasswordMustIncludeSymbols === 'boolean';
    const uppercasePolicyEnforced = typeof policy?.RandomPasswordMustIncludeUppercase === 'boolean';
    const numbersPolicyEnforced = typeof policy?.RandomPasswordMustIncludeNumbers === 'boolean';

    return (
        <>
            <div className="flex items-center justify-space-between">
                <label htmlFor="password-length" className="w-custom" style={{ '--w-custom': '6.875rem' }}>
                    {c('Label').ngettext(
                        msgid`${config.options.length} character`,
                        `${config.options.length} characters`,
                        config.options.length
                    )}
                </label>
                <div className="flex flex-1">
                    <Slider
                        id="password-length"
                        min={policy?.RandomPasswordMinLength ?? 4}
                        max={policy?.RandomPasswordMaxLength ?? 64}
                        step={1}
                        size={SliderSizeEnum.Small}
                        color="norm"
                        value={config.options.length}
                        onInput={(length) => setPasswordOptions('random', { length })}
                    />
                </div>
            </div>
            {!dense && <hr className="m-0" />}
            <OrganizationPolicyTooltip enforced={symbolsPolicyEnforced}>
                <div className="flex items-center justify-space-between">
                    <label htmlFor="password-special-chars" className="w-custom" style={{ '--w-custom': '10rem' }}>
                        {c('Label').t`Special characters (!&*)`}
                    </label>

                    <Toggle
                        id="password-special-chars"
                        checked={config.options.useSpecialChars}
                        onChange={(e) => setPasswordOptions('random', { useSpecialChars: e.target.checked })}
                        disabled={symbolsPolicyEnforced}
                    />
                </div>
            </OrganizationPolicyTooltip>
            {advanced && (
                <>
                    {!dense && <hr className="m-0" />}
                    <OrganizationPolicyTooltip enforced={uppercasePolicyEnforced}>
                        <div className="flex items-center justify-space-between">
                            <label htmlFor="password-capitalise" className="w-custom" style={{ '--w-custom': '10rem' }}>
                                {c('Label').t`Capital letters (A-Z)`}
                            </label>

                            <Toggle
                                id="password-capitalise"
                                checked={config.options.useUppercase}
                                onChange={(e) => setPasswordOptions('random', { useUppercase: e.target.checked })}
                                disabled={uppercasePolicyEnforced}
                            />
                        </div>
                    </OrganizationPolicyTooltip>
                    {!dense && <hr className="m-0" />}
                    <OrganizationPolicyTooltip enforced={numbersPolicyEnforced}>
                        <div className="flex items-center justify-space-between">
                            <label htmlFor="password-digits" className="w-custom" style={{ '--w-custom': '10rem' }}>
                                {c('Label').t`Include numbers (0-9)`}
                            </label>

                            <Toggle
                                id="password-digits"
                                checked={config.options.useDigits}
                                onChange={(e) => setPasswordOptions('random', { useDigits: e.target.checked })}
                                disabled={numbersPolicyEnforced}
                            />
                        </div>
                    </OrganizationPolicyTooltip>
                </>
            )}
        </>
    );
};

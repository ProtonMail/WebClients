import { type ComponentPropsWithoutRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useNotifications from '@proton/components/hooks/useNotifications';
import {
    IcArrowsRotate,
    IcCheckmark,
    IcPassShieldFillDanger,
    IcPassShieldFillSuccess,
    IcPassShieldFillWarning,
    IcSquares,
} from '@proton/icons';
import { MIN_PASSWORD_LENGTH } from '@proton/shared/lib/constants';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

import empty from './illustrations/empty.svg';
import strong from './illustrations/strong.svg';
import vulnerable from './illustrations/vulnerable.svg';
import weak from './illustrations/weak.svg';
import type {
    ConsolidatedPasswordPenalties,
    PasswordPenalties,
    PasswordScore,
    PasswordStrengthIndicatorVariant,
} from './interface';

import './PasswordStrengthIndicator.scss';

const BETTER_PASSWORD_LENGTH = 12;

export interface PasswordStrengthIndicatorProps extends ComponentPropsWithoutRef<'div'> {
    variant: PasswordStrengthIndicatorVariant;
    score: PasswordScore;
    penalties?: Set<PasswordPenalties>;
    password: string;
    onGeneratePassword?: () => void;
    generatedPassword?: string;
    rootClassName?: string;
    showIllustration?: boolean;
    showGeneratePasswordButton?: boolean;
}

const getLayout = (type: PasswordScore, emptyPassword: boolean) => {
    if (emptyPassword) {
        return {
            valueShort: '',
            valueMedium: c('Label').t`Password strength`,
            valueLong: c('Label').t`Must have at least ${MIN_PASSWORD_LENGTH} characters`,
            iconSmall: <></>,
            iconLarge: <img src={empty} alt="" />,
            className: 'password-strength-indicator--empty',
        };
    }
    if (type === 'Strong') {
        return {
            valueShort: c('Label').t`Strong`,
            valueMedium: c('Label').t`Strong password`,
            valueLong: c('Label').t`Strong password`,
            iconSmall: <IcPassShieldFillSuccess className="shrink-0" />,
            iconLarge: <img src={strong} alt="" />,
            className: 'password-strength-indicator--strong',
        };
    }
    if (type === 'Weak') {
        return {
            valueShort: c('Label').t`Weak`,
            valueMedium: c('Label').t`Weak password`,
            valueLong: c('Label').t`Weak password`,
            iconSmall: <IcPassShieldFillWarning className="shrink-0" />,
            iconLarge: <img src={weak} alt="" />,
            className: 'password-strength-indicator--weak',
        };
    }
    return {
        valueShort: c('Label').t`Vulnerable`,
        valueMedium: c('Label').t`Vulnerable password`,
        valueLong: c('Label').t`Vulnerable password`,
        iconSmall: <IcPassShieldFillDanger className="shrink-0" />,
        iconLarge: <img src={vulnerable} alt="" />,
        className: 'password-strength-indicator--vulnerable',
    };
};

function getPenaltyDescription(penalty: ConsolidatedPasswordPenalties): string {
    switch (penalty) {
        case 'NoLowercaseOrUppercase':
            return c('Info').t`Uppercase and lowercase letters`;
        case 'NoNumbers':
            return c('Info').t`Numbers`;
        case 'NoSymbols':
            return c('Info').t`Symbols (#$&)`;
        case 'Short':
            return c('Info').t`At least ${BETTER_PASSWORD_LENGTH} characters`;
        default:
            return '';
    }
}

const isLongEnough = (password: string) => password.length >= BETTER_PASSWORD_LENGTH;

const allPenalties: ConsolidatedPasswordPenalties[] = ['Short', 'NoLowercaseOrUppercase', 'NoNumbers', 'NoSymbols'];

const copyPasswordPenalties: ConsolidatedPasswordPenalties[] = ['Short', 'NoNumbers', 'NoSymbols'];

const consolidatePenalties = (
    password: string,
    penalties: Set<PasswordPenalties> | undefined
): Set<ConsolidatedPasswordPenalties> => {
    if (!penalties || !password) {
        return new Set(allPenalties);
    }

    const result = new Set<ConsolidatedPasswordPenalties>();

    if (!isLongEnough(password)) {
        result.add('Short');
    }

    copyPasswordPenalties.forEach((value) => {
        if (penalties.has(value as any)) {
            result.add(value);
        }
    });

    if (penalties.has('NoLowercase') || penalties.has('NoUppercase')) {
        result.add('NoLowercaseOrUppercase');
    }

    return result;
};

const IndicatorBars = () => (
    <div className="password-strength-indicator-bars flex flex-1 flex-nowrap gap-1 items-center" aria-hidden="true">
        <span className="flex-1 rounded"></span>
        <span className="flex-1 rounded"></span>
        <span className="flex-1 rounded"></span>
    </div>
);

interface GeneratePasswordProps {
    onGeneratePassword: () => void;
    generatedPassword?: string;
}

const GeneratePassword = ({ onGeneratePassword, generatedPassword }: GeneratePasswordProps) => {
    const { createNotification } = useNotifications();

    const handleGeneratePassword = () => {
        onGeneratePassword();
    };

    const handleCopy = () => {
        textToClipboard(generatedPassword);
        createNotification({
            text: c('Info').t`Password copied to clipboard`,
        });
    };

    return (
        <div className="flex justify-center mt-6">
            {generatedPassword ? (
                <InputFieldTwo
                    label={c('Label').t`Strong password`}
                    labelContainerClassName="text-normal text-sm color-weak"
                    inputClassName="text-monospace color-weak"
                    value={generatedPassword}
                    suffix={
                        <>
                            <Tooltip title={c('Action').t`Create new password`}>
                                <Button icon size="small" shape="ghost" onClick={handleGeneratePassword}>
                                    <IcArrowsRotate className="shrink-0" />
                                </Button>
                            </Tooltip>
                            <Tooltip title={c('Action').t`Copy password`}>
                                <Button icon size="small" shape="ghost" onClick={handleCopy}>
                                    <IcSquares className="shrink-0" />
                                </Button>
                            </Tooltip>
                        </>
                    }
                />
            ) : (
                <Button shape="outline" color="norm" size="small" onClick={handleGeneratePassword}>
                    <IcArrowsRotate className="shrink-0 mr-2" />
                    {c('Action').t`Generate password`}
                </Button>
            )}
        </div>
    );
};

const BasePasswordStrengthIndicator = ({
    variant,
    score,
    penalties,
    password,
    onGeneratePassword,
    generatedPassword,
    rootClassName,
    showIllustration,
    showGeneratePasswordButton,
}: PasswordStrengthIndicatorProps) => {
    const { className, iconSmall, iconLarge, valueShort, valueMedium, valueLong } = getLayout(score, !password);
    const unmetPenalties = consolidatePenalties(password, penalties);

    const isCompact = variant === 'compact';
    const isLarge = variant === 'large';
    const isStrengthOnly = variant === 'strengthOnly';

    return (
        <div className={clsx('password-strength-indicator w-full', isLarge && 'flex items-center', rootClassName)}>
            <div
                className={clsx(
                    'w-full flex flex-nowrap mb-1',
                    isCompact && 'gap-2 mb-2',
                    isLarge && 'flex-column mb-4',
                    isStrengthOnly && 'flex-column mb-4 gap-1',
                    className
                )}
            >
                {isLarge && (
                    <>
                        {showIllustration && (
                            <div className="flex">
                                <span className="mx-auto mt-8 mb-6">{iconLarge}</span>
                            </div>
                        )}
                        <p className="mt-0 mb-2 text-semibold">{valueLong}</p>
                    </>
                )}

                {isStrengthOnly && (
                    <>
                        {showIllustration && (
                            <div className="flex">
                                <span className="mx-auto mt-8 mb-6">{iconLarge}</span>
                            </div>
                        )}
                        <span className="flex flex-nowrap gap-1 items-center w-full text-sm text-bold">
                            {valueMedium}
                        </span>
                    </>
                )}

                <IndicatorBars />

                {isCompact && (
                    <span className="flex flex-nowrap gap-1 items-center justify-end min-w-1/3 sm:min-w-1/4 text-right password-strength-indicator-value h-4 text-sm">
                        {iconSmall}
                        {valueShort}
                    </span>
                )}
            </div>
            {!isStrengthOnly && (
                <div>
                    <h4 className={clsx('mt-0 mb-1', isCompact && 'text-sm', isLarge && 'text-rg')}>
                        {c('Info').t`It's better to have:`}
                    </h4>
                    <ul className={clsx('unstyled flex flex-column gap-1 m-0', isCompact && 'text-sm')}>
                        {allPenalties.map((penalty) => {
                            const isPassed = !unmetPenalties.has(penalty);

                            return (
                                <li
                                    key={penalty}
                                    className={clsx('flex flex-nowrap gap-2', isPassed && 'text-strike color-hint')}
                                >
                                    <span className={clsx('w-4 p-px shrink-0', isLarge && 'mt-0.5')}>
                                        <span
                                            className={clsx(
                                                'flex items-center justify-center border rounded-full ratio-square password-strength-indicator-checkmark',
                                                isPassed && 'border-primary'
                                            )}
                                        >
                                            {isPassed && (
                                                <IcCheckmark
                                                    className="shrink-0 color-primary scale-fade-in"
                                                    size={3}
                                                />
                                            )}
                                        </span>
                                    </span>
                                    <span>{getPenaltyDescription(penalty)}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
            {showGeneratePasswordButton && onGeneratePassword && (
                <GeneratePassword onGeneratePassword={onGeneratePassword} generatedPassword={generatedPassword} />
            )}
        </div>
    );
};

export default BasePasswordStrengthIndicator;

import Input, { Props } from './Input';

/**
 * The two-factor input needs to support recovery codes and totp codes.
 * e.g. 0fac27c3 and 505037.
 */
const TwoFactorInput = ({ value, onChange, maxLength = 8, ...rest }: Props) => {
    return (
        <Input
            value={value}
            autoComplete="one-time-code"
            inputMode="numeric"
            onChange={onChange}
            maxLength={maxLength}
            {...rest}
        />
    );
};

export default TwoFactorInput;

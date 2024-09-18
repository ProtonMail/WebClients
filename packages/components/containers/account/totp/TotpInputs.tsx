import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';

import { InputFieldTwo, TotpInput } from '../../../components';

interface Props {
    type: 'totp' | 'recovery-code';
    code: string;
    error: string;
    loading?: boolean;
    bigger?: boolean;
    setCode: (value: string) => void;
}

const TotpInputs = ({ code, type, setCode, error, loading, bigger }: Props) => {
    return (
        <>
            {type === 'totp' && (
                <>
                    <div className="mb-6">{c('Info').t`Enter the code from your authenticator app`}</div>
                    <InputFieldTwo
                        id="totp"
                        as={TotpInput}
                        key="totp"
                        length={6}
                        error={error}
                        disableChange={loading}
                        autoFocus
                        autoComplete="one-time-code"
                        value={code}
                        onValue={setCode}
                    />
                </>
            )}
            {type === 'recovery-code' && (
                <>
                    <div className="mb-6 flex items-center">
                        {c('Info').t`Each code can only be used once`}{' '}
                        <Info
                            className="ml-2"
                            title={c('Info')
                                .t`When you set up two-factor authentication, we provide recovery codes which you can use to sign in if you lose access to your authenticator app.`}
                        />
                    </div>
                    <InputFieldTwo
                        type="text"
                        id="recovery-code"
                        key="recovery-code"
                        autoComplete="off"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck="false"
                        error={error}
                        disableChange={loading}
                        autoFocus
                        value={code}
                        onValue={setCode}
                        bigger={bigger}
                    />
                </>
            )}
        </>
    );
};
export default TotpInputs;

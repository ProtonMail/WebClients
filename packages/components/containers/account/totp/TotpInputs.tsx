import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import TotpInput from '@proton/components/components/v2/input/TotpInput';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

interface TotpInputFieldProps {
    code: string;
    error: string;
    loading?: boolean;
    setCode: (value: string) => void;
}

export const TotpInputField = ({ error, loading, code, setCode }: TotpInputFieldProps) => {
    return (
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
    );
};

interface TotpRecoveryCodeInputFieldProps {
    code: string;
    error: string;
    loading?: boolean;
    bigger?: boolean;
    setCode: (value: string) => void;
}

export const TotpRecoveryCodeInputField = ({
    code,
    setCode,
    error,
    loading,
    bigger,
}: TotpRecoveryCodeInputFieldProps) => {
    const learnMoreLink = (
        <Href key="learn" href={getKnowledgeBaseUrl('/lost-two-factor-authentication-2fa')}>
            {c('Link').jt`Learn more`}
        </Href>
    );
    return (
        <>
            <div className="mb-4">
                {c('Info')
                    .jt`If you lost access to your authenticator app, you can use 1 of the 16 backup recovery codes provided when your set up two-factor authentication. ${learnMoreLink}`}
            </div>
            <InputFieldTwo
                label={c('Info').t`Enter code`}
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
                assistiveText={c('Info').t`Each code can only be used once`}
            />
        </>
    );
};

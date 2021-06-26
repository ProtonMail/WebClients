import { useConfig, useApi } from '@proton/components';
import { queryCheckVerificationCode, queryVerificationCode } from '@proton/shared/lib/api/user';

const useVerification = () => {
    const api = useApi();
    const { CLIENT_TYPE } = useConfig();
    const requestCode = ({ Type, Destination }) => api(queryVerificationCode(Type, Destination));

    const verify = async (code, { Type: TokenType, Destination }) => {
        const Token = `${Destination.Phone || Destination.Address}:${code}`;
        const verificationToken = { Token, TokenType };
        await api(queryCheckVerificationCode(Token, TokenType, CLIENT_TYPE));
        return verificationToken;
    };

    return { verify, requestCode };
};

export default useVerification;

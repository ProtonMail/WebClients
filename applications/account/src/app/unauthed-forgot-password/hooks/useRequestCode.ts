import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import type { AutoResetTokenPayload } from '@proton/shared/lib/api/reset';
import { requestLoginResetToken } from '@proton/shared/lib/api/reset';

export const useRequestCode = ({
    method,
    username,
    onSuccess,
    onError,
}: {
    method: 'email' | 'phone';
    username: string;
    onSuccess: () => void;
    onError: (error: any) => void;
}): (() => Promise<void>) => {
    const silentApi = useSilentApi();

    return async () => {
        try {
            await silentApi(requestLoginResetToken<AutoResetTokenPayload>({ Username: username, Method: method }));
            return onSuccess();
        } catch (error) {
            onError(error);
        }
    };
};

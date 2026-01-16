import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import StandardLoadErrorPage from '@proton/components/containers/app/StandardLoadErrorPage';
import { wrapUnloadError } from '@proton/components/containers/app/errorRefresh';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';

interface Props {
    children: ReactNode;
    onEffect: () => Promise<void>;
}

const AccountEffect = ({ children, onEffect }: Props) => {
    const [error, setError] = useState<{ message?: string } | null>(null);

    useEffect(() => {
        wrapUnloadError(onEffect()).catch((error) => {
            setError({
                message: getNonEmptyErrorMessage(error),
            });
        });
    }, []);

    if (error) {
        return <StandardLoadErrorPage errorMessage={error.message} />;
    }

    return children;
};

export default AccountEffect;

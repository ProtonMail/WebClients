import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import Icon from '@proton/components/components/icon/Icon';
import physicalKey from '@proton/styles/assets/img/illustrations/physical-key.svg';

interface Props {
    loading?: boolean;
    error?: boolean;
    checkbox: ReactNode;
}

const RegisterSecurityKeyContent = ({ loading, error, checkbox }: Props) => {
    return (
        <>
            <div className="flex justify-center mt-4 mb-6 relative">
                {loading && (
                    <div className="text-center absolute inset-center">
                        <CircleLoader className="color-primary" />
                    </div>
                )}
                <img
                    className={loading ? 'visibility-hidden' : undefined}
                    src={physicalKey}
                    alt={c('fido2: Info').t`Security key`}
                />
            </div>
            <div>{c('fido2: Info').t`Insert your security key into your device's USB port.`}</div>
            {checkbox && <div className="mt-2">{checkbox}</div>}
            {error && (
                <div className="mt-4">
                    <Banner className="mb-3" variant="norm" icon={<Icon name="exclamation-circle" />}>
                        {c('fido2: Error').t`Something went wrong registering your security key. Please try again.`}
                    </Banner>
                </div>
            )}
        </>
    );
};

export default RegisterSecurityKeyContent;

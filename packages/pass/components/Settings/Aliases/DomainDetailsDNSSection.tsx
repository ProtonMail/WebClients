import { type FC, type PropsWithChildren } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import { Alert } from '@proton/components/index';
import clsx from '@proton/utils/clsx';

export type Props = {
    isVerified: boolean;
    onVerify: () => void;
    title: string;
    disabled?: boolean;
    errorMessages?: string[];
    loading?: boolean;
};

export const DomainDetailsDNSSection: FC<PropsWithChildren<Props>> = ({
    children,
    errorMessages,
    isVerified,
    onVerify,
    title,
    disabled,
    loading,
}) => {
    return (
        <>
            <div className={clsx(disabled && 'opacity-30')}>
                <h5 className="text-bold mb-3">
                    {title} {isVerified ? '✅' : '🚫'}
                </h5>
                <div className="mb-3">{children}</div>
                {errorMessages &&
                    errorMessages.map((error) => (
                        <Alert type="error" key={error} className="mb-3 color-danger">
                            {error}
                        </Alert>
                    ))}
            </div>
            <Button
                color="norm"
                shape="solid"
                onClick={onVerify}
                disabled={disabled}
                loading={loading}
                className="mb-5"
            >
                {isVerified ? c('Action').t`Re-verify` : c('Action').t`Verify`}
            </Button>
            <hr />
        </>
    );
};

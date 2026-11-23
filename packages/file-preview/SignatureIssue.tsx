import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { IcLockExclamationFilled } from '@proton/icons/icons/IcLockExclamationFilled';

const SignatureIssue = ({
    signatureConfirmation,
    onClick,
}: {
    signatureConfirmation: ReactNode;
    onClick: () => void;
}) => {
    const { viewportWidth } = useActiveBreakpoint();

    return (
        <div className="file-preview-container">
            <div className="absolute inset-center w-full">
                <div
                    className="mx-auto w-custom"
                    style={{ '--w-custom': viewportWidth['<=small'] ? '18.75rem' : '31.25rem' }}
                >
                    <div className="text-center">
                        <IcLockExclamationFilled size={15} className="color-danger" />
                    </div>
                    <div className="mt-4 mb-8 text-center">{signatureConfirmation}</div>
                </div>
                <div className="text-center">
                    <Button
                        color="norm"
                        size={!viewportWidth['<=small'] ? 'large' : undefined}
                        className="text-bold"
                        onClick={onClick}
                    >
                        {c('Action').t`Show preview`}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SignatureIssue;

import { ReactNode } from 'react';

import { c } from 'ttag';

import { Icon, PrimaryButton } from '../../components';
import { useActiveBreakpoint } from '../../hooks';

const SignatureIssue = ({
    signatureConfirmation,
    onClick,
}: {
    signatureConfirmation: ReactNode;
    onClick: () => void;
}) => {
    const { isNarrow } = useActiveBreakpoint();

    return (
        <div className="file-preview-container">
            <div className="absolute-center w-full">
                <div className="mx-auto w-custom" style={{ '--w-custom': isNarrow ? '18.75rem' : '31.25rem' }}>
                    <div className="text-center">
                        <Icon name="lock-exclamation-filled" size={60} className="color-danger" />
                    </div>
                    <div className="mt-4 mb-8">{signatureConfirmation}</div>
                </div>
                <div className="text-center">
                    <PrimaryButton size={!isNarrow ? 'large' : undefined} className="text-bold" onClick={onClick}>
                        {c('Action').t`Show preview`}
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );
};

export default SignatureIssue;

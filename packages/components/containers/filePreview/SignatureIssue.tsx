import { ReactNode } from 'react';
import { c } from 'ttag';

import { classnames } from '../../helpers';
import { useActiveBreakpoint } from '../../hooks';
import { PrimaryButton, Icon } from '../../components';

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
            <div className="absolute-center w100">
                <div className={classnames(['mlauto mrauto', isNarrow ? 'w300p' : 'w500p'])}>
                    <div className="text-center">
                        <Icon name="lock-triangle-exclamation-filled" size={60} className="color-danger" />
                    </div>
                    <div className="mt1 mb2">{signatureConfirmation}</div>
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

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import googleLogo from '@proton/styles/assets/img/import/providers/google.svg';
import clsx from '@proton/utils/clsx';

interface Props {
    label?: string;
    className?: string;
    disabled?: boolean;
    onClick: () => void;
}

const GoogleButton = ({ className, disabled, onClick, label }: Props) => {
    return (
        <Button
            className={clsx(['inline-flex justify-center', className])}
            disabled={disabled}
            onClick={onClick}
            data-testid="OAuthImportButton:button:google"
        >
            <img src={googleLogo} className="mr-2 flex-align-self-center" alt="" />
            {label ?? c('Action').t`Continue with Google`}
        </Button>
    );
};

export default GoogleButton;

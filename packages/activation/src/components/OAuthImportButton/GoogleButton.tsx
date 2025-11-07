import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import googleLogo from '@proton/styles/assets/img/import/providers/google.svg';
import clsx from '@proton/utils/clsx';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';

interface Props {
    label?: string;
    className?: string;
    disabled?: boolean;
    onClick: () => void;
    isDropdownButton?: boolean;
}

const GoogleButton = ({ className, disabled, onClick, label, isDropdownButton }: Props) => {
    const ButtonLayout = isDropdownButton ? DropdownMenuButton : Button;

    return (
        <ButtonLayout
            className={clsx(['inline-flex justify-center', className])}
            disabled={disabled}
            onClick={onClick}
            data-testid="OAuthImportButton:button:google"
        >
            <img src={googleLogo} className="mr-2 self-center" alt="" />
            {label ?? c('Action').t`Continue with Google`}
        </ButtonLayout>
    );
};

export default GoogleButton;

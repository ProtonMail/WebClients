import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import outlookLogo from '@proton/styles/assets/img/import/providers/outlook.svg';
import clsx from '@proton/utils/clsx';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';

interface Props {
    className?: string;
    disabled?: boolean;
    label?: string;
    onClick: () => void;
    isDropdownButton?: boolean;
}

const OutlookButton = ({ className, disabled, onClick, label, isDropdownButton }: Props) => {
    const ButtonLayout = isDropdownButton ? DropdownMenuButton : Button;

    return (
        <ButtonLayout
            className={clsx(['inline-flex justify-center', className])}
            disabled={disabled}
            onClick={onClick}
            data-testid="OAuthImportButton:button:outlook"
        >
            <img
                alt=""
                src={outlookLogo}
                className="mr-2 w-custom self-center"
                style={{ '--w-custom': '18px' }}
            />
            {label ?? c('Action').t`Continue with Outlook`}
        </ButtonLayout>
    );
};

export default OutlookButton;

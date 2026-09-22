import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import googleDriveLogo from '@proton/styles/assets/img/import/providers/google-drive.svg';
import clsx from '@proton/utils/clsx';

interface Props {
    label?: string;
    className?: string;
    disabled?: boolean;
    onClick: () => void;
}

const GoogleDriveButton = ({ className, disabled, onClick, label }: Props) => {
    return (
        <Button
            shape="outline"
            color="weak"
            className={clsx(['inline-flex items-center gap-2 rounded-lg', className])}
            disabled={disabled}
            onClick={onClick}
            data-testid="OAuthImportButton:button:google-drive"
        >
            <img src={googleDriveLogo} alt="" className="w-4 h-4" />
            <span>{label ?? c('Action').t`Google Drive`}</span>
        </Button>
    );
};

export default GoogleDriveButton;

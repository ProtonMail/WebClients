import { c } from 'ttag';

import { Button } from '@proton/atoms';
import outlookLogo from '@proton/styles/assets/img/import/providers/outlook.svg';
import clsx from '@proton/utils/clsx';

interface Props {
    className?: string;
    disabled?: boolean;
    label?: string;
    onClick: () => void;
}

const OutlookButton = ({ className, disabled, onClick, label }: Props) => {
    return (
        <Button
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
        </Button>
    );
};

export default OutlookButton;

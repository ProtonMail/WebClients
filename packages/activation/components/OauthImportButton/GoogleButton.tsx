import { c } from 'ttag';

import { Button } from '@proton/atoms';
import googleLogo from '@proton/styles/assets/img/import/providers/google.svg';
import clsx from '@proton/utils/clsx';

interface Props {
    className?: string;
    disabled?: boolean;
    onClick: () => void;
}

const GoogleButton = ({ className, disabled, onClick }: Props) => {
    return (
        <Button className={clsx(['inline-flex flex-justify-center', className])} disabled={disabled} onClick={onClick}>
            <img src={googleLogo} className="mr0-5 flex-align-self-center" />
            {c('Action').t`Continue with Google`}
        </Button>
    );
};

export default GoogleButton;

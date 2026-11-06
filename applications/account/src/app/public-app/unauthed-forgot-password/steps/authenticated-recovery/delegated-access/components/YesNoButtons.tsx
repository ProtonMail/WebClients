import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcCross } from '@proton/icons/icons/IcCross';

interface YesNoButtonsProps {
    onYes: () => void;
    onNo: () => void;
}

const YesNoButtons = ({ onYes, onNo }: YesNoButtonsProps) => {
    return (
        <div className="flex gap-2">
            <Button size="large" className="flex items-center flex-1 justify-center" onClick={onNo}>
                <IcCross className="mr-1" />
                {c('Action').t`No`}
            </Button>
            <Button size="large" className="flex items-center flex-1 justify-center" onClick={onYes}>
                <IcCheckmark className="mr-1" />
                {c('Action').t`Yes`}
            </Button>
        </div>
    );
};

export default YesNoButtons;

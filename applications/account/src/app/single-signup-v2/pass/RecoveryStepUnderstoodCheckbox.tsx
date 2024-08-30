import { c } from 'ttag';

import { Checkbox, Label } from '@proton/components';
import clsx from '@proton/utils/clsx';

interface Props {
    className?: string;
    checked: boolean;
    onChange: () => void;
}

const RecoveryStepUnderstoodCheckbox = ({ className, checked, onChange }: Props) => {
    return (
        <div className={clsx('flex flex-row items-start', className)}>
            <Checkbox id="understood-recovery-necessity" className="mt-2 mr-2" checked={checked} onChange={onChange} />
            <Label htmlFor="understood-recovery-necessity" className="flex-1">
                {c('pass_signup_2023: Info')
                    .t`I understand that if I lose my recovery details, I may permanently lose access to my account.`}
            </Label>
        </div>
    );
};

export default RecoveryStepUnderstoodCheckbox;

import { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface Props {
    label: ReactNode;
    input: ReactNode;
    className?: string;
}
const LegacyInputField = ({ label, input, className }: Props) => {
    return (
        <div className={clsx(['flex flex-column md:flex-row signup-label-field-container mb-4', className])}>
            {label}
            <div className="flex-item-fluid">{input}</div>
        </div>
    );
};

export default LegacyInputField;

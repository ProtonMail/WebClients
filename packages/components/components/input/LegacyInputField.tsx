import { ReactNode } from 'react';

import { classnames } from '../../helpers';

interface Props {
    label: ReactNode;
    input: ReactNode;
    className?: string;
}
const LegacyInputField = ({ label, input, className }: Props) => {
    return (
        <div className={classnames(['flex on-mobile-flex-column signup-label-field-container mb-4', className])}>
            {label}
            <div className="flex-item-fluid">{input}</div>
        </div>
    );
};

export default LegacyInputField;

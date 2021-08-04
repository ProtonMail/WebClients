import * as React from 'react';
import { classnames } from '../../helpers';

interface Props {
    label: React.ReactNode;
    input: React.ReactNode;
    className?: string;
}
const LegacyInputField = ({ label, input, className }: Props) => {
    return (
        <div className={classnames(['flex on-mobile-flex-column signup-label-field-container mb1', className])}>
            {label}
            <div className="flex-item-fluid">{input}</div>
        </div>
    );
};

export default LegacyInputField;

import type { ReactNode } from 'react';

import './MemberToggleContainer.scss';

const MemberToggleContainer = ({
    toggle,
    label,
    assistiveText,
}: {
    toggle: ReactNode;
    label: ReactNode;
    assistiveText?: ReactNode;
}) => {
    return (
        <div className="member-toggle-container">
            <div className="member-toggle-container-toggle">{toggle}</div>
            <div className="member-toggle-container-label">{label}</div>
            {assistiveText && (
                <div className="member-toggle-container-assistive color-weak text-sm">{assistiveText}</div>
            )}
        </div>
    );
};

export default MemberToggleContainer;

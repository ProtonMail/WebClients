import React from 'react';

import Radio from '@proton/components/components/input/Radio';
import clsx from '@proton/utils/clsx';

type ApplyPolicyButtonProps = {
    onClick: () => void;
    label: string;
    isSelected?: boolean;
};

const ApplyPolicyButton: React.FC<ApplyPolicyButtonProps> = ({ onClick, label, isSelected = false }) => {
    const selectedStyle = {
        background:
            'linear-gradient(78deg, color-mix(in srgb, var(--interaction-norm-minor-1) 80%, transparent) 0%, color-mix(in srgb, var(--interaction-norm-minor-2) 20%, transparent) 100%)',
    };

    return (
        <button
            type="button"
            aria-pressed={isSelected}
            className={clsx(
                'flex flex-row border flex-nowrap rounded-lg w-full overflow-hidden gap-4 text-left',
                isSelected ? 'border-primary' : 'border-weak bg-norm'
            )}
            style={isSelected ? selectedStyle : {}}
            onClick={onClick}
        >
            {/* Top Section: Radio and Text */}
            <div className="flex flex-row flex-nowrap items-start gap-2 px-4 py-4 w-full">
                <span aria-hidden="true" className="shrink-0">
                    <Radio id={label} checked={isSelected} name={label} readOnly tabIndex={-1} />
                </span>
                <div className="flex-1 pt-0.5">
                    <p className="mt-0 mb-1">
                        <strong>{label}</strong>
                    </p>
                </div>
            </div>
        </button>
    );
};

export default ApplyPolicyButton;

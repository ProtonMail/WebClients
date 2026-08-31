import React from 'react';

import clsx from '@proton/utils/clsx';

import './LabelAndDescription.scss';

export type LabelAndDescriptionSize = 'medium' | 'large';

const sizeClass: Record<LabelAndDescriptionSize, { label: string; description: string }> = {
    medium: {
        label: 'text-rg',
        description: 'text-sm',
    },
    large: {
        label: 'text-lg',
        description: 'text-rg',
    },
};

export const LabelAndDescription = ({
    label,
    description,
    size = 'large',
    labelColor = 'color-norm',
    descriptionColor = 'color-norm',
    id,
}: {
    label: string;
    description?: React.ReactNode;
    size?: LabelAndDescriptionSize;
    labelColor?: string;
    descriptionColor?: string;
    id?: string;
}) => {
    return (
        <div className="label-and-description flex flex-column flex-nowrap gap-1 w-full">
            <label
                className={clsx('label-and-description-label shrink-0', sizeClass[size].label, labelColor)}
                htmlFor={id}
            >
                {label}
            </label>
            {description && (
                <span
                    id={id ? `${id}-description` : undefined}
                    className={clsx('label-and-description-description', sizeClass[size].description, descriptionColor)}
                >
                    {description}
                </span>
            )}
        </div>
    );
};

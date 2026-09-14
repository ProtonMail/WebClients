import { useState } from 'react';

import { c, msgid } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { IcStarFilled } from '@proton/icons/icons/IcStarFilled';
import clsx from '@proton/utils/clsx';
import range from '@proton/utils/range';

import './StarRating.scss';

export interface StarRatingProps {
    value?: number;
    onChange: (value: number) => void;
    className?: string;
    ariaDescribedBy?: string;
    disabled?: boolean;
    /** Swaps the chosen star for a spinner while the rating is being submitted. */
    loading?: boolean;
}

export const StarRating = ({ value, onChange, className, ariaDescribedBy, disabled, loading }: StarRatingProps) => {
    const [hoveredStar, setHoveredStar] = useState<number | undefined>(undefined);

    const handleChange = (numberOfStars: number) => {
        onChange(numberOfStars);
    };

    const stars = range(1, 6);

    return (
        <div
            className={clsx('star-rating flex flex-row items-center justify-center', className)}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setHoveredStar(undefined);
                }
            }}
        >
            <svg width="0" height="0" className="absolute">
                <defs>
                    <linearGradient id="starGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FFD36E" />
                        <stop offset="100%" stopColor="#F6B828" />
                    </linearGradient>
                </defs>
            </svg>
            {stars.map((numberOfStars) => {
                const isFilled = value !== undefined && numberOfStars <= value;
                const isHovered = hoveredStar !== undefined && numberOfStars <= hoveredStar;
                const shouldShowGold = isFilled || isHovered;
                const isSubmitting = !!loading && numberOfStars === value;

                return (
                    <button
                        key={numberOfStars}
                        type="button"
                        className={clsx('star-rating-button shrink-0', shouldShowGold && 'star-rating-button--filled')}
                        onClick={() => handleChange(numberOfStars)}
                        onMouseEnter={() => setHoveredStar(numberOfStars)}
                        onMouseLeave={() => setHoveredStar(undefined)}
                        onFocus={() => setHoveredStar(numberOfStars)}
                        aria-label={c('Label').ngettext(
                            msgid`${numberOfStars} star`,
                            `${numberOfStars} stars`,
                            numberOfStars
                        )}
                        aria-pressed={isFilled}
                        aria-describedby={ariaDescribedBy}
                        aria-busy={isSubmitting}
                        disabled={disabled}
                    >
                        {isSubmitting ? (
                            <CircleLoader className="star-rating-loader" aria-hidden="true" />
                        ) : (
                            <IcStarFilled size={8} />
                        )}
                    </button>
                );
            })}
        </div>
    );
};

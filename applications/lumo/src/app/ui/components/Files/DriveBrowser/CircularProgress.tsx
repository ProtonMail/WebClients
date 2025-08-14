import React from 'react';

interface CircularProgressProps {
    progress: number; // 0-100
    size?: number; // Size in pixels
    strokeWidth?: number;
    className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
    progress,
    size = 16,
    strokeWidth = 2,
    className = '',
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div style={{ display: 'inline-block', paddingTop: '3px' }} className={className}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="none"
                    style={{ opacity: 0.2 }}
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{
                        transition: 'stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        strokeLinecap: 'round',
                    }}
                />
            </svg>
        </div>
    );
};

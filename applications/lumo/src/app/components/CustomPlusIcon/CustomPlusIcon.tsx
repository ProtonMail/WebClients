import React from 'react';

interface CustomPlusIconProps {
    size?: number;
    className?: string;
    style?: React.CSSProperties;
}

const CustomPlusIcon = ({ size = 16, className, style }: CustomPlusIconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={style}
    >
        <path
            d="M9.85156 6.40332H16L15.3652 9.59668H9.21582L7.83789 16H4.77051L6.14941 9.59668H0L0.634766 6.40332H6.78418L8.16309 0H11.2295L9.85156 6.40332Z"
            fill="#6D4AFF"
        />
    </svg>
);

export default CustomPlusIcon;

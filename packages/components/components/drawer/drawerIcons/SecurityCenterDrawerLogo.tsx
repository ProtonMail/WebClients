import React from 'react';

const SecurityCenterDrawerLogo = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none">
            <path
                fill="url(#securitya)"
                d="M1 10.881v-7.16a1 1 0 0 1 .684-.949L9.368.211a2 2 0 0 1 1.264 0l7.684 2.561a1 1 0 0 1 .684.949v7.16a7 7 0 0 1-3.6 6.12l-4.429 2.46a2 2 0 0 1-1.942 0L4.6 17A7 7 0 0 1 1 10.88Z"
            />
            <mask
                id="securityb"
                width="18"
                height="20"
                x="1"
                y="0"
                maskUnits="userSpaceOnUse"
                style={{ maskType: 'alpha' }}
            >
                <path
                    fill="red"
                    d="M1 10.881v-7.16a1 1 0 0 1 .684-.949L9.368.211a2 2 0 0 1 1.264 0l7.684 2.561a1 1 0 0 1 .684.949v7.16a7 7 0 0 1-3.6 6.12l-4.429 2.46a2 2 0 0 1-1.942 0L4.6 17A7 7 0 0 1 1 10.88Z"
                />
            </mask>
            <g mask="url(#securityb)">
                <path
                    fill="url(#securityc)"
                    d="M1 10.881v-7.16a1 1 0 0 1 .684-.949L10 0v20l-5.4-3A7 7 0 0 1 1 10.881Z"
                />
            </g>
            <path
                stroke="#636361"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity=".2"
                strokeWidth="2"
                d="M2 10.881v-7.16l7.684-2.562a1 1 0 0 1 .632 0L18 3.721v7.16a6 6 0 0 1-3.086 5.245l-4.428 2.46a1 1 0 0 1-.972 0l-4.428-2.46A6 6 0 0 1 2 10.881Z"
            />
            <circle cx="7" cy="8" r="1" fill="#fff" />
            <circle cx="7" cy="11" r="1" fill="#fff" />
            <rect width="5" height="2" x="9" y="7" fill="#fff" rx="1" />
            <rect width="5" height="2" x="9" y="10" fill="#fff" rx="1" />
            <defs>
                <linearGradient id="securitya" x1="7.5" x2="22.035" y1="20" y2="-.402" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#82817F" />
                    <stop offset="1" stopColor="#D0CFCC" />
                </linearGradient>
                <linearGradient id="securityc" x1="4.5" x2="11.052" y1="18" y2="1.819" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#4D4C49" />
                    <stop offset="1" stopColor="#B3B1AD" />
                </linearGradient>
            </defs>
        </svg>
    );
};

export default SecurityCenterDrawerLogo;

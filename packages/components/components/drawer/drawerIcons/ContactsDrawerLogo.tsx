const CalendarDrawerLogo = () => {
    return (
        <svg width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 8a3 3 0 0 0-3-3H8v18h13a3 3 0 0 0 3-3V8Z" fill="url(#a)" />
            <path d="M24 8a3 3 0 0 0-3-3H8v18h13a3 3 0 0 0 3-3V8Z" fill="url(#b)" />
            <path d="M8 5H7a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h1V5Z" fill="url(#c)" />
            <path
                d="M15.765 10.874c0 1.034-.81 1.873-1.81 1.873-.998 0-1.809-.839-1.809-1.873 0-1.035.81-1.874 1.81-1.874s1.81.839 1.81 1.874Zm-5.59 4.951c-.524.979.194 2.175 1.269 2.175h5.024c1.075 0 1.793-1.204 1.268-2.175-.735-1.38-2.156-2.308-3.78-2.308-1.624 0-3.045.937-3.78 2.308Zm9.225 1.228h-1.053c.18-.398.193-.875-.04-1.307a4.422 4.422 0 0 0-1.343-1.529c.25-.074.512-.114.783-.114 1.069 0 2.004.61 2.487 1.519.346.638-.127 1.43-.834 1.43Zm-1.653-3.456c.658 0 1.19-.552 1.19-1.233 0-.68-.532-1.232-1.19-1.232-.657 0-1.19.551-1.19 1.232 0 .681.533 1.233 1.19 1.233Z"
                fill="#fff"
            />
            <defs>
                <linearGradient id="a" x1="14.893" y1="6" x2="14.893" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FFB341" />
                    <stop offset="1" stopColor="#EE7C3E" />
                </linearGradient>
                <linearGradient id="c" x1="5.5" y1="4" x2="5.5" y2="24" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#EF8A41" />
                    <stop offset="1" stopColor="#CE5B36" />
                </linearGradient>
                <radialGradient
                    id="b"
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="matrix(0 6 -5.91964 0 15 14)"
                >
                    <stop stopColor="#EE7C3E" />
                    <stop offset="1" stopColor="#EE7C3E" stopOpacity="0" />
                </radialGradient>
            </defs>
        </svg>
    );
};

export default CalendarDrawerLogo;

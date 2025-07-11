// needs to be inlined so we can use taxonomy to make it theme-friendly
export const PaperTrashSvg = ({ className }: { className?: string }) => {
    return (
        <svg
            width="128"
            height="128"
            viewBox="0 0 128 128"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <rect width="128" height="128" fill="var(--background-lowered)" />
            <g filter="url(#filter0_d_48108_85159)">
                <circle cx="57.25" cy="70.25" r="19.5" fill="var(--background-norm)" />
                <circle cx="73.5" cy="78.5" r="14.25" fill="var(--background-norm)" />
                <circle cx="38" cy="75" r="12.75" fill="var(--background-norm)" />
                <circle cx="55" cy="83.5" r="12.75" fill="var(--background-norm)" />
            </g>
            <g filter="url(#filter1_d_48108_85159)">
                <circle cx="67.75" cy="49.75" r="18" fill="var(--background-norm)" />
                <circle cx="85.5" cy="53.5" r="9.75" fill="var(--background-norm)" />
                <circle cx="86" cy="41.5" r="6.75" fill="var(--background-norm)" />
                <circle cx="44.75" cy="46.75" r="10.5" fill="var(--background-norm)" />
                <circle cx="35.5" cy="58.5" r="6.75" fill="var(--background-norm)" />
            </g>
            <g filter="url(#filter2_d_48108_85159)">
                <circle cx="90.75" cy="63.75" r="9" fill="var(--background-norm)" />
                <circle cx="81.75" cy="73.75" r="13.5" fill="var(--background-norm)" />
                <circle cx="91.5" cy="78.5" r="11.25" fill="var(--background-norm)" />
                <circle cx="64.75" cy="66.25" r="10.5" fill="var(--background-norm)" />
            </g>
            <defs>
                <filter
                    id="filter0_d_48108_85159"
                    x="0.25"
                    y="24.75"
                    width="111.5"
                    height="95.5"
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                    />
                    <feOffset />
                    <feGaussianBlur stdDeviation="12" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_48108_85159" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_48108_85159" result="shape" />
                </filter>
                <filter
                    id="filter1_d_48108_85159"
                    x="4.75"
                    y="7.75"
                    width="114.5"
                    height="86"
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                    />
                    <feOffset />
                    <feGaussianBlur stdDeviation="12" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_48108_85159" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_48108_85159" result="shape" />
                </filter>
                <filter
                    id="filter2_d_48108_85159"
                    x="30.25"
                    y="27.75"
                    width="96.5"
                    height="86"
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                    />
                    <feOffset />
                    <feGaussianBlur stdDeviation="12" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_48108_85159" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_48108_85159" result="shape" />
                </filter>
            </defs>
        </svg>
    );
};

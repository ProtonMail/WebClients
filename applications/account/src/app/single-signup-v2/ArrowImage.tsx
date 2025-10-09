interface Props {
    alt?: string;
}

const ArrowImage = ({ alt = '' }: Props) => {
    return (
        <div className="color-invert">
            <svg
                className="fill-currentcolor"
                width="85"
                height="90"
                viewBox="0 0 85 90"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <g filter="url(#filter0_dddd_32044_2572)">
                    <path
                        d="M16.4142 15.4142C15.1543 14.1543 16.0466 12 17.8284 12H36.1716C36.702 12 37.2107 12.2107 37.5858 12.5858L67.5858 42.5858C68.3668 43.3668 68.3668 44.6332 67.5858 45.4142L37.5858 75.4142C37.2107 75.7893 36.702 76 36.1716 76H17.8284C16.0466 76 15.1543 73.8457 16.4142 72.5858L43.5858 45.4142C44.3668 44.6332 44.3668 43.3668 43.5858 42.5858L16.4142 15.4142Z"
                        className="background-norm"
                        shapeRendering="crispEdges"
                    />
                    <path
                        d="M17.8284 11.5C15.6012 11.5 14.4857 14.1928 16.0607 15.7678L43.2322 42.9393C43.818 43.5251 43.818 44.4749 43.2322 45.0607L16.0607 72.2322C14.4857 73.8071 15.6012 76.5 17.8284 76.5H36.1716C36.8346 76.5 37.4705 76.2366 37.9393 75.7678L67.9393 45.7678C68.9157 44.7915 68.9157 43.2085 67.9393 42.2322L37.9393 12.2322C37.4705 11.7634 36.8346 11.5 36.1716 11.5H17.8284Z"
                        className="background-norm"
                        stroke="white"
                        strokeOpacity="0.5"
                        shapeRendering="crispEdges"
                    />
                </g>
                <defs>
                    <filter
                        id="filter0_dddd_32044_2572"
                        x="0.822266"
                        y="0"
                        width="83.3496"
                        height="90"
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
                        <feMorphology
                            radius="2"
                            operator="dilate"
                            in="SourceAlpha"
                            result="effect1_dropShadow_32044_2572"
                        />
                        <feOffset dx="-7" dy="3" />
                        <feGaussianBlur stdDeviation="2.5" />
                        <feComposite in2="hardAlpha" operator="out" />
                        <feColorMatrix
                            type="matrix"
                            values="0 0 0 0 0.804682 0 0 0 0 0.310347 0 0 0 0 0.908333 0 0 0 0.5 0"
                        />
                        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_32044_2572" />
                        <feColorMatrix
                            in="SourceAlpha"
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            result="hardAlpha"
                        />
                        <feMorphology
                            radius="3"
                            operator="dilate"
                            in="SourceAlpha"
                            result="effect2_dropShadow_32044_2572"
                        />
                        <feOffset dx="5" dy="3" />
                        <feGaussianBlur stdDeviation="3.5" />
                        <feComposite in2="hardAlpha" operator="out" />
                        <feColorMatrix
                            type="matrix"
                            values="0 0 0 0 0.423529 0 0 0 0 0.286275 0 0 0 0 0.996078 0 0 0 0.5 0"
                        />
                        <feBlend
                            mode="normal"
                            in2="effect1_dropShadow_32044_2572"
                            result="effect2_dropShadow_32044_2572"
                        />
                        <feColorMatrix
                            in="SourceAlpha"
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            result="hardAlpha"
                        />
                        <feMorphology
                            radius="3"
                            operator="dilate"
                            in="SourceAlpha"
                            result="effect3_dropShadow_32044_2572"
                        />
                        <feOffset dx="-2" dy="-2" />
                        <feGaussianBlur stdDeviation="3" />
                        <feComposite in2="hardAlpha" operator="out" />
                        <feColorMatrix
                            type="matrix"
                            values="0 0 0 0 0.964706 0 0 0 0 0.776471 0 0 0 0 0.572549 0 0 0 0.5 0"
                        />
                        <feBlend
                            mode="normal"
                            in2="effect2_dropShadow_32044_2572"
                            result="effect3_dropShadow_32044_2572"
                        />
                        <feColorMatrix
                            in="SourceAlpha"
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            result="hardAlpha"
                        />
                        <feMorphology
                            radius="3"
                            operator="dilate"
                            in="SourceAlpha"
                            result="effect4_dropShadow_32044_2572"
                        />
                        <feOffset />
                        <feGaussianBlur stdDeviation="3.5" />
                        <feComposite in2="hardAlpha" operator="out" />
                        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0" />
                        <feBlend
                            mode="normal"
                            in2="effect3_dropShadow_32044_2572"
                            result="effect4_dropShadow_32044_2572"
                        />
                        <feBlend mode="normal" in="SourceGraphic" in2="effect4_dropShadow_32044_2572" result="shape" />
                    </filter>
                </defs>
            </svg>
            <span className="sr-only">{alt}</span>
        </div>
    );
};

export default ArrowImage;

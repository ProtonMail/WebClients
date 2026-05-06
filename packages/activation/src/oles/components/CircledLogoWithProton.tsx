import { useState } from 'react';

import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

interface CircledLogoWithProtonProps {
    className?: string;
    /**
     * The icon to display inside the circled logo, usually a 16x16 icon. Default is the Google logo
     */
    icon?: React.ReactNode;
    /**
     * inside-bottom-right: the proton icon and the border of the circled logo are aligned on their bottom
     * outside-bottom-right: the proton icon is a bit outside the circled logo
     */
    iconPosition: 'inside-bottom-right' | 'outside-bottom-right';
}

const GoogleIcon = () => {
    const [uid] = useState(generateUID('google-icon'));
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath={`url(#${uid}-clip0_4487_15283)`}>
                <path
                    d="M15.6263 8.14945C15.6263 7.49394 15.5731 7.01559 15.458 6.51953H7.97266V9.47819H12.3664C12.2778 10.2135 11.7995 11.3208 10.7364 12.0648L10.7215 12.1639L13.0883 13.9973L13.2522 14.0137C14.7581 12.6229 15.6263 10.5766 15.6263 8.14945Z"
                    fill="#4285F4"
                />
                <path
                    d="M7.97272 15.9446C10.1253 15.9446 11.9324 15.2358 13.2523 14.0134L10.7365 12.0646C10.0633 12.534 9.15972 12.8618 7.97272 12.8618C5.86445 12.8618 4.07507 11.4711 3.43721 9.54883L3.34372 9.55677L0.882769 11.4613L0.850586 11.5508C2.16161 14.1551 4.85456 15.9446 7.97272 15.9446Z"
                    fill="#34A853"
                />
                <path
                    d="M3.43701 9.54985C3.2687 9.05379 3.1713 8.52225 3.1713 7.97306C3.1713 7.4238 3.2687 6.89232 3.42815 6.39626L3.42369 6.29061L0.931908 4.35547L0.850382 4.39425C0.310046 5.47498 0 6.6886 0 7.97306C0 9.25751 0.310046 10.4711 0.850382 11.5518L3.43701 9.54985Z"
                    fill="#FBBC05"
                />
                <path
                    d="M7.97272 3.08269C9.46976 3.08269 10.4796 3.72934 11.0554 4.26974L13.3054 2.07285C11.9236 0.788397 10.1253 0 7.97272 0C4.85456 0 2.16161 1.78937 0.850586 4.39371L3.42836 6.39573C4.07507 4.47347 5.86445 3.08269 7.97272 3.08269Z"
                    fill="#EB4335"
                />
            </g>
            <defs>
                <clipPath id={`${uid}-clip0_4487_15283`}>
                    <rect width="16" height="16" fill="white" />
                </clipPath>
            </defs>
        </svg>
    );
};

const ProtonIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => {
    const [uid] = useState(generateUID('proton-biz'));
    return (
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <svg
            width="26"
            height="26"
            viewBox="0 0 26 26"
            fill="none"
            role="img"
            focusable="false"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={style}
        >
            <rect x="1" y="1" width="24" height="24" rx="12" fill="var(--primary)" />
            <rect x="1" y="1" width="24" height="24" rx="12" stroke="var(--background-norm)" strokeWidth="2" />
            <g clipPath={`url(#${uid}-clip0_4487_15231)`}>
                <path
                    d="M9.5 15.3962V18.0003H11.348V15.5091C11.348 15.2667 11.4453 15.0342 11.6186 14.8628C11.7919 14.6914 12.0269 14.5951 12.272 14.5951H14.1668C14.6046 14.5951 15.0381 14.5099 15.4425 14.3441C15.847 14.1784 16.2145 13.9355 16.524 13.6293C16.8335 13.3231 17.0791 12.9596 17.2466 12.5596C17.4141 12.1595 17.5003 11.7307 17.5003 11.2977C17.5003 10.8647 17.4141 10.4359 17.2467 10.0358C17.0792 9.63567 16.8336 9.27214 16.5241 8.96591C16.2145 8.65969 15.847 8.41677 15.4426 8.25104C15.0381 8.08531 14.6046 8 14.1668 8H9.5V11.2551H11.348V9.72021H14.0417C14.46 9.72021 14.8612 9.88456 15.157 10.1771C15.4528 10.4696 15.619 10.8664 15.6191 11.2802C15.6191 11.694 15.4529 12.0908 15.1571 12.3834C14.8613 12.676 14.4601 12.8404 14.0417 12.8404H12.0831C11.7438 12.8402 11.4078 12.9063 11.0943 13.0347C10.7808 13.1631 10.4959 13.3513 10.256 13.5887C10.0161 13.8261 9.82586 14.1079 9.69614 14.418C9.56642 14.7281 9.49977 15.0605 9.5 15.3962Z"
                    fill="#fff"
                />
                <path
                    d="M12.2715 14.5957C11.9075 14.5957 11.5471 14.6666 11.2108 14.8043C10.8746 14.9421 10.569 15.144 10.3117 15.3985C10.0543 15.6531 9.85017 15.9553 9.7109 16.2879C9.57163 16.6205 9.49997 16.977 9.5 17.337V18.0008H11.348V15.5096C11.348 15.2673 11.4453 15.0349 11.6184 14.8636C11.7916 14.6922 12.0265 14.5958 12.2715 14.5957Z"
                    fill="#fff"
                />
            </g>
            <defs>
                <clipPath id={`${uid}-clip0_4487_15231`}>
                    <rect width="8" height="10" fill="var(--background-norm)" transform="translate(9.5 8)" />
                </clipPath>
            </defs>
        </svg>
    );
};

export const CircledLogoWithProton = ({
    className,
    icon = <GoogleIcon />,
    iconPosition = 'inside-bottom-right',
}: CircledLogoWithProtonProps) => {
    return (
        <span
            className={clsx(
                'flex items-center justify-center relative border border-weak rounded-full p-1 min-w-custom ratio-square mr-2',
                className
            )}
            style={{ '--min-w-custom': '2.75rem' }}
        >
            {icon}
            <ProtonIcon
                className="absolute bottom-custom end-custom"
                style={{
                    '--bottom-custom': iconPosition === 'inside-bottom-right' ? '-0.25rem' : '-0.55rem',
                    '--end-custom': iconPosition === 'inside-bottom-right' ? '-0.75rem' : '-0.55rem',
                }}
            />
        </span>
    );
};

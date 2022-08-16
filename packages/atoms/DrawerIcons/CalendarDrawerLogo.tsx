import './DrawerIcons.scss';

interface Props {
    monthDay: number;
}

const CalendarDrawerLogo = ({ monthDay }: Props) => {
    return (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 11H20V18.5C20 19.8807 18.8807 21 17.5 21H10V11Z" fill="white"></path>
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4 7C4 5.89543 4.89543 5 6 5H22C23.1046 5 24 5.89543 24 7V21C24 22.1046 23.1046 23 22 23H6C4.89543 23 4 22.1046 4 21V7Z"
                fill="url(#paint0_linear_20431_3019)"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4 7C4 5.89543 4.89543 5 6 5H22C23.1046 5 24 5.89543 24 7V21C24 22.1046 23.1046 23 22 23H6C4.89543 23 4 22.1046 4 21V7Z"
                fill="url(#paint1_radial_20431_3019)"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6 5C4.89543 5 4 5.89543 4 7V8H18.5C19.3284 8 20 8.67157 20 9.5V23H22C23.1046 23 24 22.1046 24 21V7C24 5.89543 23.1046 5 22 5H6Z"
                fill="url(#paint2_linear_20431_3019)"
            />
            {/* <path d="M10.2037 18.36C11.5637 18.36 12.6137 17.58 12.6137 16.42C12.6137 15.37 11.8737 14.86 11.3037 14.73V14.71C11.7337 14.58 12.3837 14.07 12.3837 13.16C12.3837 12.06 11.4737 11.33 10.1737 11.33C8.51367 11.33 7.87367 12.54 7.82367 13.37H9.13367C9.19367 12.88 9.52367 12.46 10.1637 12.46C10.7137 12.46 11.1337 12.79 11.1337 13.33C11.1337 13.88 10.7137 14.2 9.88367 14.2H9.41367V15.33H9.98367C10.8237 15.33 11.3537 15.65 11.3537 16.26C11.3537 16.84 10.8837 17.23 10.2037 17.23C9.53367 17.23 9.09367 16.82 8.98367 16.28H7.62367C7.71367 17.48 8.70367 18.36 10.2037 18.36ZM13.3554 12.55V13.85L14.7054 12.9V18.25H15.9754V11.43H14.9654L13.3554 12.55Z" fill="white" /> */}
            <text x="7" y="19" textAnchor="middle" className="drawer-icons__calendar__day">
                <tspan x="12" dy="0">
                    {monthDay}
                </tspan>
            </text>
            <defs>
                <linearGradient
                    id="paint0_linear_20431_3019"
                    x1="14"
                    y1="-2.19145"
                    x2="15.6098"
                    y2="18.8353"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0.988738" stopColor="#6D4AFF" />
                </linearGradient>
                <radialGradient
                    id="paint1_radial_20431_3019"
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(17.6207 -4.1875) rotate(108.899) scale(30.7846 38.4447)"
                >
                    <stop offset="0.556057" stopColor="#54B7FF" stopOpacity="0" />
                    <stop offset="0.994421" stopColor="#54B7FF" />
                </radialGradient>
                <linearGradient
                    id="paint2_linear_20431_3019"
                    x1="27.75"
                    y1="34.25"
                    x2="2.31473"
                    y2="-8.97937"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#C8E8FF" />
                    <stop offset="0.410661" stopColor="#BDAEFF" />
                    <stop offset="0.774813" stopColor="#6D4AFF" />
                </linearGradient>
            </defs>
        </svg>
    );
};

export default CalendarDrawerLogo;

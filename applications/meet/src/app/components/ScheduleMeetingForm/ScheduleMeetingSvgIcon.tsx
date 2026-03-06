import type { MeetingVariant } from './ScheduleMeetingForm';

export const MeetingColorsMap: Record<MeetingVariant, string[]> = {
    purple: ['#B9ABFF', '#9581FF', '#413969'],
    orange: ['#FFB35F', '#FF7A00', '#523A2E'],
    blue: ['#7BDCFF', '#399BBE', '#094A62'],
    green: ['#9EEA9F', '#149C15', '#2B3E40'],
    red: ['#FB7878', '#FC4646', '#3D2A3D'],
};

export const ScheduleMeetingSvgIcon = ({ variant }: { variant: MeetingVariant }) => (
    <svg width="64" height="57" viewBox="0 0 64 57" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect y="4.83984" width="57.6363" height="37.4764" rx="9.68644" fill={MeetingColorsMap[variant][0]} />
        <path
            d="M53.874 16.9404C55.9519 16.9406 57.6367 18.6252 57.6367 20.7031V46.7852C57.6367 52.1347 53.2997 56.4715 47.9502 56.4717H9.68652C4.33686 56.4717 1.34173e-05 52.1348 0 46.7852V20.7031C0 18.6251 1.68467 16.9404 3.7627 16.9404H53.874Z"
            fill={MeetingColorsMap[variant][2]}
        />
        <rect
            x="13.2129"
            width="9.68644"
            height="4.30508"
            rx="2.15254"
            transform="rotate(90 13.2129 0)"
            fill={MeetingColorsMap[variant][1]}
        />
        <rect
            x="25.0527"
            width="9.68644"
            height="4.30508"
            rx="2.15254"
            transform="rotate(90 25.0527 0)"
            fill={MeetingColorsMap[variant][1]}
        />
        <rect
            x="36.8906"
            width="9.68644"
            height="4.30508"
            rx="2.15254"
            transform="rotate(90 36.8906 0)"
            fill={MeetingColorsMap[variant][1]}
        />
        <rect
            x="48.7305"
            width="9.68644"
            height="4.30508"
            rx="2.15254"
            transform="rotate(90 48.7305 0)"
            fill={MeetingColorsMap[variant][1]}
        />
        <rect
            x="7.76367"
            y="23.251"
            width="6.91969"
            height="5.38136"
            rx="2.69068"
            fill={MeetingColorsMap[variant][0]}
        />
        <rect
            x="7.76367"
            y="23.251"
            width="6.91969"
            height="5.38136"
            rx="2.69068"
            fill={MeetingColorsMap[variant][0]}
        />
        <rect
            x="18.9883"
            y="23.251"
            width="6.91969"
            height="5.38136"
            rx="2.69068"
            fill={MeetingColorsMap[variant][0]}
        />
        <rect
            x="30.2129"
            y="23.251"
            width="6.91969"
            height="5.38136"
            rx="2.69068"
            fill={MeetingColorsMap[variant][1]}
        />
        <rect
            x="41.4375"
            y="23.251"
            width="6.91969"
            height="5.38136"
            rx="2.69068"
            fill={MeetingColorsMap[variant][0]}
        />
        <rect
            x="7.76367"
            y="31.8613"
            width="6.91969"
            height="5.38136"
            rx="2.69068"
            fill={MeetingColorsMap[variant][0]}
        />
        <rect
            x="18.9883"
            y="31.8613"
            width="6.91969"
            height="5.38136"
            rx="2.69068"
            fill={MeetingColorsMap[variant][0]}
        />
        <rect
            x="30.2129"
            y="31.8613"
            width="6.91969"
            height="5.38136"
            rx="2.69068"
            fill={MeetingColorsMap[variant][2]}
        />
        <rect
            x="41.4375"
            y="31.8613"
            width="6.91969"
            height="5.38136"
            rx="2.69068"
            fill={MeetingColorsMap[variant][2]}
        />
        <rect
            x="7.76367"
            y="40.4717"
            width="6.91969"
            height="5.38136"
            rx="2.69068"
            fill={MeetingColorsMap[variant][0]}
        />
        <rect
            x="18.9883"
            y="40.4717"
            width="6.91969"
            height="5.38136"
            rx="2.69068"
            fill={MeetingColorsMap[variant][0]}
        />
        <rect
            x="30.2129"
            y="40.4717"
            width="6.91969"
            height="5.38136"
            rx="2.69068"
            fill={MeetingColorsMap[variant][2]}
        />
        <rect
            x="41.4375"
            y="40.4717"
            width="6.91969"
            height="5.38136"
            rx="2.69068"
            fill={MeetingColorsMap[variant][2]}
        />
        <path
            d="M63.9997 25.6507L42.6872 51.2647L28.2598 39.2416L32.1248 34.6024L41.9096 42.7571L59.3579 21.7891L63.9997 25.6507Z"
            fill={MeetingColorsMap[variant][1]}
        />
    </svg>
);

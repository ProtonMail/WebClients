import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import { PROTON_THEMES_MAP } from '@proton/shared/lib/themes/themes';

export function WavyMeter() {
    const theme = useTheme();

    const primaryColor = PROTON_THEMES_MAP[theme.information.theme].thumbColors.primary;

    // The image is inlined because it won't be used in any other place and this technique allows us to change its color easily
    return (
        <svg width="233" height="10" viewBox="0 0 233 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M3.5 5.33339V5.33339C7.64728 7.04363 12.2975 7.07188 16.4652 5.41213L17.5661 4.97372C22.3611 3.06417 27.7384 3.07727 32.5335 4.98683V4.98683C37.3709 6.91329 42.7959 6.92651 47.6333 5.00005V5.00005C52.4708 3.07359 57.8625 3.07359 62.7 5.00005V5.00005C67.5375 6.92651 72.9292 6.92651 77.7667 5.00005V5.00005C82.6042 3.07359 87.9959 3.07359 92.8333 5.00005V5.00005C97.6708 6.92651 103.063 6.92651 107.9 5.00005V5.00005C112.737 3.07359 118.129 3.07359 122.967 5.00005V5.00005C127.804 6.92651 133.196 6.92651 138.033 5.00005V5.00005C142.871 3.07359 148.263 3.07359 153.1 5.00005V5.00005C157.937 6.92651 163.329 6.92651 168.167 5.00005V5.00005C173.004 3.07359 178.396 3.07359 183.233 5.00005V5.00005C188.071 6.92651 193.528 6.90039 198.366 4.97392V4.97392C203.12 3.08073 208.483 3.05505 213.237 4.94825V4.94825C218.145 6.90303 223.628 6.83713 228.488 4.76492L229.5 4.33337"
                stroke={primaryColor}
                strokeWidth="6"
                strokeLinecap="round"
            />
        </svg>
    );
}

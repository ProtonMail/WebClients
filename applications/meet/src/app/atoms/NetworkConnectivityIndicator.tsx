import { ConnectionQuality, type Participant } from 'livekit-client';

interface NetworkConnectivityIndicatorProps {
    size: number;
    participant: Participant;
    indicatorSize?: number;
    stopped?: boolean;
}

export const NetworkConnectivityIndicator = ({
    size,
    participant,
    indicatorSize = 24,
}: NetworkConnectivityIndicatorProps) => {
    const connectionQuality = participant.connectionQuality;

    return (
        <div
            className="speaking-indicator-body indicator-danger bg-weak border-weak border-radius-full size-12 flex items-center justify-center rounded-full"
            style={{ width: size, height: size }}
        >
            {(connectionQuality === ConnectionQuality.Poor || connectionQuality === ConnectionQuality.Lost) && (
                <svg
                    width={indicatorSize}
                    height={indicatorSize}
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <g clipPath="url(#clip0_5809_6716)">
                        <path
                            d="M8 14C8.82843 14 9.5 13.3284 9.5 12.5C9.5 11.6716 8.82843 11 8 11C7.17157 11 6.5 11.6716 6.5 12.5C6.5 13.3284 7.17157 14 8 14Z"
                            fill="white"
                        />
                        <path
                            opacity="0.4"
                            d="M11.4996 10C10.5996 9 9.29961 8.5 7.99961 8.5C6.69961 8.5 5.39961 9 4.49961 10L3.09961 8.6C4.39961 7.2 6.09961 6.5 7.99961 6.5C9.89961 6.5 11.5996 7.2 12.8996 8.6L11.4996 10Z"
                            fill="white"
                        />
                        <path
                            opacity="0.4"
                            d="M8 2C5 2 2.2 3.1 0 5.2L1.4 6.6C3.2 4.9 5.5 4 8 4C10.5 4 12.8 4.9 14.6 6.7L16 5.2C13.8 3.1 11 2 8 2Z"
                            fill="white"
                        />
                    </g>
                    <defs>
                        <clipPath id="clip0_5809_6716">
                            <rect width="16" height="16" fill="white" />
                        </clipPath>
                    </defs>
                </svg>
            )}
        </div>
    );
};

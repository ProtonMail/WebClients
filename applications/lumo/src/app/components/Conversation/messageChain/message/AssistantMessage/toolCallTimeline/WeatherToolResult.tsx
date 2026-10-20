import { c } from 'ttag';

import './WeatherToolResult.scss';

export interface WeatherData {
    type: 'Weather' | string;
    location_name: string;
    country?: string;
    temperature: number;
    feels_like?: number;
    humidity?: number;
    wind_speed?: number;
    wind_direction?: number;
    pressure?: number;
    clouds?: number;
    weather_description?: string;
    timestamp?: number;
}

const WEATHER_EMOJIS: [RegExp, string][] = [
    [/thunderstorm/i, '⛈'],
    [/drizzle/i, '🌦'],
    [/heavy.*rain|rain.*heavy/i, '🌧'],
    [/light.*rain|rain.*light/i, '🌦'],
    [/rain/i, '🌧'],
    [/snow|sleet|blizzard/i, '❄️'],
    [/fog|mist|haze/i, '🌫'],
    [/overcast/i, '☁️'],
    [/broken.*cloud|mostly.*cloud/i, '🌥'],
    [/scattered.*cloud/i, '⛅'],
    [/few.*cloud|partly.*cloud/i, '⛅'],
    [/clear.*sky|sunny/i, '☀️'],
    [/cloud/i, '☁️'],
];

const getWeatherEmoji = (description?: string): string => {
    if (!description) return '🌡️';
    for (const [pattern, emoji] of WEATHER_EMOJIS) {
        if (pattern.test(description)) return emoji;
    }
    return '🌡️';
};

const degreesToCompass = (degrees: number): string => {
    const dirs = Object.values({
        // translator: Standard weather abbreviation for north.
        N: c('collider_2025:Label').t`N`,
        // translator: Standard weather abbreviation for north-northeast.
        NNE: c('collider_2025:Label').t`NNE`,
        // translator: Standard weather abbreviation for northeast.
        NE: c('collider_2025:Label').t`NE`,
        // translator: Standard weather abbreviation for east-northeast.
        ENE: c('collider_2025:Label').t`ENE`,
        // translator: Standard weather abbreviation for east.
        E: c('collider_2025:Label').t`E`,
        // translator: Standard weather abbreviation for east-southeast.
        ESE: c('collider_2025:Label').t`ESE`,
        // translator: Standard weather abbreviation for southeast.
        SE: c('collider_2025:Label').t`SE`,
        // translator: Standard weather abbreviation for south-southeast.
        SSE: c('collider_2025:Label').t`SSE`,
        // translator: Standard weather abbreviation for south.
        S: c('collider_2025:Label').t`S`,
        // translator: Standard weather abbreviation for south-southwest.
        SSW: c('collider_2025:Label').t`SSW`,
        // translator: Standard weather abbreviation for southwest.
        SW: c('collider_2025:Label').t`SW`,
        // translator: Standard weather abbreviation for west-southwest.
        WSW: c('collider_2025:Label').t`WSW`,
        // translator: Standard weather abbreviation for west.
        W: c('collider_2025:Label').t`W`,
        // translator: Standard weather abbreviation for west-northwest.
        WNW: c('collider_2025:Label').t`WNW`,
        // translator: Standard weather abbreviation for northwest.
        NW: c('collider_2025:Label').t`NW`,
        // translator: Standard weather abbreviation for north-northwest.
        NNW: c('collider_2025:Label').t`NNW`,
    });
    const index = Math.round(degrees / 22.5) % 16;
    return dirs[index];
};

const formatTime = (timestamp: number): string => {
    const d = new Date(timestamp * 1000);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const formatTemp = (celsius: number): string => `${Math.round(celsius)}°C`;

interface WeatherStatProps {
    label: string;
    value: string;
}

const WeatherStat = ({ label, value }: WeatherStatProps) => (
    <div className="weather-card__stat py-2 px-4">
        <p className="weather-card__stat-label m-0">{label}</p>
        <p className="weather-card__stat-value m-0">{value}</p>
    </div>
);

export const WeatherToolResult = ({ data }: { data: WeatherData }) => {
    const emoji = getWeatherEmoji(data.weather_description);
    const locationLabel = data.country ? `${data.location_name}, ${data.country}` : data.location_name;

    const updatedTime = data.timestamp ? formatTime(data.timestamp) : '';
    const stats: { label: string; value: string }[] = [];

    if (data.feels_like !== undefined) {
        stats.push({
            // translator: Weather label for the temperature perceived by a person.
            label: c('collider_2025:Label').t`Feels Like`,
            value: formatTemp(data.feels_like),
        });
    }
    if (data.humidity !== undefined) {
        stats.push({
            // translator: Weather label for relative humidity.
            label: c('collider_2025:Label').t`Humidity`,
            value: `${data.humidity}%`,
        });
    }
    if (data.wind_speed !== undefined) {
        let windStr: string;
        if (data.wind_direction !== undefined) {
            const direction = degreesToCompass(data.wind_direction);
            // translator: Standard weather notation. ${data.wind_speed} is wind speed in meters per second; ${direction} is the localized compass abbreviation.
            windStr = c('collider_2025:Label').t`${data.wind_speed} m/s ${direction}`;
        } else {
            // translator: Standard weather notation. ${data.wind_speed} is wind speed; m/s means meters per second.
            windStr = c('collider_2025:Label').t`${data.wind_speed} m/s`;
        }
        stats.push({
            // translator: Weather label for wind speed and direction.
            label: c('collider_2025:Label').t`Wind`,
            value: windStr,
        });
    }
    if (data.pressure !== undefined) {
        stats.push({
            // translator: Weather label for atmospheric pressure.
            label: c('collider_2025:Label').t`Pressure`,
            // translator: Standard weather notation. ${data.pressure} is atmospheric pressure; hPa means hectopascals.
            value: c('collider_2025:Label').t`${data.pressure} hPa`,
        });
    }
    if (data.clouds !== undefined) {
        stats.push({
            // translator: Weather label for the amount of sky covered by clouds.
            label: c('collider_2025:Label').t`Cloud Cover`,
            value: `${data.clouds}%`,
        });
    }

    return (
        <div className="weather-card mb-2">
            <div className="flex items-center justify-space-between gap-2 py-3 px-4">
                <div className="flex items-center gap-1.5">
                    <span className="weather-card__location-icon" aria-hidden="true">
                        ☁
                    </span>
                    <span className="weather-card__location-name">{locationLabel}</span>
                </div>
                {data.timestamp && (
                    <span className="weather-card__last-updated shrink-0">
                        {
                            // translator: Weather-update label. ${updatedTime} is the formatted time of the latest weather data.
                            c('collider_2025:Reasoning').t`Last updated: ${updatedTime}`
                        }
                    </span>
                )}
            </div>

            <div className="flex items-center gap-4 pt-2 pb-4 px-4">
                <div className="weather-card__condition-icon shrink-0" aria-hidden="true">
                    {emoji}
                </div>
                <div className="flex flex-column gap-0.5">
                    <span className="weather-card__temperature">{formatTemp(data.temperature)}</span>
                    {data.weather_description && (
                        <span className="weather-card__description">
                            {data.weather_description.charAt(0).toUpperCase() + data.weather_description.slice(1)}
                        </span>
                    )}
                </div>
            </div>

            {stats.length > 0 && (
                <div className="weather-card__stats">
                    {stats.map((s) => (
                        <WeatherStat key={s.label} label={s.label} value={s.value} />
                    ))}
                </div>
            )}
        </div>
    );
};

export const parseWeatherResult = (result: string): WeatherData | null => {
    try {
        const parsed = JSON.parse(result);
        if (typeof parsed.temperature === 'number' && typeof parsed.location_name === 'string') {
            return parsed as WeatherData;
        }
    } catch {
        // Not valid JSON or not weather format
    }
    return null;
};

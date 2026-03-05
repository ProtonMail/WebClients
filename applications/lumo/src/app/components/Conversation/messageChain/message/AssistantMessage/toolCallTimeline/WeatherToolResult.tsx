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
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
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
    <div className="weather-card__stat">
        <p className="weather-card__stat-label">{label}</p>
        <p className="weather-card__stat-value">{value}</p>
    </div>
);

export const WeatherToolResult = ({ data }: { data: WeatherData }) => {
    const emoji = getWeatherEmoji(data.weather_description);
    const locationLabel = data.country ? `${data.location_name}, ${data.country}` : data.location_name;

    const stats: { label: string; value: string }[] = [];

    if (data.feels_like !== undefined) {
        stats.push({ label: 'Feels Like', value: formatTemp(data.feels_like) });
    }
    if (data.humidity !== undefined) {
        stats.push({ label: 'Humidity', value: `${data.humidity}%` });
    }
    if (data.wind_speed !== undefined) {
        const windStr = data.wind_direction !== undefined
            ? `${data.wind_speed} m/s ${degreesToCompass(data.wind_direction)}`
            : `${data.wind_speed} m/s`;
        stats.push({ label: 'Wind', value: windStr });
    }
    if (data.pressure !== undefined) {
        stats.push({ label: 'Pressure', value: `${data.pressure} hPa` });
    }
    if (data.clouds !== undefined) {
        stats.push({ label: 'Cloud Cover', value: `${data.clouds}%` });
    }

    return (
        <div className="weather-card mb-2">
            <div className="weather-card__header">
                <div className="weather-card__location-row">
                    <span className="weather-card__location-icon" aria-hidden="true">☁</span>
                    <span className="weather-card__location-name">{locationLabel}</span>
                </div>
                {data.timestamp && (
                    <span className="weather-card__last-updated">
                        Last updated: {formatTime(data.timestamp)}
                    </span>
                )}
            </div>

            <div className="weather-card__body">
                <div className="weather-card__condition-icon" aria-hidden="true">{emoji}</div>
                <div className="weather-card__temp-block">
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

export function dateIsoToHuman(isoDateString: string): string {
    const date = new Date(isoDateString);

    const day = date.getUTCDate();
    const month = date.toLocaleString('en-us', { month: 'short', timeZone: 'UTC' });
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();

    const formattedHours = hours < 10 ? `0${hours}` : hours;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

    return `${day} ${month}, ${formattedHours}:${formattedMinutes}`;
}

export function isoToUnixTimestamp(isoString: string, options: { ceil?: boolean } = {}): number {
    const ceil = options.ceil ?? false;
    const msec = new Date(isoString).getTime();
    if (isNaN(msec)) {
        throw new Error(`invalid iso date: ${isoString}`);
    }
    const sec = msec / 1000;
    if (ceil) {
        return Math.ceil(sec);
    } else {
        return Math.floor(sec);
    }
}

export function dateToUnixTimestamp(date: Date): number {
    return Math.floor(date.getTime() / 1000);
}

export const sleep = (milliseconds: number) => {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

export type SortOrder = 'desc' | 'asc';

export const sortByDate =
    <T>(sortOrder: SortOrder, dateField: keyof T = 'createdAt' as keyof T) =>
    (a: T, b: T) => {
        const dateA = new Date(a[dateField] as string).getTime();
        const dateB = new Date(b[dateField] as string).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    };

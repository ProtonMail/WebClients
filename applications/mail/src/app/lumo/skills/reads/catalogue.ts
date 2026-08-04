/**
 * The shared payload shape of a catalogue read (folders, labels, filters): a counted heading over one
 * line per entry, or a plain sentence when the user has none.
 */
export const serializeCatalogue = (heading: string, rows: string[], emptyMessage: string): string =>
    rows.length ? [heading, ...rows].join('\n') : emptyMessage;

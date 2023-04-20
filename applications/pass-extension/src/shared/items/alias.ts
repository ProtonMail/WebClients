import { normalize } from '@proton/shared/lib/helpers/string';

export function deriveAliasPrefixFromName(name: string) {
    // Normalize unicode representation of the string
    // Remove diacritics (accents)
    return (
        normalize(name, true)
            // Ensure only allowed characters in the output
            .replace(/[^a-z0-9\-\_.]/g, '')
            // 20 max characters length for the auto-derived alias name
            .slice(0, 20)
    );
}

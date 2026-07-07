export function isVegaLanguage(language: string): boolean {
    const normalized = language.toLowerCase();
    return normalized === 'vega' || normalized === 'vega-lite' || normalized.startsWith('vega-');
}

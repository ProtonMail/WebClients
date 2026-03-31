/**
 * Map model-reported language string to ApiDocsCodeBlock CSS modifier (syntax theme).
 */
export function mapCodeLanguageToPreClass(lang: string): 'python' | 'typescript' | 'rust' {
    const l = lang.toLowerCase();
    if (l.includes('python')) {
        return 'python';
    }
    if (l.includes('rust')) {
        return 'rust';
    }
    if (l.includes('typescript') || l.includes('javascript') || l.includes('ts') || l.includes('node')) {
        return 'typescript';
    }
    return 'typescript';
}

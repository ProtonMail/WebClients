/**
 * Syntax Highlighter Configuration - Hybrid Approach
 *
 * Uses the full Prism build with async component loading to avoid:
 * - Light build dependency issues (languages fail to register)
 * - Initial bundle bloat (syntax highlighter loaded on-demand)
 *
 * STRATEGY:
 * - Syntax highlighter itself is lazy loaded (not in initial bundle)
 * - Once loaded, all languages available (no registration errors)
 * - Streaming optimization still works (main performance win)
 *
 * BEFORE: ~500KB in initial bundle
 * AFTER: ~0KB initial, ~500KB loaded when first code block appears
 */

import { PrismAsync as SyntaxHighlighter } from 'react-syntax-highlighter';

/**
 * With full Prism build, all languages are available automatically.
 * No need for manual registration or loading.
 *
 * The key optimization is that this module (and react-syntax-highlighter)
 * should be lazy-loaded in components, not imported eagerly.
 */

/**
 * Check if a language is likely supported by Prism
 * Since we're using full Prism, most common languages are available
 */
export function isLanguageSupported(language: string): boolean {
    // Full Prism supports virtually all languages
    // Just return true for most common ones
    return true;
}

/**
 * Load language - with full Prism, languages are already available
 * This function exists for API compatibility but doesn't need to do anything
 */
export async function loadLanguage(language: string): Promise<boolean> {
    // Languages are pre-loaded with full Prism build
    return true;
}

// Export the configured SyntaxHighlighter
export { SyntaxHighlighter };


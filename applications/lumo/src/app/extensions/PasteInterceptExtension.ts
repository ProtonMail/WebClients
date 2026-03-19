import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface PasteInterceptOptions {
    onInterceptPaste: (text: string, html?: string) => void;
}

export const PasteInterceptExtension = Extension.create<PasteInterceptOptions>({
    name: 'pasteIntercept',

    addOptions() {
        return {
            onInterceptPaste: () => {},
        };
    },

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('pasteIntercept'),
                props: {
                    handlePaste: (view, event) => {
                        const text = event.clipboardData?.getData('text/plain');
                        const html = event.clipboardData?.getData('text/html');

                        if (!text) {
                            return false; // Let default paste behavior handle it
                        }

                        // Check if paste content include code-like content
                        if (looksStructured(text)) {
                            event.preventDefault();

                            this.options.onInterceptPaste(text, html || undefined);

                            return true; // Indicate we handled the paste
                        }

                        // Not code, allow default paste
                        return false;
                    },
                },
            }),
        ];
    },
});

/**
 * Heuristic to detect if pasted text looks like code
 */
export function looksStructured(text: string): boolean {
    if (!text || text.trim().length < 5) return false;

    const lines = text.split('\n').filter((l) => l.trim().length > 0);
    const totalLines = lines.length;
    if (totalLines === 0) return false;

    let score = 0;

    // 1. Structural character density (universal)
    const structuralChars = text.match(/[{}\[\]()<>=;:$#|&+\-*/\\]/g) ?? [];
    const density = structuralChars.length / text.length;

    if (density > 0.015) score += 2;
    if (density > 0.04) score += 1;

    // 2. Repeated structured line prefixes
    const prefixedLines = lines.filter((l) => /^\s*(#|[-*+]|>|`{3}|\d+\.)\s+/.test(l)).length;

    if (prefixedLines >= 2) score += 2;

    // 3. Assignment-like lines (key=value OR key: value)
    const assignmentLines = lines.filter((l) => /^\s*[A-Za-z0-9_.-]+\s*[:=]\s*\S+/.test(l)).length;

    if (assignmentLines >= 1) score += 2;

    // 4. Indentation patterns (nested structure)
    const indentedLines = lines.filter((l) => /^(\s{2,}|\t)/.test(l)).length;

    if (indentedLines >= Math.min(2, totalLines * 0.3)) score += 1;

    // 5. Many short lines (code-style layout)
    const shortLines = lines.filter((l) => l.length < 60).length;
    if (shortLines >= totalLines * 0.6 && totalLines >= 3) score += 1;

    // 6. Operator clusters
    if (/[=<>!&|]{2,}|[-+*/]{2,}/.test(text)) score += 1;

    console.log('looksStructured: score:', score);
    console.log('looksStructured: returned value:', score >= 3);

    // Final decision threshold
    return score >= 3;
}

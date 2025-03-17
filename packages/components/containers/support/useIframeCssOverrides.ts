import { useMemo } from 'react';

import { useTheme } from '@proton/components/containers/themes/ThemeProvider';

// Extract CSS variables from computed styles
const extractCssVariable = (variableName: string) => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    return computedStyle.getPropertyValue(variableName).trim() || 'initial';
};

/**
 * Custom hook to memoize CSS overrides based on theme
 * Returns a CSS string with theme-aware overrides for the help center iframe
 */
export const useHelpCenterIframeStyles = () => {
    const { information } = useTheme();

    return useMemo(() => {
        const cssOverrides = `
            ${(() => {
                const linkNorm = extractCssVariable('--optional-link-norm');
                const linkActive = extractCssVariable('--optional-link-active');
                return linkNorm !== 'initial'
                    ? `
                    main a { color: ${linkNorm} !important; }
                    main a:hover { color: ${linkActive} !important; }
                    main a:focus { color: ${linkActive} !important; }
                `
                    : '';
            })()}
            #plans, #header { display: none !important;}
            #answer { padding-top: 0 !important; padding-bottom: 1rem !important;}
            .w-80 { width: 100% !important;}
            .shadow-s { box-shadow: none !important; }
            .focus-within\\:ring-purple-200:focus-within { --tw-ring-color: ${extractCssVariable('--border-weak')} !important; }
            .md\\:flex-row { flex-direction: row !important; }
            .p-8 { padding: 0 !important; }
            .px-2 { padding-left: 0 !important; padding-right: 0 !important; }
            .px-4 { padding-left: 0 !important; padding-right: 0 !important; }
            [class*="py-"] { padding-bottom: 0 !important;}
            .border-purple-800 { border-color: ${extractCssVariable('--border-norm')} !important; }
            .text-purple-800 { color: ${extractCssVariable('--text-norm')} !important; }
            .text-body { color: ${extractCssVariable('--text-weak')} !important; }
            [class*="bg-purple-"] { background-color: transparent !important; }
            .bg-white { background-color: transparent !important; }
            .bg-transparent { background-color: transparent !important; }
            .bg-gray-100 { background-color: transparent !important; }
            .button-text-shadow { text-shadow: none !important; }
            button.w-full { width: unset !important; }
            button > span > span > span { flex-shrink: 0 !important; }
            [class*="!text-purple-500"] { 
                color: ${extractCssVariable('--primary')} !important; 
            }
            select:disabled { opacity: 0.7 !important; background: ${extractCssVariable('--background-weak')} !important; }
            button.border-purple-500 { border-color: ${extractCssVariable('--primary')} !important; }
            button[class*="bg-purple-"] { background-color: ${extractCssVariable('--primary')} !important; height: 50px !important; padding-top: 0px !important; color: ${extractCssVariable('--primary-contrast')} !important; }
            button[class*="bg-purple-"]:hover { background-color: ${extractCssVariable('--interaction-norm-major-1')} !important; }
            button[class*="bg-purple-"]:active { background-color: ${extractCssVariable('--interaction-norm-major-2')} !important; }
            button[class*="bg-purple-"][class*="shadow-"] { background-color: ${extractCssVariable('--primary-contrast')} !important; color: ${extractCssVariable('--primary')} !important; }
            button[class*="bg-purple-"][class*="shadow-"]:hover { background-color: ${extractCssVariable('--primary')} !important; color: ${extractCssVariable('--primary-contrast')} !important; }
            body { color: ${extractCssVariable('--text-norm')} !important; }
        `.trim();

        return cssOverrides;
    }, [information.theme]); // Only recalculate when theme changes
};

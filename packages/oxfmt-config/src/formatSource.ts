import { type OxfmtConfig, format } from 'oxfmt';

import { createOxfmtConfig, scssOptions } from './createOxfmtConfig.ts';

/**
 * Formats generated code or data with the shared oxfmt options, for scripts that write files and cannot rely on the
 * formatter running afterwards. `fileName` only selects the language, from its extension.
 */
export const formatSource = async (fileName: string, source: string, options: OxfmtConfig = {}) => {
    // Config files are not discovered by the API and ignore patterns only apply to the CLI
    const { ignorePatterns, overrides, ...config } = createOxfmtConfig(options);
    const { code, errors } = await format(fileName, source, {
        ...config,
        ...(fileName.endsWith('.scss') ? scssOptions : {}),
    });

    if (errors.length) {
        throw new Error(`Could not format ${fileName}: ${errors.map(({ message }) => message).join(', ')}`);
    }

    return code;
};

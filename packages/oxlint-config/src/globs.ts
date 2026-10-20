export const typeScriptExtensions = ['.ts', '.cts', '.mts', '.tsx'];
export const allExtensions = [...typeScriptExtensions, '.js', '.jsx', '.mjs', '.cjs'];

export const typescriptGlobs = typeScriptExtensions.map((ext) => `**/*${ext}`);
export const allGlobs = allExtensions.map((ext) => `**/*${ext}`);

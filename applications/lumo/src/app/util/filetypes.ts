/**
 * Centralized file types configuration
 * This file contains all file type definitions, MIME type mappings, and descriptions
 * to eliminate duplication across components.
 */

export interface FileTypeConfig {
    extensions: string[];
    mimeTypes: string[];
    description: string;
    category:
        | 'document'
        | 'spreadsheet'
        | 'presentation'
        | 'text'
        | 'code'
        | 'config'
        | 'log'
        | 'ebook'
        | 'web'
        | 'build'
        | 'image';
    pandocFormat?: string;
}

export const FILE_TYPE_CONFIGS: Record<string, FileTypeConfig> = {
    // Image formats
    jpeg: {
        extensions: ['jpg', 'jpeg'],
        mimeTypes: ['image/jpeg'],
        description: 'JPEG Image',
        category: 'image',
    },
    png: {
        extensions: ['png'],
        mimeTypes: ['image/png'],
        description: 'PNG Image',
        category: 'image',
    },
    gif: {
        extensions: ['gif'],
        mimeTypes: ['image/gif'],
        description: 'GIF Image',
        category: 'image',
    },
    webp: {
        extensions: ['webp'],
        mimeTypes: ['image/webp'],
        description: 'WebP Image',
        category: 'image',
    },
    heic: {
        extensions: ['heic', 'heif'],
        mimeTypes: ['image/heic', 'image/heif'],
        description: 'HEIC Image',
        category: 'image',
    },

    // Document formats
    pdf: {
        extensions: ['pdf'],
        mimeTypes: ['application/pdf'],
        description: 'PDF Document',
        category: 'document',
        // No pandocFormat - uses pdfParse library for text extraction, handled separately in worker
    },
    word: {
        extensions: ['doc', 'docx'],
        mimeTypes: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        description: 'Word Document',
        category: 'document',
        pandocFormat: 'docx',
    },
    odt: {
        extensions: ['odt'],
        mimeTypes: ['application/vnd.oasis.opendocument.text'],
        description: 'ODT Document',
        category: 'document',
        pandocFormat: 'odt',
    },
    rtf: {
        extensions: ['rtf'],
        mimeTypes: ['application/rtf'],
        description: 'RTF Document',
        category: 'document',
        pandocFormat: 'rtf',
    },

    // Spreadsheet formats
    excel: {
        extensions: ['xls', 'xlsx'],
        mimeTypes: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        description: 'Excel Document',
        category: 'spreadsheet',
        // No pandocFormat - uses ExcelJS library for conversion, handled separately in worker
    },
    csv: {
        extensions: ['csv'],
        mimeTypes: ['text/csv', 'application/csv'],
        description: 'CSV',
        category: 'spreadsheet',
        // No pandocFormat - already plain text, decoded directly as UTF-8
    },

    // Note: PowerPoint presentations are not supported
    // Users should convert to PDF for text extraction

    // Text and markup formats
    plaintext: {
        extensions: ['txt'],
        mimeTypes: ['text/plain'],
        description: 'Text File',
        category: 'text',
        // No pandocFormat - processed as plain text
    },
    markdown: {
        extensions: ['md', 'markdown'],
        mimeTypes: ['text/markdown', 'text/x-markdown'],
        description: 'Markdown Document',
        category: 'text',
        // No pandocFormat - already plain text, no conversion needed
    },
    html: {
        extensions: ['html', 'htm'],
        mimeTypes: ['text/html'],
        description: 'HTML Document',
        category: 'web',
        // No pandocFormat - HTML is already readable by LLMs, processed as plain text
    },
    latex: {
        extensions: ['latex', 'tex'],
        mimeTypes: ['text/latex'],
        description: 'LaTeX Document',
        category: 'text',
        // No pandocFormat - already plain text, LLMs can read LaTeX markup directly
    },
    rst: {
        extensions: ['rst'],
        mimeTypes: ['text/rst'],
        description: 'reStructuredText',
        category: 'text',
        // No pandocFormat - already plain text, LLMs can read RST markup directly
    },
    asciidoc: {
        extensions: ['adoc', 'asciidoc', 'asc'],
        mimeTypes: ['text/asciidoc', 'text/x-asciidoc'],
        description: 'AsciiDoc Document',
        category: 'text',
        // No pandocFormat - will be processed as plain text
    },

    // Web files
    css: {
        extensions: ['css'],
        mimeTypes: ['text/css'],
        description: 'CSS File',
        category: 'web',
        // No pandocFormat - processed as plain text
    },
    javascript: {
        extensions: ['js', 'mjs', 'jsx'],
        mimeTypes: ['application/javascript', 'text/javascript'],
        description: 'JavaScript File',
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    typescript: {
        extensions: ['ts', 'tsx'],
        mimeTypes: ['application/typescript', 'text/x-typescript'],
        description: 'TypeScript File',
        category: 'code',
        // No pandocFormat - processed as plain text
    },

    // Data formats
    json: {
        extensions: ['json'],
        mimeTypes: ['application/json'],
        description: 'JSON File',
        category: 'config',
        // No pandocFormat - processed as plain text
    },
    xml: {
        extensions: ['xml'],
        mimeTypes: ['application/xml', 'text/xml'],
        description: 'XML File',
        category: 'config',
        // No pandocFormat - processed as plain text
    },

    // Configuration files
    yaml: {
        extensions: ['yaml', 'yml'],
        mimeTypes: ['application/yaml', 'text/yaml', 'application/x-yaml', 'text/x-yaml'],
        description: 'YAML File',
        category: 'config',
        // No pandocFormat - processed as plain text
    },
    toml: {
        extensions: ['toml'],
        mimeTypes: ['application/toml', 'text/toml'],
        description: 'TOML File',
        category: 'config',
        // No pandocFormat - processed as plain text
    },
    ini: {
        extensions: ['ini', 'cfg', 'conf', 'properties', 'env'],
        mimeTypes: ['text/plain'],
        description: 'Configuration File',
        category: 'config',
        // No pandocFormat - processed as plain text
    },

    // Log files
    log: {
        extensions: ['log'],
        mimeTypes: ['text/x-log', 'application/x-log'],
        description: 'Log File',
        category: 'log',
        // No pandocFormat - processed as plain text
    },

    // Programming languages
    python: {
        extensions: ['py', 'pyw', 'pyi'],
        mimeTypes: ['text/plain', 'text/x-python', 'application/x-python'],
        description: 'Python File',
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    java: {
        extensions: ['java'],
        mimeTypes: ['text/plain', 'text/x-java-source', 'text/x-java'],
        description: 'Java File',
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    cpp: {
        extensions: ['cpp', 'cxx', 'c', 'h', 'hpp', 'hxx', 'cc'],
        mimeTypes: ['text/plain', 'text/x-c', 'text/x-c++', 'text/x-c++src'],
        description: 'C/C++ File',
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    csharp: {
        extensions: ['cs'],
        mimeTypes: ['text/plain', 'text/x-csharp'],
        description: 'C# File',
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    php: {
        extensions: ['php', 'php3', 'php4', 'php5', 'phtml'],
        mimeTypes: ['text/plain', 'text/x-php', 'application/x-php'],
        description: 'PHP File',
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    ruby: {
        extensions: ['rb', 'rbw'],
        mimeTypes: ['text/plain', 'text/x-ruby', 'application/x-ruby'],
        description: 'Ruby File',
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    go: {
        extensions: ['go'],
        mimeTypes: ['text/plain', 'text/x-go'],
        description: 'Go File',
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    rust: {
        extensions: ['rs', 'rlib'],
        mimeTypes: ['text/plain', 'text/x-rust'],
        description: 'Rust File',
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    swift: {
        extensions: ['swift'],
        mimeTypes: ['text/plain'],
        description: 'Swift File',
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    kotlin: {
        extensions: ['kt'],
        mimeTypes: ['text/plain'],
        description: 'Kotlin File',
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    scala: {
        extensions: ['scala'],
        mimeTypes: ['text/plain'],
        description: 'Scala File',
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    clojure: {
        extensions: ['clj'],
        mimeTypes: ['text/plain'],
        description: 'Clojure File',
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    haskell: {
        extensions: ['hs'],
        mimeTypes: ['text/plain'],
        description: 'Haskell File',
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    ocaml: {
        extensions: ['ml'],
        mimeTypes: ['text/plain'],
        description: 'OCaml File',
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    r: {
        extensions: ['r'],
        mimeTypes: ['text/plain'],
        description: 'R File',
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    sql: {
        extensions: ['sql'],
        mimeTypes: ['text/plain', 'text/x-sql', 'application/x-sql'],
        description: 'SQL File',
        category: 'code',
        // No pandocFormat - processed as plain text
    },

    // Additional programming languages
    dart: {
        extensions: ['dart'],
        mimeTypes: ['text/plain', 'text/x-dart'],
        description: 'Dart File',
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    elixir: {
        extensions: ['ex', 'exs'],
        mimeTypes: ['text/plain', 'text/x-elixir'],
        description: 'Elixir File',
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    erlang: {
        extensions: ['erl', 'hrl'],
        mimeTypes: ['text/plain', 'text/x-erlang'],
        description: 'Erlang File',
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    lua: {
        extensions: ['lua'],
        mimeTypes: ['text/plain', 'text/x-lua'],
        description: 'Lua File',
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    perl: {
        extensions: ['pl', 'pm', 'perl'],
        mimeTypes: ['text/plain', 'text/x-perl', 'application/x-perl'],
        description: 'Perl File',
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    groovy: {
        extensions: ['groovy', 'gvy'],
        mimeTypes: ['text/plain', 'text/x-groovy'],
        description: 'Groovy File',
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    vim: {
        extensions: ['vim', 'vimrc'],
        mimeTypes: ['text/plain', 'text/x-vim'],
        description: 'Vim Script',
        category: 'code',
        // No pandocFormat - processed as plain text
    },

    // Shell scripts
    shell: {
        extensions: ['sh', 'bash', 'zsh', 'fish', 'ksh', 'csh', 'tcsh'],
        mimeTypes: ['text/plain', 'text/x-sh', 'application/x-sh', 'text/x-shellscript'],
        description: 'Shell Script',
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    powershell: {
        extensions: ['ps1', 'psm1', 'ps1xml'],
        mimeTypes: ['text/plain', 'text/x-powershell'],
        description: 'PowerShell Script',
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    batch: {
        extensions: ['bat', 'cmd'],
        mimeTypes: ['text/plain', 'application/x-bat'],
        description: 'Batch File',
        category: 'code',
        // No pandocFormat - processed as plain text
    },

    // Build and project files
    dockerfile: {
        extensions: ['dockerfile'],
        mimeTypes: ['text/plain'],
        description: 'Dockerfile',
        category: 'build',
        // No pandocFormat - processed as plain text
    },
    makefile: {
        extensions: ['makefile'],
        mimeTypes: ['text/plain'],
        description: 'Makefile',
        category: 'build',
        // No pandocFormat - processed as plain text
    },
    cmake: {
        extensions: ['cmake'],
        mimeTypes: ['text/plain'],
        description: 'CMake File',
        category: 'build',
        // No pandocFormat - processed as plain text
    },
    gradle: {
        extensions: ['gradle'],
        mimeTypes: ['text/plain'],
        description: 'Gradle File',
        category: 'build',
        // No pandocFormat - processed as plain text
    },
    maven: {
        extensions: ['maven'],
        mimeTypes: ['text/plain'],
        description: 'Maven File',
        category: 'build',
        // No pandocFormat - processed as plain text
    },
    sbt: {
        extensions: ['sbt'],
        mimeTypes: ['text/plain'],
        description: 'SBT File',
        category: 'build',
        // No pandocFormat - processed as plain text
    },
    cargo: {
        extensions: ['cargo'],
        mimeTypes: ['text/plain'],
        description: 'Cargo File',
        category: 'build',
        // No pandocFormat - processed as plain text
    },
    lockfile: {
        extensions: ['lock'],
        mimeTypes: ['text/plain'],
        description: 'Lock File',
        category: 'build',
        // No pandocFormat - processed as plain text
    },
    gitignore: {
        extensions: ['gitignore'],
        mimeTypes: ['text/plain'],
        description: 'Gitignore File',
        category: 'text',
    },
};

// Helper functions
export function getAllSupportedMimeTypes(): Set<string> {
    const mimeTypes = new Set<string>();
    Object.values(FILE_TYPE_CONFIGS).forEach((config) => {
        config.mimeTypes.forEach((mimeType) => mimeTypes.add(mimeType));
    });
    return mimeTypes;
}

export function getAllSupportedExtensions(): Set<string> {
    const extensions = new Set<string>();
    Object.values(FILE_TYPE_CONFIGS).forEach((config) => {
        config.extensions.forEach((ext) => extensions.add(ext));
    });
    return extensions;
}

export function getExtensionToMimeTypeMap(): Record<string, string> {
    const map: Record<string, string> = {};
    Object.values(FILE_TYPE_CONFIGS).forEach((config) => {
        // Use the first MIME type as the primary one
        const mime = config.mimeTypes[0];
        if (!mime) {
            console.warn('Config has no mime types defined');
            return;
        }
        config.extensions.forEach((ext) => {
            map[ext] = mime;
        });
    });
    return map;
}

export function getMimeTypeToDescriptionMap(): Record<string, string> {
    const map: Record<string, string> = {};
    Object.values(FILE_TYPE_CONFIGS).forEach((config) => {
        config.mimeTypes.forEach((mimeType) => {
            // Only set if not already defined (first-wins strategy)
            // This prevents later configs from overwriting earlier ones for shared MIME types like 'text/plain'
            if (!map[mimeType]) {
                map[mimeType] = config.description;
            }
        });
    });
    return map;
}

export function getExtensionToDescriptionMap(): Record<string, string> {
    const map: Record<string, string> = {};
    Object.values(FILE_TYPE_CONFIGS).forEach((config) => {
        config.extensions.forEach((ext) => {
            map[ext] = config.description;
        });
    });
    return map;
}

export function getAcceptAttributeString(): string {
    const mimeTypes = Array.from(getAllSupportedMimeTypes());
    const extensions = Array.from(getAllSupportedExtensions()).map((ext) => `.${ext}`);
    return [...mimeTypes, ...extensions].join(',');
}

export function getFileTypeDescription(fileName: string, mimeType?: string): string {
    // Try file extension first for better accuracy
    // This is especially important for ambiguous MIME types like 'text/plain'
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext) {
        const extToDescMap = getExtensionToDescriptionMap();
        const description = extToDescMap[ext];
        if (description) return description;
    }

    // Fallback to MIME type if extension doesn't match
    if (mimeType) {
        const mimeToDescMap = getMimeTypeToDescriptionMap();
        const description = mimeToDescMap[mimeType];
        if (description) return description;
    }

    return 'File';
}

export function getMimeTypeFromExtension(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext) {
        const extToMimeMap = getExtensionToMimeTypeMap();
        return extToMimeMap[ext] || 'text/plain';
    }
    return 'text/plain';
}

export function isFileTypeSupported(fileName: string, mimeType?: string): boolean {
    const supportedMimeTypes = getAllSupportedMimeTypes();

    // Check MIME type first
    if (mimeType && supportedMimeTypes.has(mimeType)) {
        return true;
    }

    // Fallback to file extension
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext) {
        const supportedExtensions = getAllSupportedExtensions();
        return supportedExtensions.has(ext);
    }

    return false;
}

// Legacy compatibility function
export function mimeToHuman({ mimeType, filename }: { mimeType?: string; filename: string }): string {
    return getFileTypeDescription(filename, mimeType);
}

/**
 * Convert a MIME type to its corresponding Pandoc format
 * Uses the centralized FILE_TYPE_CONFIGS to eliminate duplication
 */
export function mimeTypeToPandocFormat(mimeType: string): string | undefined {
    // Normalize mimeType by converting to lowercase and trimming
    const normalizedMime = mimeType.toLowerCase().trim();

    // Find the config that contains this MIME type
    for (const config of Object.values(FILE_TYPE_CONFIGS)) {
        if (config.mimeTypes.some((mime) => mime.toLowerCase() === normalizedMime)) {
            return config.pandocFormat;
        }
    }

    return undefined;
}

/**
 * Determine if a file type should be processed directly as plain text
 * instead of going through Pandoc conversion
 */
export function shouldProcessAsPlainText(mimeType: string): boolean {
    // Normalize mimeType by converting to lowercase and trimming
    const normalizedMime = mimeType.toLowerCase().trim();

    // Files that should be processed directly as plain text (no Pandoc needed)
    const plainTextTypes = new Set([
        // Code files
        'application/javascript',
        'text/javascript',
        'application/typescript',
        'text/x-typescript',
        'text/x-python',
        'text/x-java-source',
        'text/x-c',
        'text/x-c++',
        'text/x-csharp',
        'text/x-php',
        'text/x-ruby',
        'text/x-go',
        'text/x-rust',
        'text/x-swift',
        'text/x-kotlin',
        'text/x-scala',
        'text/x-clojure',
        'text/x-haskell',
        'text/x-ocaml',
        'text/x-rsrc',
        'text/x-sql',
        'application/x-sql',
        'text/x-sh',
        'application/x-sh',
        'text/x-shellscript',
        'text/x-powershell',
        'application/x-bat',
        'text/x-dart',
        'text/x-elixir',
        'text/x-erlang',
        'text/x-lua',
        'text/x-perl',
        'application/x-perl',
        'text/x-groovy',
        'text/x-vim',
        'application/x-python',
        'application/x-php',
        'application/x-ruby',
        'text/x-c++src',

        // Text and markup formats (already plain text, LLMs can read them directly)
        'text/markdown',
        'text/x-markdown',
        'text/latex',
        'text/rst',
        'text/asciidoc',
        'text/x-asciidoc',

        // Data/Config files
        'application/json',
        'application/xml',
        'text/xml',
        'application/yaml',
        'text/yaml',
        'application/x-yaml',
        'text/x-yaml',
        'application/toml',
        'text/toml',

        // Web files
        'text/css',
        'text/html', // HTML can be processed directly, LLMs understand HTML markup

        // Already handled separately
        'text/plain',
        'text/csv',
        'application/csv',

        // Log files and other plain text
        'text/x-log',
        'application/x-log',
    ]);

    return plainTextTypes.has(normalizedMime);
}

/**
 * Determine if a file type needs actual Pandoc document conversion
 */
export function needsPandocConversion(mimeType: string): boolean {
    // Normalize mimeType by converting to lowercase and trimming
    const normalizedMime = mimeType.toLowerCase().trim();

    // Only binary document formats that need text extraction via Pandoc
    const pandocTypes = new Set([
        // Binary document formats (need Pandoc to extract text)
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.oasis.opendocument.text',
        'application/rtf', // RTF has control codes, needs conversion to clean text
    ]);

    return pandocTypes.has(normalizedMime);
}

/**
 * Processing categories for file routing
 */
export type ProcessingCategory = 'image' | 'text' | 'csv' | 'excel' | 'pdf' | 'document' | 'unsupported';

/**
 * Determine the processing category for a file based on MIME type and filename
 * This is used to route files to the appropriate processor
 */
export function getProcessingCategory(mimeType: string, fileName?: string): ProcessingCategory {
    const normalizedMime = mimeType.toLowerCase().trim();

    // Check against known MIME types in FILE_TYPE_CONFIGS
    for (const config of Object.values(FILE_TYPE_CONFIGS)) {
        if (config.mimeTypes.some((mime) => mime.toLowerCase() === normalizedMime)) {
            // Route based on category
            switch (config.category) {
                case 'image':
                    return 'image';
                case 'spreadsheet':
                    // Distinguish between CSV and Excel
                    if (normalizedMime === 'text/csv' || normalizedMime === 'application/csv') {
                        return 'csv';
                    }
                    return 'excel';
                case 'document':
                    // PDF has special handling
                    if (normalizedMime === 'application/pdf') {
                        return 'pdf';
                    }
                    // Other documents need Pandoc conversion
                    return 'document';
                case 'text':
                case 'code':
                case 'config':
                case 'log':
                case 'web':
                case 'build':
                    return 'text';
                case 'presentation':
                    // Presentations are not supported
                    return 'unsupported';
            }
        }
    }

    // If MIME type not found, try file extension
    if (fileName) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext) {
            for (const config of Object.values(FILE_TYPE_CONFIGS)) {
                if (config.extensions.includes(ext)) {
                    // Same routing logic as above
                    switch (config.category) {
                        case 'image':
                            return 'image';
                        case 'spreadsheet':
                            if (ext === 'csv') {
                                return 'csv';
                            }
                            return 'excel';
                        case 'document':
                            if (ext === 'pdf') {
                                return 'pdf';
                            }
                            return 'document';
                        case 'text':
                        case 'code':
                        case 'config':
                        case 'log':
                        case 'web':
                        case 'build':
                            return 'text';
                        case 'presentation':
                            return 'unsupported';
                    }
                }
            }
        }
    }

    return 'unsupported';
}

/** Get MIME type from filename */
export function getMimeTypeFromName(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        txt: 'text/plain',
        md: 'text/markdown',
        csv: 'text/csv',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        json: 'application/json',
        html: 'text/html',
        xml: 'application/xml',
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

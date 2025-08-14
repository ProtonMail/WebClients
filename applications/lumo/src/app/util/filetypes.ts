/**
 * Centralized file types configuration
 * This file contains all file type definitions, MIME type mappings, and descriptions
 * to eliminate duplication across components.
 */

export interface FileTypeConfig {
    extensions: string[];
    mimeTypes: string[];
    description: string;
    category: 'document' | 'spreadsheet' | 'presentation' | 'text' | 'code' | 'config' | 'log' | 'ebook' | 'web' | 'build';
    pandocFormat?: string;
}

export const FILE_TYPE_CONFIGS: Record<string, FileTypeConfig> = {
    // Document formats
    pdf: {
        extensions: ['pdf'],
        mimeTypes: ['application/pdf'],
        description: 'PDF Document',
        category: 'document',
        pandocFormat: 'pdf'
    },
    word: {
        extensions: ['doc', 'docx'],
        mimeTypes: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        description: 'Word Document',
        category: 'document',
        pandocFormat: 'docx'
    },
    odt: {
        extensions: ['odt'],
        mimeTypes: ['application/vnd.oasis.opendocument.text'],
        description: 'ODT Document',
        category: 'document',
        pandocFormat: 'odt'
    },
    rtf: {
        extensions: ['rtf'],
        mimeTypes: ['application/rtf'],
        description: 'RTF Document',
        category: 'document',
        pandocFormat: 'rtf'
    },

    // Spreadsheet formats
    excel: {
        extensions: ['xls', 'xlsx'],
        mimeTypes: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        description: 'Excel Document',
        category: 'spreadsheet',
        pandocFormat: 'csv'
    },
    csv: {
        extensions: ['csv'],
        mimeTypes: ['text/csv', 'application/csv'],
        description: 'CSV',
        category: 'spreadsheet',
        pandocFormat: 'csv'
    },

    // Presentation formats
    powerpoint: {
        extensions: ['ppt', 'pptx'],
        mimeTypes: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
        description: 'PowerPoint Document',
        category: 'presentation',
        pandocFormat: 'pptx'
    },

    // Text and markup formats
    plaintext: {
        extensions: ['txt'],
        mimeTypes: ['text/plain'],
        description: 'Text Document',
        category: 'text',
        pandocFormat: 'markdown'
    },
    markdown: {
        extensions: ['md', 'markdown'],
        mimeTypes: ['text/markdown', 'text/x-markdown'],
        description: 'Markdown Document',
        category: 'text',
        pandocFormat: 'markdown'
    },
    html: {
        extensions: ['html', 'htm'],
        mimeTypes: ['text/html'],
        description: 'HTML Document',
        category: 'web',
        pandocFormat: 'html'
    },
    latex: {
        extensions: ['latex', 'tex'],
        mimeTypes: ['text/latex'],
        description: 'LaTeX Document',
        category: 'text',
        pandocFormat: 'latex'
    },
    rst: {
        extensions: ['rst'],
        mimeTypes: ['text/rst'],
        description: 'reStructuredText',
        category: 'text',
        pandocFormat: 'rst'
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
        pandocFormat: 'markdown'
    },
    javascript: {
        extensions: ['js', 'mjs', 'jsx'],
        mimeTypes: ['application/javascript', 'text/javascript'],
        description: 'JavaScript File',
        category: 'code',
        pandocFormat: 'markdown'
    },
    typescript: {
        extensions: ['ts', 'tsx'],
        mimeTypes: ['application/typescript', 'text/x-typescript'],
        description: 'TypeScript File',
        category: 'code',
        pandocFormat: 'markdown'
    },

    // Data formats
    json: {
        extensions: ['json'],
        mimeTypes: ['application/json'],
        description: 'JSON File',
        category: 'config',
        pandocFormat: 'markdown'
    },
    xml: {
        extensions: ['xml'],
        mimeTypes: ['application/xml', 'text/xml'],
        description: 'XML File',
        category: 'config',
        pandocFormat: 'markdown'
    },

    // Configuration files
    yaml: {
        extensions: ['yaml', 'yml'],
        mimeTypes: ['application/yaml', 'text/yaml', 'application/x-yaml', 'text/x-yaml'],
        description: 'YAML File',
        category: 'config',
        pandocFormat: 'markdown'
    },
    toml: {
        extensions: ['toml'],
        mimeTypes: ['application/toml', 'text/toml'],
        description: 'TOML File',
        category: 'config',
        pandocFormat: 'markdown'
    },
    ini: {
        extensions: ['ini', 'cfg', 'conf', 'properties', 'env'],
        mimeTypes: ['text/plain'],
        description: 'Configuration File',
        category: 'config',
        pandocFormat: 'markdown'
    },

    // Log files
    log: {
        extensions: ['log'],
        mimeTypes: ['text/x-log', 'application/x-log'],
        description: 'Log File',
        category: 'log',
        pandocFormat: 'markdown'
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
        mimeTypes: ['text/plain', 'text/x-java-source'],
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
        pandocFormat: 'markdown'
    },
    kotlin: {
        extensions: ['kt'],
        mimeTypes: ['text/plain'],
        description: 'Kotlin File',
        category: 'code',
        pandocFormat: 'markdown'
    },
    scala: {
        extensions: ['scala'],
        mimeTypes: ['text/plain'],
        description: 'Scala File',
        category: 'code',
        pandocFormat: 'markdown'
    },
    clojure: {
        extensions: ['clj'],
        mimeTypes: ['text/plain'],
        description: 'Clojure File',
        category: 'code',
        pandocFormat: 'markdown'
    },
    haskell: {
        extensions: ['hs'],
        mimeTypes: ['text/plain'],
        description: 'Haskell File',
        category: 'code',
        pandocFormat: 'markdown'
    },
    ocaml: {
        extensions: ['ml'],
        mimeTypes: ['text/plain'],
        description: 'OCaml File',
        category: 'code',
        pandocFormat: 'markdown'
    },
    r: {
        extensions: ['r'],
        mimeTypes: ['text/plain'],
        description: 'R File',
        category: 'code',
        pandocFormat: 'markdown'
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
        pandocFormat: 'markdown'
    },
    makefile: {
        extensions: ['makefile'],
        mimeTypes: ['text/plain'],
        description: 'Makefile',
        category: 'build',
        pandocFormat: 'markdown'
    },
    cmake: {
        extensions: ['cmake'],
        mimeTypes: ['text/plain'],
        description: 'CMake File',
        category: 'build',
        pandocFormat: 'markdown'
    },
    gradle: {
        extensions: ['gradle'],
        mimeTypes: ['text/plain'],
        description: 'Gradle File',
        category: 'build',
        pandocFormat: 'markdown'
    },
    maven: {
        extensions: ['maven'],
        mimeTypes: ['text/plain'],
        description: 'Maven File',
        category: 'build',
        pandocFormat: 'markdown'
    },
    sbt: {
        extensions: ['sbt'],
        mimeTypes: ['text/plain'],
        description: 'SBT File',
        category: 'build',
        pandocFormat: 'markdown'
    },
    cargo: {
        extensions: ['cargo'],
        mimeTypes: ['text/plain'],
        description: 'Cargo File',
        category: 'build',
        pandocFormat: 'markdown'
    },
    lockfile: {
        extensions: ['lock'],
        mimeTypes: ['text/plain'],
        description: 'Lock File',
        category: 'build',
        pandocFormat: 'markdown'
    },
    gitignore: {
        extensions: ['gitignore'],
        mimeTypes: ['text/plain'],
        description: 'Git Ignore File',
        category: 'config',
        pandocFormat: 'markdown'
    }
};

// Helper functions
export function getAllSupportedMimeTypes(): Set<string> {
    const mimeTypes = new Set<string>();
    Object.values(FILE_TYPE_CONFIGS).forEach(config => {
        config.mimeTypes.forEach(mimeType => mimeTypes.add(mimeType));
    });
    return mimeTypes;
}

export function getAllSupportedExtensions(): Set<string> {
    const extensions = new Set<string>();
    Object.values(FILE_TYPE_CONFIGS).forEach(config => {
        config.extensions.forEach(ext => extensions.add(ext));
    });
    return extensions;
}

export function getExtensionToMimeTypeMap(): Record<string, string> {
    const map: Record<string, string> = {};
    Object.values(FILE_TYPE_CONFIGS).forEach(config => {
        config.extensions.forEach(ext => {
            // Use the first MIME type as the primary one
            map[ext] = config.mimeTypes[0];
        });
    });
    return map;
}

export function getMimeTypeToDescriptionMap(): Record<string, string> {
    const map: Record<string, string> = {};
    Object.values(FILE_TYPE_CONFIGS).forEach(config => {
        config.mimeTypes.forEach(mimeType => {
            map[mimeType] = config.description;
        });
    });
    return map;
}

export function getExtensionToDescriptionMap(): Record<string, string> {
    const map: Record<string, string> = {};
    Object.values(FILE_TYPE_CONFIGS).forEach(config => {
        config.extensions.forEach(ext => {
            map[ext] = config.description;
        });
    });
    return map;
}

export function getAcceptAttributeString(): string {
    const mimeTypes = Array.from(getAllSupportedMimeTypes());
    const extensions = Array.from(getAllSupportedExtensions()).map(ext => `.${ext}`);
    return [...mimeTypes, ...extensions].join(',');
}

export function getFileTypeDescription(fileName: string, mimeType?: string): string {
    // Try MIME type first
    if (mimeType) {
        const mimeToDescMap = getMimeTypeToDescriptionMap();
        const description = mimeToDescMap[mimeType];
        if (description) return description;
    }

    // Fallback to file extension
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext) {
        const extToDescMap = getExtensionToDescriptionMap();
        const description = extToDescMap[ext];
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
        if (config.mimeTypes.some(mime => mime.toLowerCase() === normalizedMime)) {
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
        
        // Text and markup formats (processed as plain text, no Pandoc)
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
        'text/html',  // HTML can be processed directly, LLMs understand HTML markup
        
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
    
    // Files that actually benefit from Pandoc conversion
    const pandocTypes = new Set([
        // Markup formats that benefit from conversion
        'text/markdown',
        'text/x-markdown', 
        'text/latex',
        'text/rst',
        
        // Document formats (handled by Pandoc)
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.oasis.opendocument.text',
        'application/rtf',
        
        // Presentation formats
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ]);
    
    return pandocTypes.has(normalizedMime);
}

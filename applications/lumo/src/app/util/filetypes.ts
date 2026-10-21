import { c } from 'ttag';

/**
 * Centralized file types configuration
 * This file contains all file type definitions, MIME type mappings, and descriptions
 * to eliminate duplication across components.
 */

interface FileTypeConfig {
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

const FILE_TYPE_CONFIGS: Record<string, FileTypeConfig> = {
    // Image formats
    jpeg: {
        extensions: ['jpg', 'jpeg'],
        mimeTypes: ['image/jpeg'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`JPEG Image`;
        },
        category: 'image',
    },
    png: {
        extensions: ['png'],
        mimeTypes: ['image/png'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`PNG Image`;
        },
        category: 'image',
    },
    gif: {
        extensions: ['gif'],
        mimeTypes: ['image/gif'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`GIF Image`;
        },
        category: 'image',
    },
    webp: {
        extensions: ['webp'],
        mimeTypes: ['image/webp'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`WebP Image`;
        },
        category: 'image',
    },
    heic: {
        extensions: ['heic', 'heif'],
        mimeTypes: ['image/heic', 'image/heif'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`HEIC Image`;
        },
        category: 'image',
    },

    // Document formats
    pdf: {
        extensions: ['pdf'],
        mimeTypes: ['application/pdf'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`PDF Document`;
        },
        category: 'document',
        // No pandocFormat - uses pdfParse library for text extraction, handled separately in worker
    },
    word: {
        extensions: ['doc', 'docx'],
        mimeTypes: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Word Document`;
        },
        category: 'document',
        pandocFormat: 'docx',
    },
    odt: {
        extensions: ['odt'],
        mimeTypes: ['application/vnd.oasis.opendocument.text'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`ODT Document`;
        },
        category: 'document',
        pandocFormat: 'odt',
    },
    rtf: {
        extensions: ['rtf'],
        mimeTypes: ['application/rtf'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`RTF Document`;
        },
        category: 'document',
        pandocFormat: 'rtf',
    },

    // Spreadsheet formats
    excel: {
        extensions: ['xls', 'xlsx'],
        mimeTypes: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Excel Document`;
        },
        category: 'spreadsheet',
        // No pandocFormat - uses SheetJS for conversion, handled separately in worker
    },
    csv: {
        extensions: ['csv'],
        mimeTypes: ['text/csv', 'application/csv'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`CSV`;
        },
        category: 'spreadsheet',
        // No pandocFormat - already plain text, decoded directly as UTF-8
    },

    // Note: PowerPoint presentations are not supported
    // Users should convert to PDF for text extraction

    // Text and markup formats
    plaintext: {
        extensions: ['txt'],
        mimeTypes: ['text/plain'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Text File`;
        },
        category: 'text',
        // No pandocFormat - processed as plain text
    },
    markdown: {
        extensions: ['md', 'markdown'],
        mimeTypes: ['text/markdown', 'text/x-markdown'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Markdown Document`;
        },
        category: 'text',
        // No pandocFormat - already plain text, no conversion needed
    },
    html: {
        extensions: ['html', 'htm'],
        mimeTypes: ['text/html'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`HTML Document`;
        },
        category: 'web',
        // No pandocFormat - HTML is already readable by LLMs, processed as plain text
    },
    latex: {
        extensions: ['latex', 'tex'],
        mimeTypes: ['text/latex'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`LaTeX Document`;
        },
        category: 'text',
        // No pandocFormat - already plain text, LLMs can read LaTeX markup directly
    },
    rst: {
        extensions: ['rst'],
        mimeTypes: ['text/rst'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`reStructuredText`;
        },
        category: 'text',
        // No pandocFormat - already plain text, LLMs can read RST markup directly
    },
    asciidoc: {
        extensions: ['adoc', 'asciidoc', 'asc'],
        mimeTypes: ['text/asciidoc', 'text/x-asciidoc'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`AsciiDoc Document`;
        },
        category: 'text',
        // No pandocFormat - will be processed as plain text
    },

    // Web files
    css: {
        extensions: ['css'],
        mimeTypes: ['text/css'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`CSS File`;
        },
        category: 'web',
        // No pandocFormat - processed as plain text
    },
    javascript: {
        extensions: ['js', 'mjs', 'jsx'],
        mimeTypes: ['application/javascript', 'text/javascript'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`JavaScript File`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    typescript: {
        extensions: ['ts', 'tsx'],
        mimeTypes: ['application/typescript', 'text/x-typescript'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`TypeScript File`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },

    // Data formats
    json: {
        extensions: ['json'],
        mimeTypes: ['application/json'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`JSON File`;
        },
        category: 'config',
        // No pandocFormat - processed as plain text
    },
    xml: {
        extensions: ['xml'],
        mimeTypes: ['application/xml', 'text/xml'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`XML File`;
        },
        category: 'config',
        // No pandocFormat - processed as plain text
    },
    gpx: {
        extensions: ['gpx'],
        mimeTypes: ['application/gpx+xml', 'application/xml', 'text/xml'],
        description: 'GPX Route File',
        category: 'config',
        // No pandocFormat - GPX is XML; processed as plain text
    },

    // Configuration files
    yaml: {
        extensions: ['yaml', 'yml'],
        mimeTypes: ['application/yaml', 'text/yaml', 'application/x-yaml', 'text/x-yaml'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`YAML File`;
        },
        category: 'config',
        // No pandocFormat - processed as plain text
    },
    toml: {
        extensions: ['toml'],
        mimeTypes: ['application/toml', 'text/toml'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`TOML File`;
        },
        category: 'config',
        // No pandocFormat - processed as plain text
    },
    ini: {
        extensions: ['ini', 'cfg', 'conf', 'properties', 'env'],
        mimeTypes: ['text/plain'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Configuration File`;
        },
        category: 'config',
        // No pandocFormat - processed as plain text
    },

    // Log files
    log: {
        extensions: ['log'],
        mimeTypes: ['text/x-log', 'application/x-log'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Log File`;
        },
        category: 'log',
        // No pandocFormat - processed as plain text
    },

    // Programming languages
    python: {
        extensions: ['py', 'pyw', 'pyi'],
        mimeTypes: ['text/plain', 'text/x-python', 'application/x-python'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Python File`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    java: {
        extensions: ['java'],
        mimeTypes: ['text/plain', 'text/x-java-source', 'text/x-java'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Java File`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    cpp: {
        extensions: ['cpp', 'cxx', 'c', 'h', 'hpp', 'hxx', 'cc'],
        mimeTypes: ['text/plain', 'text/x-c', 'text/x-c++', 'text/x-c++src'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`C/C++ File`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    csharp: {
        extensions: ['cs'],
        mimeTypes: ['text/plain', 'text/x-csharp'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`C# File`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    php: {
        extensions: ['php', 'php3', 'php4', 'php5', 'phtml'],
        mimeTypes: ['text/plain', 'text/x-php', 'application/x-php'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`PHP File`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    ruby: {
        extensions: ['rb', 'rbw'],
        mimeTypes: ['text/plain', 'text/x-ruby', 'application/x-ruby'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Ruby File`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    go: {
        extensions: ['go'],
        mimeTypes: ['text/plain', 'text/x-go'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Go File`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    rust: {
        extensions: ['rs', 'rlib'],
        mimeTypes: ['text/plain', 'text/x-rust'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Rust File`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    swift: {
        extensions: ['swift'],
        mimeTypes: ['text/plain'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Swift File`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    kotlin: {
        extensions: ['kt'],
        mimeTypes: ['text/plain'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Kotlin File`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    scala: {
        extensions: ['scala'],
        mimeTypes: ['text/plain'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Scala File`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    clojure: {
        extensions: ['clj'],
        mimeTypes: ['text/plain'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Clojure File`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    haskell: {
        extensions: ['hs'],
        mimeTypes: ['text/plain'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Haskell File`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    ocaml: {
        extensions: ['ml'],
        mimeTypes: ['text/plain'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`OCaml File`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    matlab: {
        extensions: ['m'],
        mimeTypes: ['text/plain', 'text/x-matlab', 'text/x-mathematica'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`MATLAB/Mathematica File`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    r: {
        extensions: ['r'],
        mimeTypes: ['text/plain'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`R File`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    sql: {
        extensions: ['sql'],
        mimeTypes: ['text/plain', 'text/x-sql', 'application/x-sql'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`SQL File`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },

    // Additional programming languages
    dart: {
        extensions: ['dart'],
        mimeTypes: ['text/plain', 'text/x-dart'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Dart File`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    elixir: {
        extensions: ['ex', 'exs'],
        mimeTypes: ['text/plain', 'text/x-elixir'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Elixir File`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    erlang: {
        extensions: ['erl', 'hrl'],
        mimeTypes: ['text/plain', 'text/x-erlang'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Erlang File`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    lua: {
        extensions: ['lua'],
        mimeTypes: ['text/plain', 'text/x-lua'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Lua File`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    perl: {
        extensions: ['pl', 'pm', 'perl'],
        mimeTypes: ['text/plain', 'text/x-perl', 'application/x-perl'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Perl File`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    groovy: {
        extensions: ['groovy', 'gvy'],
        mimeTypes: ['text/plain', 'text/x-groovy'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Groovy File`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    vim: {
        extensions: ['vim', 'vimrc'],
        mimeTypes: ['text/plain', 'text/x-vim'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Vim Script`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },

    // Shell scripts
    shell: {
        extensions: ['sh', 'bash', 'zsh', 'fish', 'ksh', 'csh', 'tcsh'],
        mimeTypes: ['text/plain', 'text/x-sh', 'application/x-sh', 'text/x-shellscript'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Shell Script`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    powershell: {
        extensions: ['ps1', 'psm1', 'ps1xml'],
        mimeTypes: ['text/plain', 'text/x-powershell'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`PowerShell Script`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },
    batch: {
        extensions: ['bat', 'cmd'],
        mimeTypes: ['text/plain', 'application/x-bat'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Batch File`;
        },
        category: 'code',
        // No pandocFormat - processed as plain text
    },

    // Build and project files
    dockerfile: {
        extensions: ['dockerfile'],
        mimeTypes: ['text/plain'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Dockerfile`;
        },
        category: 'build',
        // No pandocFormat - processed as plain text
    },
    makefile: {
        extensions: ['makefile'],
        mimeTypes: ['text/plain'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Makefile`;
        },
        category: 'build',
        // No pandocFormat - processed as plain text
    },
    cmake: {
        extensions: ['cmake'],
        mimeTypes: ['text/plain'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`CMake File`;
        },
        category: 'build',
        // No pandocFormat - processed as plain text
    },
    gradle: {
        extensions: ['gradle'],
        mimeTypes: ['text/plain'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Gradle File`;
        },
        category: 'build',
        // No pandocFormat - processed as plain text
    },
    maven: {
        extensions: ['maven'],
        mimeTypes: ['text/plain'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Maven File`;
        },
        category: 'build',
        // No pandocFormat - processed as plain text
    },
    sbt: {
        extensions: ['sbt'],
        mimeTypes: ['text/plain'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`SBT File`;
        },
        category: 'build',
        // No pandocFormat - processed as plain text
    },
    cargo: {
        extensions: ['cargo'],
        mimeTypes: ['text/plain'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Cargo File`;
        },
        category: 'build',
        // No pandocFormat - processed as plain text
    },
    lockfile: {
        extensions: ['lock'],
        mimeTypes: ['text/plain'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Lock File`;
        },
        category: 'build',
        // No pandocFormat - processed as plain text
    },
    gitignore: {
        extensions: ['gitignore'],
        mimeTypes: ['text/plain'],
        get description() {
            // translator: Human-readable file type description shown for attachments.
            return c('collider_2025:Label').t`Gitignore File`;
        },
        category: 'text',
    },
};

// Helper functions
function getAllSupportedMimeTypes(): Set<string> {
    const mimeTypes = new Set<string>();
    Object.values(FILE_TYPE_CONFIGS).forEach((config) => {
        config.mimeTypes.forEach((mimeType) => mimeTypes.add(mimeType));
    });
    return mimeTypes;
}

function getAllSupportedExtensions(): Set<string> {
    const extensions = new Set<string>();
    Object.values(FILE_TYPE_CONFIGS).forEach((config) => {
        config.extensions.forEach((ext) => extensions.add(ext));
    });
    return extensions;
}

function getExtensionToMimeTypeMap(): Record<string, string> {
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

function getMimeTypeToDescriptionMap(): Record<string, string> {
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

function getExtensionToDescriptionMap(): Record<string, string> {
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

    // translator: Fallback attachment type when the format is unknown.
    return c('collider_2025:Label').t`File`;
}

/** Extensions that must never be indexed, extracted, or attached to context. */
const BLOCKED_FILE_EXTENSIONS = new Set(['ai']);

export function isBlockedFileExtension(fileName: string): boolean {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext ? BLOCKED_FILE_EXTENSIONS.has(ext) : false;
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
    if (isBlockedFileExtension(fileName)) {
        return false;
    }

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

/** Proton Docs, Sheets, etc. are Drive-native formats that cannot be read as plain files yet. */
export function isProtonNativeMediaType(mediaType?: string): boolean {
    return !!mediaType?.startsWith('application/vnd.proton');
}

/** Whether a Drive file can be listed, downloaded and read by Lumo. */
export function isDriveFileSupported(fileName: string, mediaType?: string): boolean {
    return !isProtonNativeMediaType(mediaType) && isFileTypeSupported(fileName, mediaType);
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
 * Processing categories for file routing
 */
export type ProcessingCategory = 'image' | 'text' | 'csv' | 'excel' | 'pdf' | 'document' | 'unsupported';

/**
 * Determine the processing category for a file based on MIME type and filename
 * This is used to route files to the appropriate processor
 */
export function getProcessingCategory(mimeType: string, fileName?: string): ProcessingCategory {
    if (fileName && isBlockedFileExtension(fileName)) {
        return 'unsupported';
    }

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
        gpx: 'application/gpx+xml',
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

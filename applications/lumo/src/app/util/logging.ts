type LogLevel = 'off' | 'error' | 'warn' | 'log' | 'debug';

const STORAGE_KEY = 'lumo-config';
const DEFAULT_LEVEL: LogLevel = 'error';

interface LumoConfig {
    logLevel: LogLevel;
    [key: string]: any; // Allow other config properties
}

// Store originals for potential restoration
const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
};

// Runtime log level
let currentLogLevel: LogLevel = DEFAULT_LEVEL;

// Log level hierarchy mapping
const LOG_LEVELS: Record<LogLevel, number> = {
    off: 0,
    error: 1,
    warn: 2,
    log: 3,
    debug: 4,
};

// Read config from localStorage, preserving other keys
function readConfig(): LumoConfig {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const config = JSON.parse(stored) as LumoConfig;
            // Ensure logLevel exists and is valid, otherwise use default
            if (!config.logLevel || !(config.logLevel in LOG_LEVELS)) {
                config.logLevel = DEFAULT_LEVEL;
            }
            return config;
        }
    } catch (e) {
        // JSON parse error or localStorage not available
    }

    // Return default config
    return { logLevel: DEFAULT_LEVEL };
}

// Write config to localStorage, preserving other keys
function writeConfig(updates: Partial<LumoConfig>): void {
    try {
        const currentConfig = readConfig();
        const newConfig = { ...currentConfig, ...updates };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch (e) {
        // localStorage might not be available, silently fail
    }
}

// Check if a specific log type should be shown
function shouldLog(logType: keyof typeof originalConsole): boolean {
    const currentLevelValue = LOG_LEVELS[currentLogLevel];
    const requestedLevelValue = LOG_LEVELS[logType as LogLevel] || 0;
    return requestedLevelValue <= currentLevelValue;
}

// Set log level and persist to localStorage
function setLogLevel(level: LogLevel): void {
    currentLogLevel = level;
    writeConfig({ logLevel: level });
}

// Get current log level
function getLogLevel(): LogLevel {
    return currentLogLevel;
}

// Simple user-facing functions
function enableLogs(): void {
    setLogLevel('debug');
}

function disableLogs(): void {
    setLogLevel('off');
}

// Initialize log level from URL params or localStorage
function initializeLogLevel(): void {
    // Check URL query parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const urlLogLevel = urlParams.get('logLevel') as LogLevel;

    if (urlLogLevel && urlLogLevel in LOG_LEVELS) {
        currentLogLevel = urlLogLevel;
        return;
    }

    // Check localStorage config
    const config = readConfig();
    currentLogLevel = config.logLevel;
}

// Override console methods
function overrideConsole(): void {
    console.log = (...args: any[]) => {
        if (shouldLog('log')) {
            originalConsole.log.apply(console, args);
        }
    };

    console.warn = (...args: any[]) => {
        if (shouldLog('warn')) {
            originalConsole.warn.apply(console, args);
        }
    };

    console.error = (...args: any[]) => {
        if (shouldLog('error')) {
            originalConsole.error.apply(console, args);
        }
    };

    console.debug = (...args: any[]) => {
        if (shouldLog('debug')) {
            originalConsole.debug.apply(console, args);
        }
    };
}

// Restore original console methods (for debugging/testing)
function restoreConsole(): void {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;
}

// Initialize and setup
export function initializeConsoleOverride(): void {
    initializeLogLevel();
    overrideConsole();

    // Expose global functions
    (window as any).enableLogs = enableLogs;
    (window as any).disableLogs = disableLogs;
    (window as any).getLogLevel = getLogLevel;
    (window as any).setLogLevel = setLogLevel;

    // For debugging/testing purposes
    (window as any).restoreConsole = restoreConsole;
    (window as any).overrideConsole = overrideConsole;
}

// Type declarations for global functions
declare global {
    interface Window {
        enableLogs(): void;
        disableLogs(): void;
        getLogLevel(): LogLevel;
        setLogLevel(level: LogLevel): void;
        restoreConsole(): void;
        overrideConsole(): void;
    }
}

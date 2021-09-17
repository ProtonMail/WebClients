export function getErrorString(error?: any, fallback?: string): string {
    if (error) {
        return error.message || `${error}`;
    }
    return fallback || 'Unkown error';
}

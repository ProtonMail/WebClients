export const authenticatedPath = (path: string) => `/u/*/${path.replace(/^\//, '')}`.replace(/\/+$/, '');

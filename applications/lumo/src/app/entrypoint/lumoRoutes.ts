export const LUMO_ROUTES = {
    PRIVATE_ROUTES_PREFIX: '/u/',
    LOGIN_ROUTE: '/login',
    GUEST: '/guest',
    // Minimal, single-agent chatbot surface. Runs in guest mode so it loads almost instantly.
    AGENT: '/agent',
    AI_PAPER_TRAIL: '/aitrail',
} as const;

export const isGuestPathname = (pathname: string): boolean =>
    pathname === LUMO_ROUTES.GUEST || pathname.startsWith(`${LUMO_ROUTES.GUEST}/`);

export const isAgentPathname = (pathname: string): boolean =>
    pathname === LUMO_ROUTES.AGENT || pathname.startsWith(`${LUMO_ROUTES.AGENT}/`);

export const isPublicPathname = (pathname: string): boolean =>
    isGuestPathname(pathname) || isAgentPathname(pathname) || pathname === LUMO_ROUTES.AI_PAPER_TRAIL;

/** Home route when exiting paper trail. */
export const getPaperTrailExitPath = (): string => {
    return '/';
};

export const isStandalonePaperTrailPath = (pathname: string): boolean => {
    return pathname.replace(/\/+$/, '') === LUMO_ROUTES.AI_PAPER_TRAIL;
};

/** Leave paper trail for Lumo home (`/`). Uses a full navigation from standalone `/aitrail`. */
export const exitPaperTrail = (pathname: string, navigate: (path: string) => void): void => {
    if (isStandalonePaperTrailPath(pathname)) {
        window.location.assign(getPaperTrailExitPath());
        return;
    }

    navigate(getPaperTrailExitPath());
};

import type { ReactNode } from 'react';

/*
 * Meant to wrap portions of ui that we know are for certain only
 * rendered if a user visits the app(s) while unauthenticated.
 */
const UnAuthenticated = ({ children }: { children: ReactNode }) => {
    return <>{children}</>;
};

export default UnAuthenticated;

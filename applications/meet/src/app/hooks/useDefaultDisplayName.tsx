import { useUser } from '@proton/account/user/hooks';

export function useDefaultDisplayName() {
    let displayName: string | undefined;

    try {
        const [user] = useUser();
        displayName = user?.Name;
    } catch {
        displayName = undefined;
    }

    return displayName || process.env.DEFAULT_NAME || '';
}

const useDefaultDisplayNameAuthenticated = () => {
    const [user] = useUser();
    return user?.Name || process.env.DEFAULT_NAME || '';
};

const useDefaultDisplayNameUnauthenticated = () => {
    return process.env.DEFAULT_NAME || '';
};

export const defaultDisplayNameHooks = {
    authenticated: useDefaultDisplayNameAuthenticated,
    unauthenticated: useDefaultDisplayNameUnauthenticated,
};

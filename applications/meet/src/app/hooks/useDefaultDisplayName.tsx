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

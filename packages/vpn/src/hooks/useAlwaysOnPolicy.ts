import { useEffect, useState } from 'react';

import { useAlwaysOnPolicyService } from '../contexts/AlwaysOnPolicyServiceContext';
import type { AlwaysOnPolicy } from '../types/AlwaysOn';

/**
 * Fetches the organization's Always-on VPN device policy through the policy service.
 *
 * `policy === null` means "never configured" (show the call-to-action); a policy means "show the
 * overview", whether or not enforcement is currently enabled.
 *
 * `enabled` holds the request back until we know the organization can actually use the feature, so
 * plans without it never call the endpoint. It stays loading while disabled — there is nothing to show.
 */
export const useAlwaysOnPolicy = ({ enabled }: { enabled: boolean }) => {
    const service = useAlwaysOnPolicyService();
    const [policy, setPolicy] = useState<AlwaysOnPolicy | null>(null);
    const [isLoading, setLoading] = useState(true);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        let active = true;

        const load = async () => {
            try {
                const result = await service.fetchPolicy();
                if (active) {
                    setPolicy(result);
                }
            } catch {
                if (active) {
                    setPolicy(null);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        void load();

        return () => {
            active = false;
        };
    }, [service, enabled]);

    return { policy, isLoading, setPolicy };
};

export default useAlwaysOnPolicy;

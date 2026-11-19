import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';

/** B2B admins and members can't start a personal Drive import. Also restricted while loading. */
export const useIsDriveImportRestricted = (): boolean => {
    const [{ isB2B }, loading] = useEntitlementChecksForOrgAndUser();
    return loading || isB2B;
};

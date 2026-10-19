import { toggleAppCache } from "../electronSession/appCache";
import { FeatureFlag } from "./flags";

export type FeatureFlagChangeHandlers = Partial<Record<FeatureFlag, ((enabled: boolean) => void)[]>>;

export const featureFlagChangeHandlers: FeatureFlagChangeHandlers = {
    [FeatureFlag.APP_SESSION_CACHE_DISABLED]: [(disabled) => toggleAppCache(!disabled)],
};

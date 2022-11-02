import { isToday, isValid } from 'date-fns';

import { FeatureContextValue } from '../features';

const getShouldOpenMigrationModal = (migrationModalLastShownFeature: FeatureContextValue<string>) => {
    const isProtonMailDomain = window.location.hostname.endsWith('.protonmail.com');
    const lastShown = migrationModalLastShownFeature.feature?.Value;

    const alreadyShownToday = (() => {
        if (!lastShown) {
            return false;
        }

        const lastShownDate = new Date(lastShown);

        if (!isValid(lastShownDate)) {
            return false;
        }

        return isToday(lastShownDate);
    })();

    const shouldOpen =
        isProtonMailDomain && !migrationModalLastShownFeature.loading && lastShown !== undefined && !alreadyShownToday;

    return shouldOpen;
};

export default getShouldOpenMigrationModal;

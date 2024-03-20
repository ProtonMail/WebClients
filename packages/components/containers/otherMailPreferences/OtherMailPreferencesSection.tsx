import { isElectronMail } from '@proton/shared/lib/helpers/desktop';

import { FeatureCode, useFeature } from '../..';
import { SenderImages } from './SenderImages';
import { UnreadFaviconCounter } from './UnreadFaviconCounter';

export const OtherMailPreferencesSection = () => {
    const isUnreadFaviconEnabled = !!useFeature(FeatureCode.UnreadFavicon).feature?.Value;

    return (
        <div className="mt-8">
            <SenderImages />
            {isUnreadFaviconEnabled && !isElectronMail && <UnreadFaviconCounter />}
        </div>
    );
};

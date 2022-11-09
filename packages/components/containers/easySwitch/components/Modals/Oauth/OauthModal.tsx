import { FeatureCode } from '@proton/components/containers/features';
import { useAddresses, useFeature } from '@proton/components/hooks';
import { EASY_SWITCH_SOURCE, EasySwitchFeatureFlag, OAUTH_PROVIDER } from '@proton/shared/lib/interfaces/EasySwitch';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import EasySwitchOauthModal from '../../../EasySwitchOauthModal';
import { selectDraftImportType, selectDraftProvider } from '../../../logic/draft/draft.selector';
import { useEasySwitchSelector } from '../../../logic/store';
import { ImportProvider, ImportType } from '../../../logic/types/shared.types';

interface Props {
    onClose: () => void;
}

const OauthModal = ({ onClose }: Props) => {
    const provider = useEasySwitchSelector(selectDraftProvider);
    const importType = useEasySwitchSelector(selectDraftImportType);
    const [addresses, loadingAddresses] = useAddresses();
    const easySwitchFeature = useFeature<EasySwitchFeatureFlag>(FeatureCode.EasySwitch);
    const easySwitchFeatureValue = easySwitchFeature.feature?.Value;
    const isLoading = loadingAddresses || easySwitchFeature.loading;

    if (isLoading) {
        return null;
    }

    if (provider === ImportProvider.GOOGLE) {
        const checkedTypes = [
            easySwitchFeatureValue?.GoogleMail && importType?.includes(ImportType.MAIL) && ImportType.MAIL,
            easySwitchFeatureValue?.GoogleCalendar && importType?.includes(ImportType.CALENDAR) && ImportType.CALENDAR,
            easySwitchFeatureValue?.GoogleContacts && importType?.includes(ImportType.CONTACTS) && ImportType.CONTACTS,
        ].filter(isTruthy);

        return (
            <EasySwitchOauthModal
                source={EASY_SWITCH_SOURCE.EASY_SWITCH_SETTINGS}
                provider={OAUTH_PROVIDER.GOOGLE}
                addresses={addresses}
                defaultCheckedTypes={checkedTypes}
                featureMap={easySwitchFeatureValue}
                onClose={onClose}
                onExit={noop}
            />
        );
    }

    if (provider === ImportProvider.OUTLOOK) {
        const checkedTypes = [
            easySwitchFeatureValue?.OutlookMail && importType?.includes(ImportType.MAIL) && ImportType.MAIL,
            easySwitchFeatureValue?.OutlookCalendar && importType?.includes(ImportType.CALENDAR) && ImportType.CALENDAR,
            easySwitchFeatureValue?.OutlookContacts && importType?.includes(ImportType.CONTACTS) && ImportType.CONTACTS,
        ].filter(isTruthy);

        return (
            <EasySwitchOauthModal
                source={EASY_SWITCH_SOURCE.EASY_SWITCH_SETTINGS}
                addresses={addresses}
                defaultCheckedTypes={checkedTypes}
                featureMap={easySwitchFeatureValue}
                provider={OAUTH_PROVIDER.OUTLOOK}
                onClose={onClose}
                onExit={noop}
            />
        );
    }

    return null;
};

export default OauthModal;

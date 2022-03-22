import { c } from 'ttag';
import { EASY_SWITCH_SOURCE, EasySwitchFeatureFlag, ImportType } from '@proton/shared/lib/interfaces/EasySwitch';

import { useAddresses, useFeature, useModals, useUser } from '../../../hooks';
import { FeatureCode } from '../../features';
import { GoogleButton, Loader, PrimaryButton } from '../../../components';
import { EasySwitchOauthModal } from '../../easySwitch';

interface Props {
    onImport: () => void;
    easySwitchSource?: EASY_SWITCH_SOURCE;
}

const ImportCsvContactButton = ({ easySwitchSource = EASY_SWITCH_SOURCE.IMPORT_CONTACTS_BUTTON, onImport }: Props) => {
    const { createModal } = useModals();
    const [user, loadingUser] = useUser();
    const [addresses, loadingAddresses] = useAddresses();

    const easySwitchFeature = useFeature<EasySwitchFeatureFlag>(FeatureCode.EasySwitch);
    const easySwitchFeatureLoading = easySwitchFeature.loading;
    const easySwitchFeatureValue = easySwitchFeature.feature?.Value;

    const isLoading = loadingUser || loadingAddresses || easySwitchFeatureLoading;

    if (isLoading) {
        return <Loader />;
    }

    const disabled = isLoading || !user.hasNonDelinquentScope;

    return (
        <>
            {!easySwitchFeatureLoading && easySwitchFeatureValue?.GoogleContacts && (
                <GoogleButton
                    onClick={() => {
                        createModal(
                            <EasySwitchOauthModal
                                source={easySwitchSource}
                                addresses={addresses}
                                defaultCheckedTypes={[ImportType.CONTACTS]}
                                featureMap={easySwitchFeatureValue}
                            />
                        );
                    }}
                    disabled={disabled}
                    className="mr1 mb0-5"
                />
            )}
            <PrimaryButton className="mb0-5" id="import-contacts-button" disabled={disabled} onClick={onImport}>
                {c('Action').t`Import from .csv or vCard`}
            </PrimaryButton>
        </>
    );
};

export default ImportCsvContactButton;

import { c } from 'ttag';
import { EASY_SWITCH_SOURCE, EasySwitchFeatureFlag, ImportType } from '@proton/shared/lib/interfaces/EasySwitch';

import { useAddresses, useFeature, useModals, useUser } from '../../../hooks';
import { FeatureCode } from '../../features';
import { GoogleButton, Loader, PrimaryButton } from '../../../components';
import { EasySwitchOauthModal } from '../../easySwitch';
import ImportModal from '../import/ImportModal';

interface Props {
    onImportButtonClick?: () => void;
    easySwitchSource?: EASY_SWITCH_SOURCE;
}

const ImportCsvContactButton = ({
    easySwitchSource = EASY_SWITCH_SOURCE.IMPORT_CONTACTS_BUTTON,
    onImportButtonClick,
}: Props) => {
    const { createModal } = useModals();
    const [user, loadingUser] = useUser();
    const [addresses, loadingAddresses] = useAddresses();

    const easySwitchFeature = useFeature<EasySwitchFeatureFlag>(FeatureCode.EasySwitch);
    const easySwitchFeatureLoading = easySwitchFeature.loading;
    const easySwitchFeatureValue = easySwitchFeature.feature?.Value;

    const handleClick = () => {
        createModal(<ImportModal />);
        if (onImportButtonClick !== undefined) {
            onImportButtonClick();
        }
    };

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
                    className="mr1"
                />
            )}
            <PrimaryButton id="import-contacts-button" disabled={disabled} onClick={handleClick}>
                {c('Action').t`Import from .csv or vCard`}
            </PrimaryButton>
        </>
    );
};

export default ImportCsvContactButton;

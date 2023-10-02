import { c } from 'ttag';

import { EasySwitchOauthImportButton } from '@proton/activation';
import { EASY_SWITCH_SOURCE, EasySwitchFeatureFlag, ImportType } from '@proton/activation/src/interface';

import { Loader, PrimaryButton } from '../../../components';
import { useFeature, useUser } from '../../../hooks';
import { FeatureCode } from '../../features';
import { useFlag } from '../../unleash';

interface Props {
    onImport: () => void;
    easySwitchSource?: EASY_SWITCH_SOURCE;
    onClose?: () => void;
}

const ImportCsvContactButton = ({
    easySwitchSource = EASY_SWITCH_SOURCE.IMPORT_CONTACTS_BUTTON,
    onImport,
    onClose,
}: Props) => {
    const [user, loadingUser] = useUser();
    const easySwitchFeature = useFeature<EasySwitchFeatureFlag>(FeatureCode.EasySwitch);
    const isImporterInMaintenance = useFlag('MaintenanceImporter');

    if (loadingUser || easySwitchFeature.loading) {
        return <Loader />;
    }

    const disabled = !user.hasNonDelinquentScope;

    return (
        <>
            {!isImporterInMaintenance && (
                <EasySwitchOauthImportButton
                    className="mr-4 mb-2"
                    defaultCheckedTypes={[ImportType.CONTACTS]}
                    displayOn="GoogleContacts"
                    source={easySwitchSource}
                    onClick={onClose}
                />
            )}
            <PrimaryButton className="mb-2" id="import-contacts-button" disabled={disabled} onClick={onImport}>
                {c('Action').t`Import from .csv or vCard`}
            </PrimaryButton>
        </>
    );
};

export default ImportCsvContactButton;

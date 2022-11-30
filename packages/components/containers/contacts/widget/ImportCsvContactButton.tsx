import { c } from 'ttag';

import { EASY_SWITCH_SOURCE, EasySwitchFeatureFlag, ImportType } from '@proton/shared/lib/interfaces/EasySwitch';

import { Loader, PrimaryButton } from '../../../components';
import { useFeature, useUser } from '../../../hooks';
import { EasySwitchOauthImportButton } from '../../easySwitch';
import { FeatureCode } from '../../features';

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

    if (loadingUser || easySwitchFeature.loading) {
        return <Loader />;
    }

    const disabled = !user.hasNonDelinquentScope;

    return (
        <>
            <EasySwitchOauthImportButton
                className="mr1 mb0-5"
                defaultCheckedTypes={[ImportType.CONTACTS]}
                displayOn="GoogleContacts"
                source={easySwitchSource}
                onClick={onClose}
            />
            <PrimaryButton className="mb0-5" id="import-contacts-button" disabled={disabled} onClick={onImport}>
                {c('Action').t`Import from .csv or vCard`}
            </PrimaryButton>
        </>
    );
};

export default ImportCsvContactButton;

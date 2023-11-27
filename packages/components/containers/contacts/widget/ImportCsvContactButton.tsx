import { c } from 'ttag';

import { EasySwitchOauthImportButton } from '@proton/activation';
import {
    EASY_SWITCH_SOURCES,
    EasySwitchFeatureFlag,
    ImportProvider,
    ImportType,
} from '@proton/activation/src/interface';

import { Loader, PrimaryButton } from '../../../components';
import { useFeature, useUser } from '../../../hooks';
import { FeatureCode } from '../../features';
import { useFlag } from '../../unleash';

interface Props {
    onImport: () => void;
    source: EASY_SWITCH_SOURCES;
    onClose?: () => void;
}

const ImportCsvContactButton = ({ source, onImport, onClose }: Props) => {
    const [user, loadingUser] = useUser();
    const easySwitchFeature = useFeature<EasySwitchFeatureFlag>(FeatureCode.EasySwitch);
    const isImporterInMaintenance = useFlag('MaintenanceImporter');

    if (loadingUser || easySwitchFeature.loading) {
        return <Loader />;
    }

    const disabled = !user.hasNonDelinquentScope;

    return (
        <div className="w-5/6">
            {!isImporterInMaintenance && (
                <>
                    <EasySwitchOauthImportButton
                        className="mr-4 mb-2 w-full"
                        defaultCheckedTypes={[ImportType.CONTACTS]}
                        displayOn="GoogleContacts"
                        source={source}
                        onClick={onClose}
                        provider={ImportProvider.GOOGLE}
                    />
                    <EasySwitchOauthImportButton
                        className="mr-4 mb-2 w-full"
                        defaultCheckedTypes={[ImportType.CONTACTS]}
                        displayOn="OutlookContacts"
                        source={source}
                        onClick={onClose}
                        provider={ImportProvider.OUTLOOK}
                    />
                </>
            )}
            <PrimaryButton
                fullWidth
                className="mb-2"
                id="import-contacts-button"
                disabled={disabled}
                onClick={onImport}
            >
                {c('Action').t`Import from .csv or vCard`}
            </PrimaryButton>
        </div>
    );
};

export default ImportCsvContactButton;

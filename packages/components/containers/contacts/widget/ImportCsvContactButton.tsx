import { c } from 'ttag';
import { EASY_SWITCH_SOURCE, ImportType } from '@proton/shared/lib/interfaces/EasySwitch';
import {
    Button,
    GoogleButton,
    PrimaryButton,
    FeatureCode,
    ImportAssistantOauthModal,
    Loader,
} from '@proton/components';
import { useAddresses, useFeature, useModals } from '@proton/components/hooks';
import ImportModal from '@proton/components/containers/contacts/import/ImportModal';

interface Props {
    hideEasySwitch?: boolean;
    onImportButtonClick?: () => void;
    easySwitchSource?: EASY_SWITCH_SOURCE;
}

const ImportCsvContactButton = ({
    hideEasySwitch = false,
    easySwitchSource = EASY_SWITCH_SOURCE.IMPORT_CONTACTS_BUTTON,
    onImportButtonClick,
}: Props) => {
    const { createModal } = useModals();
    const [addresses, loadingAddresses] = useAddresses();

    const easySwitchFeature = useFeature(FeatureCode.EasySwitch);
    const isEasySwitchEnabled = easySwitchFeature.feature?.Value;

    const handleClick = () => {
        createModal(<ImportModal />);
        if (onImportButtonClick !== undefined) {
            onImportButtonClick();
        }
    };

    if (loadingAddresses || easySwitchFeature.loading) {
        return <Loader />;
    }

    return isEasySwitchEnabled && !hideEasySwitch ? (
        <>
            <GoogleButton
                onClick={() => {
                    createModal(
                        <ImportAssistantOauthModal
                            source={easySwitchSource}
                            addresses={addresses}
                            defaultCheckedTypes={[ImportType.CONTACTS]}
                        />
                    );
                }}
                disabled={loadingAddresses}
                className="mr1"
            />
            <Button id="import-contacts-button" onClick={handleClick}>
                {c('Action').t`Import from .csv or vCard`}
            </Button>
        </>
    ) : (
        <PrimaryButton id="import-contacts-button" onClick={handleClick}>
            {c('Action').t`Import from .csv or vCard`}
        </PrimaryButton>
    );
};

export default ImportCsvContactButton;

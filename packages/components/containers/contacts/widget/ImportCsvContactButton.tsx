import { c } from 'ttag';
import { EASY_SWITCH_SOURCE, ImportType } from '@proton/shared/lib/interfaces/EasySwitch';
import { Button, GoogleButton, PrimaryButton, FeatureCode, Loader, EasySwitchOauthModal } from '@proton/components';
import { useAddresses, useFeature, useModals, useUser } from '@proton/components/hooks';
import ImportModal from '@proton/components/containers/contacts/import/ImportModal';

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

    const easySwitchFeature = useFeature(FeatureCode.EasySwitch);
    const isEasySwitchEnabled = easySwitchFeature.feature?.Value;

    const easySwitchCalendarFeature = useFeature(FeatureCode.EasySwitchCalendar);
    const isEasySwitchCalendarEnabled = easySwitchCalendarFeature.feature?.Value;

    const handleClick = () => {
        createModal(<ImportModal />);
        if (onImportButtonClick !== undefined) {
            onImportButtonClick();
        }
    };

    const isLoading = loadingUser || loadingAddresses || easySwitchFeature.loading || easySwitchCalendarFeature.loading;

    if (isLoading) {
        return <Loader />;
    }

    const disabled = isLoading || !user.hasNonDelinquentScope;

    return isEasySwitchEnabled ? (
        <>
            <GoogleButton
                onClick={() => {
                    createModal(
                        <EasySwitchOauthModal
                            source={easySwitchSource}
                            addresses={addresses}
                            defaultCheckedTypes={[ImportType.CONTACTS]}
                            isEasySwitchCalendarEnabled={isEasySwitchCalendarEnabled}
                        />
                    );
                }}
                disabled={disabled}
                className="mr1"
            />
            <Button id="import-contacts-button" disabled={disabled} onClick={handleClick}>
                {c('Action').t`Import from .csv or vCard`}
            </Button>
        </>
    ) : (
        <PrimaryButton id="import-contacts-button" disabled={disabled} onClick={handleClick}>
            {c('Action').t`Import from .csv or vCard`}
        </PrimaryButton>
    );
};

export default ImportCsvContactButton;

import { c } from 'ttag';

import { ImportType } from '@proton/shared/lib/interfaces/EasySwitch';
import { Label, Button, GoogleButton } from '@proton/components';
import { useAddresses, useFeature, useModals } from '@proton/components/hooks';

import { ImportAssistantOauthModal } from '../../easySwitch';
import { FeatureCode } from '../../features';
import ImportModal from '../import/ImportModal';

interface Props {
    onImportButtonClick?: () => void;
}

const ContactsWidgetSettingsContainerImport = ({ onImportButtonClick }: Props) => {
    const { createModal } = useModals();
    const [addresses, loadingAddresses] = useAddresses();

    const isEasySwitchEnabled = useFeature(FeatureCode.EasySwitch).feature?.Value;

    const handleClick = () => {
        createModal(<ImportModal />);
        if (onImportButtonClick !== undefined) {
            onImportButtonClick();
        }
    };

    return (
        <div className="mb2">
            <Label htmlFor="import-contacts-button" className="text-semibold">
                <span role="heading" aria-level={2}>{c('Label').t`Import contacts`}</span>
            </Label>

            <p className="color-weak mt0-5 mb1">
                {c('Info')
                    .t`We support importing CSV files from Outlook, Outlook Express, Yahoo! Mail, Hotmail, Eudora and some other apps. We also support importing vCard 4.0. (UTF-8 encoding).`}
            </p>

            {isEasySwitchEnabled && (
                <GoogleButton
                    onClick={() => {
                        createModal(
                            <ImportAssistantOauthModal
                                addresses={addresses}
                                defaultCheckedTypes={[ImportType.CONTACTS]}
                            />
                        );
                    }}
                    disabled={loadingAddresses}
                    className="mr1"
                />
            )}

            <Button id="import-contacts-button" onClick={handleClick}>
                {c('Action').t`Import from .csv or vCard`}
            </Button>
        </div>
    );
};

export default ContactsWidgetSettingsContainerImport;

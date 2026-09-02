import { type EASY_SWITCH_SOURCES, ImportProvider, ImportType } from '../../../../interface';
import { useDriveSdk } from '../../../../logic/driveContext';
import ProviderButton from '../../../SettingsArea/ProviderCards/ProviderButton';
import { useProductSelectionSubmit } from '../../ProductSelectionModal/useProductSelectionSubmit';

interface Props {
    source: EASY_SWITCH_SOURCES;
}

/** Drive-only entry point: skips the provider/product selector since Drive only imports Google Drive files. */
const DriveConnectEntry = ({ source }: Props) => {
    const { handleSubmit } = useProductSelectionSubmit();
    const drive = useDriveSdk();

    return (
        <div className="flex flex-nowrap gap-2">
            <ProviderButton
                provider={ImportProvider.GOOGLE}
                onClick={() => handleSubmit(ImportProvider.GOOGLE, [ImportType.DRIVE], source)}
                className="mb-2 inline-flex items-center justify-center rounded-lg"
                data-testid="ProviderButton:googleCard"
                // Disabled without the SDK client, since the import needs it to move files.
                disabled={!drive}
            />
        </div>
    );
};

export default DriveConnectEntry;

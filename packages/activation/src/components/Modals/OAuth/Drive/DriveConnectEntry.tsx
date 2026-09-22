import { type EASY_SWITCH_SOURCES, ImportProvider, ImportType } from '../../../../interface';
import { useDriveSdk } from '../../../../logic/driveContext';
import EasySwitchOauthImportButton from '../../../OAuthImportButton/EasySwitchOAuthImportButton';

interface Props {
    source: EASY_SWITCH_SOURCES;
}

/** Drive-only entry point: skips the provider/product selector since Drive only imports Google Drive files. */
const DriveConnectEntry = ({ source }: Props) => {
    const drive = useDriveSdk();

    return (
        <div className="flex flex-nowrap gap-2">
            <EasySwitchOauthImportButton
                provider={ImportProvider.GOOGLE}
                products={[ImportType.DRIVE]}
                source={source}
                className="mb-2"
                // Disabled without the SDK client, since the import needs it to move files.
                disabled={!drive}
            />
        </div>
    );
};

export default DriveConnectEntry;

import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import { TelemetryDriveWebFeature, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { APPS } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import dropboxLogo from '@proton/styles/assets/img/import/providers/dropbox.svg';
import onedriveLogo from '@proton/styles/assets/img/import/providers/onedrive.png';

import { type EASY_SWITCH_SOURCES, ImportProvider, ImportType } from '../../../../interface';
import { useDriveSdk } from '../../../../logic/driveContext';
import EasySwitchOauthImportButton from '../../../OAuthImportButton/EasySwitchOAuthImportButton';

// TODO: also send the Easy Switch creation funnel (any.web.easy_switch_creation_funnel) for Dropbox/OneDrive
// once they have a real import (needs `dropbox`/`onedrive` added to the funnel's provider list)
const getKnowledgeBaseProviders = () => [
    {
        name: c('Action').t`Dropbox`,
        logo: dropboxLogo,
        kbPath: '/import-files-dropbox',
        action: 'easySwitchDropboxSettingsClicked',
    },
    {
        name: c('Action').t`OneDrive`,
        logo: onedriveLogo,
        kbPath: '/import-files-one-drive',
        action: 'easySwitchOneDriveSettingsClicked',
    },
];

interface Props {
    source: EASY_SWITCH_SOURCES;
}

/** Drive-only entry point: skips the provider/product selector since Drive only imports Google Drive files. */
const DriveConnectEntry = ({ source }: Props) => {
    const drive = useDriveSdk();
    const api = useApi();

    const countClick = (action: string) => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.driveWebActions,
            event: TelemetryDriveWebFeature.actions,
            values: { count: 1 },
            dimensions: { name: action },
            delay: false,
        });
    };

    return (
        <>
            <div className="flex flex-nowrap gap-2">
                <EasySwitchOauthImportButton
                    provider={ImportProvider.GOOGLE}
                    products={[ImportType.DRIVE]}
                    source={source}
                    className="mb-2"
                    // Disabled without the SDK client, since the import needs it to move files.
                    disabled={!drive}
                    onClick={() => countClick('easySwitchGoogleSettingsClicked')}
                />
                {getKnowledgeBaseProviders().map(({ name, logo, kbPath, action }) => (
                    <ButtonLike
                        key={action}
                        as={Href}
                        href={getKnowledgeBaseUrl(kbPath)}
                        shape="outline"
                        color="weak"
                        className="mb-2 inline-flex items-center gap-2 rounded-lg"
                        onClick={() => countClick(action)}
                    >
                        <img src={logo} alt="" className="w-4" />
                        <span>{name}</span>
                    </ButtonLike>
                ))}
            </div>
            <ButtonLike as={SettingsLink} shape="underline" color="norm" path="/easy-switch" app={APPS.PROTONMAIL}>
                {c('Link').t`Want to import email, calendar and contacts?`}
            </ButtonLike>
        </>
    );
};

export default DriveConnectEntry;

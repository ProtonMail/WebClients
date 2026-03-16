import { c, msgid } from 'ttag';

import { selectActiveImportersErrors } from '@proton/activation/src/logic/importers/importers.selectors';
import { useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { Banner } from '@proton/atoms/Banner/Banner';
import { Href } from '@proton/atoms/Href/Href';
import { SettingsParagraph } from '@proton/components';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

const ReportsTableInfos = () => {
    const { importErrors, delayedImportAccounts } = useEasySwitchSelector(selectActiveImportersErrors);
    const delayedImportsCount = delayedImportAccounts.length;
    const accounts = delayedImportAccounts.join(', ');

    const bandwidthLimitLink = (
        <Href
            key="bandwidthLimitLink"
            href={getKnowledgeBaseUrl(
                '/manage-imports-easy-switch#:~:text=notification%20in%20advance.-,Delayed%20imports,-Some%20email%20providers'
            )}
        >
            {c('Import error link').t`bandwidth limit`}
        </Href>
    );

    return (
        <>
            {!importErrors.includes('authConnection') && (
                <SettingsParagraph>{c('Info').t`Check the status of imports and forwarding.`}</SettingsParagraph>
            )}
            {importErrors.includes('storageLimit') && (
                <Banner className="mb-4" variant="warning" icon={<IcInfoCircle />}>
                    <div className="color-norm">
                        {c('Info').t`An import is paused because your storage is almost full.`}
                        <br />
                        {c('Info').t`Free up space or upgrade your storage to continue.`}
                    </div>
                </Banner>
            )}
            {importErrors.includes('authConnection') && (
                <Banner className="mb-4" variant="warning" icon={<IcInfoCircle />}>
                    <div className="color-norm">
                        {c('Info').t`An import is paused because the connection to your email provider was lost.`}
                        <br />
                        {c('Info').t`Please reconnect to continue.`}
                    </div>
                </Banner>
            )}
            {importErrors.includes('delayedImport') && (
                <Banner className="mb-4" variant="warning" icon={<IcInfoCircle />}>
                    <div className="color-norm">
                        {c('Info').ngettext(
                            msgid`Import from ${accounts} is temporarily delayed due to a bandwidth limit.`,
                            `Imports from ${accounts} are temporarily delayed due to a bandwidth limit.`,
                            delayedImportsCount
                        )}
                        <br />
                        {c('Info')
                            .jt`The ${bandwidthLimitLink} was reached. We'll automatically resume it once it resets.`}
                    </div>
                </Banner>
            )}
        </>
    );
};

export default ReportsTableInfos;

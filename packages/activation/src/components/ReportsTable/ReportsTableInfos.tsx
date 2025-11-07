import { c, msgid } from 'ttag';

import { selectActiveImportersErrors } from '@proton/activation/src/logic/importers/importers.selectors';
import { useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { Href } from '@proton/atoms/Href/Href';
import { Alert, SettingsParagraph } from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';
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

    // translator: the variable here is a HTML tag, here is the complete sentence: "Proton will try to resume the import as soon as your email provider resets your account’s bandwidth limit. You don’t need to do anything. If you cancel your import, you won't be able to resume it and you will need to start over."
    const bandwidthMessage = c('Info')
        .jt`${BRAND_NAME} will try to resume the import as soon as your email provider resets your account’s ${bandwidthLimitLink}. You don’t need to do anything. If you cancel your import, you won't be able to resume it and you will need to start over.`;

    return (
        <>
            {!importErrors.includes('authConnection') && (
                <SettingsParagraph>{c('Info').t`Check the status of imports and forwarding.`}</SettingsParagraph>
            )}
            {importErrors.includes('storageLimit') && (
                <Alert className="mb-4" type="warning">
                    {c('Info').t`${BRAND_NAME} paused an import because your account is running low on space. You can:`}
                    <ul className="m-0">
                        <li>{c('Info').t`free up space by deleting older messages or other data`}</li>
                        <li>{c('Info').t`purchase additional storage`}</li>
                    </ul>
                </Alert>
            )}
            {importErrors.includes('authConnection') && (
                <Alert className="mb-4" type="warning">
                    {c('Info')
                        .t`${BRAND_NAME} paused an import because it lost the connection with your other email provider. Please reconnect.`}
                </Alert>
            )}
            {importErrors.includes('delayedImport') && (
                <Alert className="mb-4" type="warning">
                    {c('Info').ngettext(
                        msgid`Your import from ${accounts} is temporarily delayed.`,
                        `Your imports from ${accounts} are temporarily delayed.`,
                        delayedImportsCount
                    )}
                    <br />
                    {bandwidthMessage}
                </Alert>
            )}
        </>
    );
};

export default ReportsTableInfos;

import { c, msgid } from 'ttag';

import { selectActiveImportersErrors } from '@proton/activation/logic/importers/importers.selectors';
import { useEasySwitchSelector } from '@proton/activation/logic/store';
import { Alert, Href, SettingsParagraph } from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

const ReportsTableInfos = () => {
    const { importErrors, delayedImportAccounts } = useEasySwitchSelector(selectActiveImportersErrors);
    const delayedImportsCount = delayedImportAccounts.length;
    const accounts = delayedImportAccounts.join(', ');

    const bandwithLimitLink = (
        <Href key="bandwithLimitLink" url={getKnowledgeBaseUrl('/import-assistant/#delayed-import')}>
            {c('Import error link').t`bandwidth limit`}
        </Href>
    );

    // translator: the variable here is a HTML tag, here is the complete sentence: "Proton will try to resume the import as soon as your email provider resets your account’s bandwidth limit. You don’t need to do anything. If you cancel your import, you won't be able to resume it and you will need to start over."
    const bandwidthMessage = c('Info')
        .jt`${BRAND_NAME} will try to resume the import as soon as your email provider resets your account’s ${bandwithLimitLink}. You don’t need to do anything. If you cancel your import, you won't be able to resume it and you will need to start over.`;

    return (
        <>
            {!importErrors.includes('authConnection') && (
                <SettingsParagraph>{c('Info').t`Check the status of current and previous imports.`}</SettingsParagraph>
            )}
            {importErrors.includes('storageLimit') && (
                <Alert className="mb1" type="warning">
                    {c('Info').t`${BRAND_NAME} paused an import because your account is running low on space. You can:`}
                    <ul className="m0">
                        <li>{c('Info').t`free up space by deleting older messages or other data`}</li>
                        <li>{c('Info').t`purchase additional storage`}</li>
                    </ul>
                </Alert>
            )}
            {importErrors.includes('authConnection') && (
                <Alert className="mb1" type="warning">
                    {c('Info')
                        .t`${BRAND_NAME} paused an import because it lost the connection with your other email provider. Please reconnect.`}
                </Alert>
            )}
            {importErrors.includes('delayedImport') && (
                <Alert className="mb1" type="warning">
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

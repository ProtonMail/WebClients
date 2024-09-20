import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Tooltip } from '@proton/components';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { CreateMemberMode } from '@proton/shared/lib/interfaces';
import { getIsDomainActive } from '@proton/shared/lib/organization/helper';
import { useFlag } from '@proton/unleash';

import { useCustomDomains, useMembers } from '../../../hooks';
import CreateUserAccountsModal from './CreateUserAccountsModal/CreateUserAccountsModal';
import UploadCSVFileButton from './UploadCSVFileButton';
import type { CsvConfig } from './csv';
import { downloadSampleCSV } from './csv';
import type { UserTemplate } from './types';

const defaultCsvConfig: Omit<CsvConfig, 'mode'> = {
    multipleAddresses: true,
    includeStorage: true,
    includeVpnAccess: true,
    includePrivateSubUser: true,
};

const MultiUserCreationSection = ({ app }: { app: APP_NAMES }) => {
    const [customDomains = []] = useCustomDomains();
    const [usersToImport, setUsersToImport] = useState<UserTemplate[]>();
    const [members] = useMembers();
    const [createUserAccountsModal, setCreateUserAccountsModal, renderCreateUserAccountsModal] = useModalState();
    const isMagicLinkEnabled = useFlag('MagicLink');
    const mode = isMagicLinkEnabled ? CreateMemberMode.Invitation : CreateMemberMode.Password;

    const csvConfig = {
        ...defaultCsvConfig,
        mode,
    };

    const verifiedDomains = useMemo(() => (customDomains || []).filter(getIsDomainActive), [customDomains]);

    const onCSVFileUpload = (usersToImport: UserTemplate[]) => {
        setUsersToImport(usersToImport);
        setCreateUserAccountsModal(true);
    };

    const handleDownloadClick = () => {
        downloadSampleCSV(csvConfig);
    };

    return (
        <>
            {renderCreateUserAccountsModal && usersToImport && (
                <CreateUserAccountsModal
                    mode={mode}
                    members={members}
                    usersToImport={usersToImport}
                    app={app}
                    verifiedDomains={verifiedDomains}
                    {...createUserAccountsModal}
                    expectedCsvConfig={csvConfig}
                />
            )}
            <SettingsSectionWide>
                <SettingsParagraph>{c('Info').t`Add multiple users to your organization at once.`}</SettingsParagraph>
                <SettingsParagraph className="mb-4">
                    {c('Info')
                        .t`Download our CSV template, fill in the user details, and then upload your completed CSV file to create accounts for these users.`}
                </SettingsParagraph>

                <div className="flex flex-rows gap-4">
                    {verifiedDomains.length === 0 ? (
                        <Tooltip
                            title={c('familyOffer_2023:Family plan')
                                .t`You need to configure a custom domain before adding multiple users.`}
                        >
                            <span>
                                <Button disabled>{c('Select file').t`Upload CSV file`}</Button>
                            </span>
                        </Tooltip>
                    ) : (
                        <UploadCSVFileButton onUpload={onCSVFileUpload} color="norm" csvConfig={csvConfig} />
                    )}
                    <Button onClick={handleDownloadClick}>{c('Action').t`Download CSV sample`}</Button>
                </div>
            </SettingsSectionWide>
        </>
    );
};

export default MultiUserCreationSection;

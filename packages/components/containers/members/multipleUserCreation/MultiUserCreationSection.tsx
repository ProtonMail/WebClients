import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { APP_NAMES } from '@proton/shared/lib/constants';

import { useModalState } from '../../../components';
import { SettingsParagraph, SettingsSectionWide } from '../../account';
import CreateUserAccountsModal from './CreateUserAccountsModal/CreateUserAccountsModal';
import UploadCSVFileButton from './UploadCSVFileButton';
import { downloadSampleCSV } from './csv';
import { UserTemplate } from './types';

const MultiUserCreationSection = ({ app }: { app: APP_NAMES }) => {
    const [usersToImport, setUsersToImport] = useState<UserTemplate[]>();
    const [createUserAccountsModal, setCreateUserAccountsModal, renderCreateUserAccountsModal] = useModalState();

    const onCSVFileUpload = (usersToImport: UserTemplate[]) => {
        setUsersToImport(usersToImport);
        setCreateUserAccountsModal(true);
    };

    return (
        <>
            {renderCreateUserAccountsModal && usersToImport && (
                <CreateUserAccountsModal usersToImport={usersToImport} app={app} {...createUserAccountsModal} />
            )}
            <SettingsSectionWide>
                <SettingsParagraph>{c('Info').t`Add multiple users to your organization at once.`}</SettingsParagraph>
                <SettingsParagraph className="mb1">
                    {c('Info')
                        .t`Download our CSV template, fill in the user details, and then upload your completed CSV file to create accounts for these users.`}
                </SettingsParagraph>

                <div>
                    <UploadCSVFileButton onUpload={onCSVFileUpload} color="norm" className="mr1" />
                    <Button onClick={downloadSampleCSV}>{c('Action').t`Download CSV sample`}</Button>
                </div>
            </SettingsSectionWide>
        </>
    );
};

export default MultiUserCreationSection;

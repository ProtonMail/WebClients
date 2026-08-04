import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ModalTwo, ModalTwoFooter } from '@proton/components';
import ModalHeaderWithTabs from '@proton/components/containers/members/rolesAndPermissions/ModalHeaderWithTabs';

import type { CompanyFormData, MspCompany } from '../../types';
import GeneralSettings from './GeneralSettings';
import ManagerSettings from './ManagerSettings';
import { CompanyModalProvider, useCompanyModalContext } from './context';

import '../MspCompaniesSection.scss';

interface Props {
    mode: 'add' | 'edit';
    initial?: MspCompany;
    onSave: (data: CompanyFormData) => Promise<void>;
    onClose: () => void;
}

const CompanyModalContent = ({ onClose }: { onClose: () => void }) => {
    const [tabIndex, setTabIndex] = useState(0);
    const { isEditing, canManageManagers, name, isSubmitting, handleSubmit } = useCompanyModalContext();

    const title = isEditing ? c('Title').t`Edit company` : c('Title').t`Add company`;

    // Only admins can assign delegated managers, so only they get the Managers tab; everyone
    // else can still edit the company's general details.
    const tabs = canManageManagers
        ? [
              { title: c('Title').t`General`, content: <GeneralSettings /> },
              { title: c('Title').t`Managers`, content: <ManagerSettings /> },
          ]
        : [{ title: c('Title').t`General`, content: <GeneralSettings /> }];

    return (
        <ModalTwo open onClose={onClose}>
            <ModalHeaderWithTabs title={title} tabs={tabs} tabIndex={tabIndex} onChangeTabIndex={setTabIndex} />
            <ModalTwoFooter>
                <Button onClick={onClose} disabled={isSubmitting}>{c('Action').t`Cancel`}</Button>
                <Button
                    color="norm"
                    onClick={handleSubmit}
                    loading={isSubmitting}
                    disabled={isSubmitting || !name.trim()}
                >
                    {isEditing ? c('Action').t`Save` : c('Action').t`Add`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

const CompanyModal = ({ mode, initial, onSave, onClose }: Props) => (
    <CompanyModalProvider mode={mode} initial={initial} onSave={onSave}>
        <CompanyModalContent onClose={onClose} />
    </CompanyModalProvider>
);

export default CompanyModal;

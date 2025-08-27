import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { EasySwitchOauthImportButton } from '@proton/activation/index';
import type { EasySwitchFeatureFlag } from '@proton/activation/src/interface';
import { EASY_SWITCH_SOURCES, ImportProvider, ImportType } from '@proton/activation/src/interface';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import Icon from '@proton/components/components/icon/Icon';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import { FeatureCode, useFeature } from '@proton/features/index';
import { useFlag } from '@proton/unleash';

interface Props {
    onImport: () => void;
}

const ContactsTabImportDropdown = ({ onImport }: Props) => {
    const [{ hasNonDelinquentScope }, loadingUser] = useUser();
    const { anchorRef, isOpen, close, toggle } = usePopperAnchor<HTMLButtonElement>();
    const easySwitchFeature = useFeature<EasySwitchFeatureFlag>(FeatureCode.EasySwitch);
    const isImporterInMaintenance = useFlag('MaintenanceImporter');

    return (
        <div key="contact-footer-button-2" className="w-full">
            <DropdownButton
                className="w-full justify-center"
                onClick={toggle}
                ref={anchorRef}
                hasCaret
                loading={loadingUser || easySwitchFeature.loading}
                data-testid="contacts:import-dropdown"
                aria-expanded={isOpen}
            >
                {c('Action').t`Import contacts`}
            </DropdownButton>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>
                    {!isImporterInMaintenance && (
                        <>
                            <EasySwitchOauthImportButton
                                className="w-full sm:justify-start"
                                defaultCheckedTypes={[ImportType.CONTACTS]}
                                displayOn="GoogleContacts"
                                source={EASY_SWITCH_SOURCES.CONTACTS_WEB_SETTINGS}
                                provider={ImportProvider.GOOGLE}
                                isDropdownButton
                            />
                            <div className="dropdown-item-hr" key="hr-1" />
                            <EasySwitchOauthImportButton
                                className="w-full sm:justify-start"
                                defaultCheckedTypes={[ImportType.CONTACTS]}
                                displayOn="OutlookContacts"
                                source={EASY_SWITCH_SOURCES.CONTACTS_WEB_SETTINGS}
                                provider={ImportProvider.OUTLOOK}
                                isDropdownButton
                            />
                            <div className="dropdown-item-hr" key="hr-1" />
                        </>
                    )}
                    <DropdownMenuButton
                        className="text-left flex flex-nowrap items-center"
                        data-testid="contacts:import-contacts"
                        title={c('Action').t`Import from .csv or vCard`}
                        onClick={onImport}
                        disabled={!hasNonDelinquentScope}
                    >
                        <Icon name="card-identity" className="mr-2" alt={c('Action').t`Import from .csv or vCard`} />
                        <span className="flex-1 my-auto">{c('Action').t`Import from .csv or vCard`}</span>
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </div>
    );
};

export default ContactsTabImportDropdown;

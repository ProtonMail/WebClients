import { c } from 'ttag';
import { SimpleDropdown, DropdownMenu, DropdownMenuButton, Icon } from '@proton/components';

export default { component: SimpleDropdown, title: 'Proton UI / Dropdown' };

export const Basic = () => {
    return (
        <SimpleDropdown content="test">
            <DropdownMenu>
                <DropdownMenuButton className="text-left flex flex-nowrap">
                    <Icon name="filter" className="mr0-5 mt0-25" />
                    <span className="flex-item-fluid mtauto mbauto">{c('Action').t`Filter on...`}</span>
                </DropdownMenuButton>
            </DropdownMenu>
        </SimpleDropdown>
    );
};

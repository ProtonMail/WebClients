import { c } from 'ttag';
import { SimpleDropdown, DropdownMenu, DropdownMenuButton, Icon } from '@proton/components';
import { getTitle } from '../../helpers/title';

export default { component: SimpleDropdown, title: getTitle(__filename) };

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

import { Alignment } from 'roosterjs-editor-types';
import { c } from 'ttag';

import ToolbarDropdown from './ToolbarDropdown';
import Icon from '../../icon/Icon';
import DropdownMenu from '../../dropdown/DropdownMenu';
import DropdownMenuButton from '../../dropdown/DropdownMenuButton';

interface Props {
    setAlignment: (nextAlignment: Alignment) => void;
}

const ToolbarAlignmentDropdown = ({ setAlignment }: Props) => (
    <ToolbarDropdown
        content={<Icon name="text-align-left" alt={c('Action').t`Alignment`} />}
        className="flex-item-noshrink"
        title={c('Action').t`Alignment`}
    >
        <DropdownMenu>
            <DropdownMenuButton
                className="text-left flex flex-nowrap flex-align-items-center"
                onClick={() => setAlignment(Alignment.Left)}
            >
                <Icon name="text-align-left" />
                <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Align left`}</span>
            </DropdownMenuButton>
            <DropdownMenuButton
                className="text-left flex flex-nowrap flex-align-items-center"
                onClick={() => setAlignment(Alignment.Center)}
            >
                <Icon name="text-align-center" />
                <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Center`}</span>
            </DropdownMenuButton>
            <DropdownMenuButton
                className="text-left flex flex-nowrap flex-align-items-center"
                onClick={() => setAlignment(Alignment.Right)}
            >
                <Icon name="text-align-right" />
                <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Align right`}</span>
            </DropdownMenuButton>
        </DropdownMenu>
    </ToolbarDropdown>
);

export default ToolbarAlignmentDropdown;

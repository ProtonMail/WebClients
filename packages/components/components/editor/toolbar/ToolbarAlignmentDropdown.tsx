import { Alignment } from 'roosterjs-editor-types';
import { c } from 'ttag';

import DropdownMenu from '../../dropdown/DropdownMenu';
import DropdownMenuButton from '../../dropdown/DropdownMenuButton';
import Icon from '../../icon/Icon';
import ToolbarDropdown from './ToolbarDropdown';

interface Props {
    setAlignment: (nextAlignment: Alignment) => void;
}

const ToolbarAlignmentDropdown = ({ setAlignment }: Props) => (
    <ToolbarDropdown
        content={<Icon name="text-align-left" alt={c('Action').t`Alignment`} />}
        className="flex-item-noshrink"
        data-testid="editor-alignment"
        title={c('Action').t`Alignment`}
    >
        <DropdownMenu>
            <DropdownMenuButton
                className="text-left flex flex-nowrap flex-align-items-center"
                onClick={() => setAlignment(Alignment.Left)}
                data-testid="editor-alignment-left"
            >
                <Icon name="text-align-left" />
                <span className="ml0-5 myauto flex-item-fluid">{c('Info').t`Align left`}</span>
            </DropdownMenuButton>
            <DropdownMenuButton
                className="text-left flex flex-nowrap flex-align-items-center"
                onClick={() => setAlignment(Alignment.Center)}
                data-testid="editor-alignment-center"
            >
                <Icon name="text-align-center" />
                <span className="ml0-5 myauto flex-item-fluid">{c('Info').t`Center`}</span>
            </DropdownMenuButton>
            <DropdownMenuButton
                className="text-left flex flex-nowrap flex-align-items-center"
                onClick={() => setAlignment(Alignment.Right)}
                data-testid="editor-alignment-right"
            >
                <Icon name="text-align-right" />
                <span className="ml0-5 myauto flex-item-fluid">{c('Info').t`Align right`}</span>
            </DropdownMenuButton>
        </DropdownMenu>
    </ToolbarDropdown>
);

export default ToolbarAlignmentDropdown;

import { Alignment } from 'roosterjs-editor-types';
import { c } from 'ttag';

import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { COMPOSER_TOOLBAR_ICON_SIZE } from '@proton/shared/lib/constants';

import Icon from '../../icon/Icon';
import ToolbarDropdown from './ToolbarDropdown';

interface Props {
    setAlignment: (nextAlignment: Alignment) => void;
}

const ToolbarAlignmentDropdown = ({ setAlignment }: Props) => (
    <ToolbarDropdown
        content={<Icon name="text-align-left" size={COMPOSER_TOOLBAR_ICON_SIZE} alt={c('Action').t`Alignment`} />}
        className="shrink-0"
        data-testid="editor-alignment"
        title={c('Action').t`Alignment`}
    >
        <DropdownMenu>
            <DropdownMenuButton
                className="text-left flex flex-nowrap items-center"
                onClick={() => setAlignment(Alignment.Left)}
                data-testid="editor-alignment-left"
            >
                <Icon name="text-align-left" />
                <span className="ml-2 my-auto flex-1">{c('Info').t`Align left`}</span>
            </DropdownMenuButton>
            <DropdownMenuButton
                className="text-left flex flex-nowrap items-center"
                onClick={() => setAlignment(Alignment.Center)}
                data-testid="editor-alignment-center"
            >
                <Icon name="text-align-center" />
                <span className="ml-2 my-auto flex-1">{c('Info').t`Center`}</span>
            </DropdownMenuButton>
            <DropdownMenuButton
                className="text-left flex flex-nowrap items-center"
                onClick={() => setAlignment(Alignment.Right)}
                data-testid="editor-alignment-right"
            >
                <Icon name="text-align-right" />
                <span className="ml-2 my-auto flex-1">{c('Info').t`Align right`}</span>
            </DropdownMenuButton>
        </DropdownMenu>
    </ToolbarDropdown>
);

export default ToolbarAlignmentDropdown;

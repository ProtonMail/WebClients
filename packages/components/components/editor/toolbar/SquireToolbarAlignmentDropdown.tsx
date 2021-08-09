import { c } from 'ttag';

import SquireToolbarDropdown from './SquireToolbarDropdown';
import Icon from '../../icon/Icon';
import DropdownMenu from '../../dropdown/DropdownMenu';
import DropdownMenuButton from '../../dropdown/DropdownMenuButton';
import { ALIGNMENT } from '../interface';

interface Props {
    handleAlignment: (alignment: ALIGNMENT) => () => void;
    squireInfos: { [pathInfo: string]: boolean };
}

const SquireToolbarAlignmentDropdown = ({ handleAlignment, squireInfos }: Props) => {
    return (
        <SquireToolbarDropdown
            content={<Icon name="align-left" alt={c('Action').t`Alignment`} />}
            className="flex-item-noshrink"
            title={c('Action').t`Alignment`}
        >
            <DropdownMenu>
                <DropdownMenuButton
                    className="text-left flex flex-nowrap"
                    isSelected={squireInfos.alignLeft}
                    aria-pressed={squireInfos.alignLeft}
                    onClick={handleAlignment(ALIGNMENT.Left)}
                >
                    <Icon name="align-left" className="mt0-25" />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Align left`}</span>
                </DropdownMenuButton>
                <DropdownMenuButton
                    className="text-left flex flex-nowrap"
                    isSelected={squireInfos.alignCenter}
                    aria-pressed={squireInfos.alignCenter}
                    onClick={handleAlignment(ALIGNMENT.Center)}
                >
                    <Icon name="align-center" className="mt0-25" />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Center`}</span>
                </DropdownMenuButton>
                <DropdownMenuButton
                    className="text-left flex flex-nowrap"
                    isSelected={squireInfos.alignRight}
                    aria-pressed={squireInfos.alignRight}
                    onClick={handleAlignment(ALIGNMENT.Right)}
                >
                    <Icon name="align-right" className="mt0-25" />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Align right`}</span>
                </DropdownMenuButton>
                <DropdownMenuButton
                    className="text-left flex flex-nowrap"
                    isSelected={squireInfos.alignJustify}
                    aria-pressed={squireInfos.alignJustify}
                    onClick={handleAlignment(ALIGNMENT.Justify)}
                >
                    <Icon name="align-justify" className="mt0-25" />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Justify`}</span>
                </DropdownMenuButton>
            </DropdownMenu>
        </SquireToolbarDropdown>
    );
};

export default SquireToolbarAlignmentDropdown;

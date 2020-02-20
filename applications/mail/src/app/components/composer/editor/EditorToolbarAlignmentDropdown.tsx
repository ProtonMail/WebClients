import React, { MutableRefObject } from 'react';
import { Icon, DropdownMenu, DropdownMenuButton } from 'react-components';
import { c } from 'ttag';

import { SquireType } from '../../../helpers/squire/squireConfig';
import EditorToolbarDropdown from './EditorToolbarDropdown';

enum ALIGNMENT {
    Left = 'left',
    Center = 'center',
    Justify = 'justify',
    Right = 'right'
}

interface Props {
    squireRef: MutableRefObject<SquireType>;
}

const EditorToolbarAlignmentDropdown = ({ squireRef }: Props) => {
    const handleClick = (alignment: ALIGNMENT) => () => {
        squireRef.current.setTextAlignment(alignment);
    };

    return (
        <EditorToolbarDropdown size="narrow" content={<Icon name="text-align-left" />}>
            <DropdownMenu>
                <DropdownMenuButton className="alignleft" onClick={handleClick(ALIGNMENT.Left)}>
                    <Icon name="text-align-left" /> {c('Info').t`Align left`}
                </DropdownMenuButton>
                <DropdownMenuButton className="alignleft" onClick={handleClick(ALIGNMENT.Center)}>
                    <Icon name="text-center" /> {c('Info').t`Center`}
                </DropdownMenuButton>
                <DropdownMenuButton className="alignleft" onClick={handleClick(ALIGNMENT.Right)}>
                    <Icon name="text-align-right" /> {c('Info').t`Align right`}
                </DropdownMenuButton>
                <DropdownMenuButton className="alignleft" onClick={handleClick(ALIGNMENT.Justify)}>
                    <Icon name="text-justify" /> {c('Info').t`Justify`}
                </DropdownMenuButton>
            </DropdownMenu>
        </EditorToolbarDropdown>
    );
};

export default EditorToolbarAlignmentDropdown;

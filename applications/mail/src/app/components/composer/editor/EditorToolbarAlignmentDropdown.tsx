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
    pathInfos: { [pathInfo: string]: boolean };
}

const EditorToolbarAlignmentDropdown = ({ squireRef, pathInfos }: Props) => {
    const handleClick = (alignment: ALIGNMENT) => () => {
        squireRef.current.setTextAlignment(alignment);
    };

    return (
        <EditorToolbarDropdown size="narrow" content={<Icon name="text-align-left" />}>
            <DropdownMenu>
                <DropdownMenuButton
                    className="alignleft"
                    aria-pressed={pathInfos.alignLeft}
                    onClick={handleClick(ALIGNMENT.Left)}
                >
                    <Icon name="text-align-left" /> {c('Info').t`Align left`}
                </DropdownMenuButton>
                <DropdownMenuButton
                    className="alignleft"
                    aria-pressed={pathInfos.alignCenter}
                    onClick={handleClick(ALIGNMENT.Center)}
                >
                    <Icon name="text-center" /> {c('Info').t`Center`}
                </DropdownMenuButton>
                <DropdownMenuButton
                    className="alignleft"
                    aria-pressed={pathInfos.alignRight}
                    onClick={handleClick(ALIGNMENT.Right)}
                >
                    <Icon name="text-align-right" /> {c('Info').t`Align right`}
                </DropdownMenuButton>
                <DropdownMenuButton
                    className="alignleft"
                    aria-pressed={pathInfos.alignJustify}
                    onClick={handleClick(ALIGNMENT.Justify)}
                >
                    <Icon name="text-justify" /> {c('Info').t`Justify`}
                </DropdownMenuButton>
            </DropdownMenu>
        </EditorToolbarDropdown>
    );
};

export default EditorToolbarAlignmentDropdown;

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
    className?: string;
    title?: string;
}

const EditorToolbarAlignmentDropdown = ({ squireRef, pathInfos, className, title }: Props) => {
    const handleClick = (alignment: ALIGNMENT) => () => {
        squireRef.current.setTextAlignment(alignment);
    };

    return (
        <EditorToolbarDropdown content={<Icon name="text-align-left" />} className={className} title={title}>
            <DropdownMenu>
                <DropdownMenuButton
                    className="alignleft flex flex-nowrap"
                    aria-pressed={pathInfos.alignLeft}
                    onClick={handleClick(ALIGNMENT.Left)}
                >
                    <Icon name="text-align-left" className="mt0-25" />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Align left`}</span>
                </DropdownMenuButton>
                <DropdownMenuButton
                    className="alignleft flex flex-nowrap"
                    aria-pressed={pathInfos.alignCenter}
                    onClick={handleClick(ALIGNMENT.Center)}
                >
                    <Icon name="text-center" className="mt0-25" />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Center`}</span>
                </DropdownMenuButton>
                <DropdownMenuButton
                    className="alignleft flex flex-nowrap"
                    aria-pressed={pathInfos.alignRight}
                    onClick={handleClick(ALIGNMENT.Right)}
                >
                    <Icon name="text-align-right" className="mt0-25" />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Align right`}</span>
                </DropdownMenuButton>
                <DropdownMenuButton
                    className="alignleft flex flex-nowrap"
                    aria-pressed={pathInfos.alignJustify}
                    onClick={handleClick(ALIGNMENT.Justify)}
                >
                    <Icon name="text-justify" className="mt0-25" />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Justify`}</span>
                </DropdownMenuButton>
            </DropdownMenu>
        </EditorToolbarDropdown>
    );
};

export default EditorToolbarAlignmentDropdown;

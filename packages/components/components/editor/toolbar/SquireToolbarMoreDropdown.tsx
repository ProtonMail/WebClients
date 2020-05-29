import React, { MutableRefObject, ReactNode } from 'react';
import { c } from 'ttag';
import { RIGHT_TO_LEFT } from 'proton-shared/lib/constants';

import DropdownMenu from '../../dropdown/DropdownMenu';
import DropdownMenuButton from '../../dropdown/DropdownMenuButton';
import Icon from '../../icon/Icon';
import { classnames } from '../../../helpers/component';

import SquireToolbarDropdown from './SquireToolbarDropdown';
import { SquireType } from '../squireConfig';
import { setTextDirection } from '../squireActions';
import { SquireEditorMetadata } from '../SquireEditor';
import { ALIGNMENT } from './SquireToolbar';

const getClassname = (status: boolean) => (status ? undefined : 'nonvisible');

interface Props {
    metadata: SquireEditorMetadata;
    onChangeMetadata: (change: Partial<SquireEditorMetadata>) => void;
    squireRef: MutableRefObject<SquireType>;
    children?: ReactNode;
    isNarrow?: boolean;
    squireInfos: { [test: string]: boolean };
    squireActions: {
        handleBold: () => void;
        handleItalic: () => void;
        handleUnderline: () => void;
        handleAlignment: (alignment: ALIGNMENT) => () => void;
        handleUnorderedList: () => void;
        handleOrderedList: () => void;
        handleBlockquote: () => void;
    };
}

const SquireToolbarMoreDropdown = ({
    metadata,
    squireRef,
    onChangeMetadata,
    children,
    isNarrow = false,
    squireInfos,
    squireActions
}: Props) => {
    const isRTL = metadata.rightToLeft === RIGHT_TO_LEFT.ON;
    const isPlainText = metadata.isPlainText;

    const handleChangeDirection = (rightToLeft: RIGHT_TO_LEFT) => () => {
        onChangeMetadata({ rightToLeft });
        setTimeout(() => setTextDirection(squireRef.current, rightToLeft));
    };

    const switchToPlainText = () => {
        onChangeMetadata({ isPlainText: true });
    };

    const switchToHTML = () => {
        onChangeMetadata({ isPlainText: false });
    };

    const handleChangePlainText = (newIsPlainText: boolean) => () => {
        if (metadata.isPlainText !== newIsPlainText) {
            if (newIsPlainText) {
                switchToPlainText();
            } else {
                switchToHTML();
            }
        }
    };

    // DropdownMenu works with its list of children so we can't use Fragments here
    // We use array of node instead
    return (
        <SquireToolbarDropdown className="flex-item-noshrink mlauto" title={c('Action').t`More`}>
            <DropdownMenu className="editor-toolbar-more-menu flex-item-noshrink">
                {isNarrow && [
                    <DropdownMenuButton
                        key={5}
                        className="alignleft flex flex-nowrap"
                        onClick={squireActions.handleBold}
                    >
                        <Icon name="on" className={classnames(['mt0-25', getClassname(squireInfos.bold)])} />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Bold`}</span>
                    </DropdownMenuButton>,
                    <DropdownMenuButton
                        key={6}
                        liClassName="dropDown-item--no-separator"
                        className="alignleft flex flex-nowrap"
                        onClick={squireActions.handleItalic}
                    >
                        <Icon name="on" className={classnames(['mt0-25', getClassname(squireInfos.italic)])} />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Italic`}</span>
                    </DropdownMenuButton>,
                    <DropdownMenuButton
                        key={7}
                        liClassName="dropDown-item--no-separator"
                        className="alignleft flex flex-nowrap"
                        onClick={squireActions.handleUnderline}
                    >
                        <Icon name="on" className={classnames(['mt0-25', getClassname(squireInfos.underline)])} />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Underline`}</span>
                    </DropdownMenuButton>,
                    <DropdownMenuButton
                        key={8}
                        className="alignleft flex flex-nowrap"
                        onClick={squireActions.handleAlignment(ALIGNMENT.Left)}
                    >
                        <Icon name="on" className={classnames(['mt0-25', getClassname(squireInfos.alignLeft)])} />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Align left`}</span>
                    </DropdownMenuButton>,
                    <DropdownMenuButton
                        key={9}
                        liClassName="dropDown-item--no-separator"
                        className="alignleft flex flex-nowrap"
                        onClick={squireActions.handleAlignment(ALIGNMENT.Center)}
                    >
                        <Icon name="on" className={classnames(['mt0-25', getClassname(squireInfos.alignCenter)])} />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Align center`}</span>
                    </DropdownMenuButton>,
                    <DropdownMenuButton
                        key={10}
                        liClassName="dropDown-item--no-separator"
                        className="alignleft flex flex-nowrap"
                        onClick={squireActions.handleAlignment(ALIGNMENT.Right)}
                    >
                        <Icon name="on" className={classnames(['mt0-25', getClassname(squireInfos.alignRight)])} />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Align right`}</span>
                    </DropdownMenuButton>,
                    <DropdownMenuButton
                        key={11}
                        liClassName="dropDown-item--no-separator"
                        className="alignleft flex flex-nowrap"
                        onClick={squireActions.handleAlignment(ALIGNMENT.Justify)}
                    >
                        <Icon name="on" className={classnames(['mt0-25', getClassname(squireInfos.alignJustify)])} />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Justify`}</span>
                    </DropdownMenuButton>,
                    <DropdownMenuButton
                        key={12}
                        className="alignleft flex flex-nowrap"
                        onClick={squireActions.handleUnorderedList}
                    >
                        <Icon name="on" className={classnames(['mt0-25', getClassname(squireInfos.unorderedList)])} />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Unordered list`}</span>
                    </DropdownMenuButton>,
                    <DropdownMenuButton
                        key={13}
                        liClassName="dropDown-item--no-separator"
                        className="alignleft flex flex-nowrap"
                        onClick={squireActions.handleOrderedList}
                    >
                        <Icon name="on" className={classnames(['mt0-25', getClassname(squireInfos.orderedList)])} />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Ordered list`}</span>
                    </DropdownMenuButton>,
                    <DropdownMenuButton
                        key={14}
                        className="alignleft flex flex-nowrap"
                        onClick={squireActions.handleBlockquote}
                    >
                        <Icon name="on" className={classnames(['mt0-25', getClassname(squireInfos.blockquote)])} />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Quote`}</span>
                    </DropdownMenuButton>
                ]}
                {metadata.supportRightToLeft &&
                    !metadata.isPlainText && [
                        <DropdownMenuButton
                            key={1}
                            className="alignleft flex flex-nowrap"
                            onClick={handleChangeDirection(RIGHT_TO_LEFT.OFF)}
                        >
                            <Icon name="on" className={classnames(['mt0-25', getClassname(!isRTL)])} />
                            <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Left to Right`}</span>
                        </DropdownMenuButton>,
                        <DropdownMenuButton
                            key={2}
                            liClassName="dropDown-item--no-separator"
                            className="alignleft flex flex-nowrap"
                            onClick={handleChangeDirection(RIGHT_TO_LEFT.ON)}
                        >
                            <Icon name="on" className={classnames(['mt0-25', getClassname(isRTL)])} />
                            <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Right to Left`}</span>
                        </DropdownMenuButton>
                    ]}
                {metadata.supportPlainText && [
                    <DropdownMenuButton
                        key={3}
                        className="alignleft flex flex-nowrap noborder-bottom"
                        onClick={handleChangePlainText(false)}
                    >
                        <Icon name="on" className={classnames(['mt0-25', getClassname(!isPlainText)])} />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Normal`}</span>
                    </DropdownMenuButton>,
                    <DropdownMenuButton
                        key={4}
                        liClassName="dropDown-item--no-separator"
                        className="alignleft flex flex-nowrap"
                        onClick={handleChangePlainText(true)}
                    >
                        <Icon name="on" className={classnames(['mt0-25', getClassname(isPlainText)])} />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Plain text`}</span>
                    </DropdownMenuButton>
                ]}
                {children}
            </DropdownMenu>
        </SquireToolbarDropdown>
    );
};

export default SquireToolbarMoreDropdown;

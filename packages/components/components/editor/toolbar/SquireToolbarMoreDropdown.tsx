import React, { MutableRefObject, ReactNode } from 'react';
import { c } from 'ttag';
import { RIGHT_TO_LEFT } from 'proton-shared/lib/constants';

import DropdownMenu from '../../dropdown/DropdownMenu';
import DropdownMenuButton from '../../dropdown/DropdownMenuButton';
import Icon from '../../icon/Icon';
import { classnames } from '../../../helpers';

import SquireToolbarDropdown from './SquireToolbarDropdown';
import { SquireType } from '../squireConfig';
import { setTextDirection } from '../squireActions';
import { SquireEditorMetadata, ALIGNMENT } from '../interface';

const getClassname = (status: boolean) => (status ? undefined : 'visibility-hidden');

interface Props {
    metadata: SquireEditorMetadata;
    onChangeMetadata: (change: Partial<SquireEditorMetadata>) => void;
    squireRef: MutableRefObject<SquireType>;
    children?: ReactNode;
    isNarrow?: boolean;
    squireInfos: { [test: string]: boolean };
    squireActions: {
        handleAlignment: (alignment: ALIGNMENT) => () => void;
        handleUnorderedList: () => void;
        handleOrderedList: () => void;
        handleBlockquote: () => void;
        handleLink: () => void;
        handleClearFormatting: () => void;
        handleImage: () => void;
    };
}

const SquireToolbarMoreDropdown = ({
    metadata,
    squireRef,
    onChangeMetadata,
    children,
    isNarrow = false,
    squireInfos,
    squireActions,
}: Props) => {
    const isRTL = metadata.rightToLeft === RIGHT_TO_LEFT.ON;
    const { isPlainText } = metadata;

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
        <SquireToolbarDropdown
            className="flex-item-noshrink mlauto"
            title={c('Action').t`More`}
            data-testid="squire-more"
        >
            <DropdownMenu className="editor-toolbar-more-menu flex-item-noshrink">
                {isNarrow && [
                    <DropdownMenuButton
                        key={12}
                        className="text-left flex flex-nowrap"
                        onClick={squireActions.handleUnorderedList}
                    >
                        <Icon name="on" className={classnames(['mt0-25', getClassname(squireInfos.unorderedList)])} />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Unordered list`}</span>
                        <Icon name="bullet-points" className="mt0-25 mr0-5" />
                    </DropdownMenuButton>,
                    <DropdownMenuButton
                        key={13}
                        className="text-left flex flex-nowrap"
                        onClick={squireActions.handleOrderedList}
                    >
                        <Icon name="on" className={classnames(['mt0-25', getClassname(squireInfos.orderedList)])} />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Ordered list`}</span>
                        <Icon name="ordered-list" className="mt0-25 mr0-5" />
                    </DropdownMenuButton>,
                    <div className="dropdown-item-hr" key="hr-1" />,
                    <DropdownMenuButton
                        key={8}
                        className="text-left flex flex-nowrap"
                        onClick={squireActions.handleAlignment(ALIGNMENT.Left)}
                    >
                        <Icon name="on" className={classnames(['mt0-25', getClassname(squireInfos.alignLeft)])} />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Align left`}</span>
                        <Icon name="text-align-left" className="mt0-25 mr0-5" />
                    </DropdownMenuButton>,
                    <DropdownMenuButton
                        key={9}
                        className="text-left flex flex-nowrap"
                        onClick={squireActions.handleAlignment(ALIGNMENT.Center)}
                    >
                        <Icon name="on" className={classnames(['mt0-25', getClassname(squireInfos.alignCenter)])} />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Align center`}</span>
                        <Icon name="text-center" className="mt0-25 mr0-5" />
                    </DropdownMenuButton>,
                    <DropdownMenuButton
                        key={10}
                        className="text-left flex flex-nowrap"
                        onClick={squireActions.handleAlignment(ALIGNMENT.Right)}
                    >
                        <Icon name="on" className={classnames(['mt0-25', getClassname(squireInfos.alignRight)])} />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Align right`}</span>
                        <Icon name="text-align-right" className="mt0-25 mr0-5" />
                    </DropdownMenuButton>,
                    <DropdownMenuButton
                        key={11}
                        className="text-left flex flex-nowrap"
                        onClick={squireActions.handleAlignment(ALIGNMENT.Justify)}
                    >
                        <Icon name="on" className={classnames(['mt0-25', getClassname(squireInfos.alignJustify)])} />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Justify`}</span>
                        <Icon name="text-justify" className="mt0-25 mr0-5" />
                    </DropdownMenuButton>,
                    <div className="dropdown-item-hr" key="hr-2" />,
                    <DropdownMenuButton
                        key={14}
                        className="text-left flex flex-nowrap"
                        onClick={squireActions.handleBlockquote}
                    >
                        <Icon name="on" className={classnames(['mt0-25', getClassname(squireInfos.blockquote)])} />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Quote`}</span>
                        <Icon name="text-quote" className="mt0-25 mr0-5" />
                    </DropdownMenuButton>,
                    <DropdownMenuButton
                        key={15}
                        className="text-left flex flex-nowrap"
                        onClick={squireActions.handleLink}
                    >
                        <Icon name="on" className={classnames(['mt0-25', 'visibility-hidden'])} />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Insert link`}</span>
                        <Icon name="link" className="mt0-25 mr0-5" />
                    </DropdownMenuButton>,
                    <DropdownMenuButton
                        key={16}
                        className="text-left flex flex-nowrap"
                        onClick={squireActions.handleClearFormatting}
                    >
                        <Icon name="on" className={classnames(['mt0-25', 'visibility-hidden'])} />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action')
                            .t`Clear all formatting`}</span>
                        <Icon name="remove-text-formatting" className="mt0-25 mr0-5" />
                    </DropdownMenuButton>,
                    <div className="dropdown-item-hr" key="hr-3" />,
                    metadata.supportImages && [
                        <DropdownMenuButton
                            key={17}
                            className="text-left flex flex-nowrap"
                            onClick={squireActions.handleImage}
                        >
                            <Icon name="on" className={classnames(['mt0-25', 'visibility-hidden'])} />
                            <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Insert image`}</span>
                            <Icon name="file-image" className="mt0-25 mr0-5" />
                        </DropdownMenuButton>,
                        <div className="dropdown-item-hr" key="hr-4" />,
                    ],
                ]}
                {metadata.supportRightToLeft &&
                    !metadata.isPlainText && [
                        <DropdownMenuButton
                            key={1}
                            className="text-left flex flex-nowrap"
                            onClick={handleChangeDirection(RIGHT_TO_LEFT.OFF)}
                        >
                            <Icon name="on" className={classnames(['mt0-25', getClassname(!isRTL)])} />
                            <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Left to Right`}</span>
                        </DropdownMenuButton>,
                        <DropdownMenuButton
                            key={2}
                            className="text-left flex flex-nowrap"
                            onClick={handleChangeDirection(RIGHT_TO_LEFT.ON)}
                        >
                            <Icon name="on" className={classnames(['mt0-25', getClassname(isRTL)])} />
                            <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Right to Left`}</span>
                        </DropdownMenuButton>,
                        <div className="dropdown-item-hr" key="hr-5" />,
                    ]}
                {metadata.supportPlainText && [
                    <DropdownMenuButton
                        key={3}
                        className="text-left flex flex-nowrap no-border-bottom"
                        onClick={handleChangePlainText(false)}
                        data-testid="squire-to-html"
                    >
                        <Icon name="on" className={classnames(['mt0-25', getClassname(!isPlainText)])} />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Normal`}</span>
                    </DropdownMenuButton>,
                    <DropdownMenuButton
                        key={4}
                        className="text-left flex flex-nowrap"
                        onClick={handleChangePlainText(true)}
                        data-testid="squire-to-plaintext"
                    >
                        <Icon name="on" className={classnames(['mt0-25', getClassname(isPlainText)])} />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Plain text`}</span>
                    </DropdownMenuButton>,
                    <div className="dropdown-item-hr" key="hr-6" />,
                ]}
                {children}
            </DropdownMenu>
        </SquireToolbarDropdown>
    );
};

export default SquireToolbarMoreDropdown;

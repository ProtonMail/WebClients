import { Alignment, Direction } from 'roosterjs-editor-types';
import { c } from 'ttag';
import DropdownMenu from '../../dropdown/DropdownMenu';
import DropdownMenuButton from '../../dropdown/DropdownMenuButton';
import Icon from '../../icon/Icon';
import { classnames } from '../../../helpers';
import ToolbarDropdown from './ToolbarDropdown';
import { EditorMetadata } from '../interface';
import { ToolbarConfig } from '../helpers/getToolbarConfig';

const getClassname = (status: boolean) => (status ? undefined : 'visibility-hidden');

interface Props {
    metadata: EditorMetadata;
    onChangeMetadata: (change: Partial<EditorMetadata>) => void;
    isNarrow?: boolean;
    config: ToolbarConfig;
}

const ToolbarMoreDropdown = ({ metadata, isNarrow = false, config, onChangeMetadata }: Props) => (
    <ToolbarDropdown
        className="flex-item-noshrink mlauto editor-toolbar-more-dropdown"
        title={c('Action').t`More`}
        data-testid="editor-toolbar-more"
    >
        <DropdownMenu className="editor-toolbar-more-menu flex-item-noshrink">
            {isNarrow && [
                <DropdownMenuButton
                    key={12}
                    className="text-left flex flex-nowrap"
                    onClick={config.unorderedList.toggle}
                >
                    <Icon
                        name="check"
                        className={classnames(['mt0-25', getClassname(config.unorderedList.isActive)])}
                    />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Unordered list`}</span>
                    <Icon name="list" className="mt0-25 mr0-5" />
                </DropdownMenuButton>,
                <DropdownMenuButton key={13} className="text-left flex flex-nowrap" onClick={config.orderedList.toggle}>
                    <Icon name="check" className={classnames(['mt0-25', getClassname(config.orderedList.isActive)])} />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Ordered list`}</span>
                    <Icon name="list-numbers" className="mt0-25 mr0-5" />
                </DropdownMenuButton>,
                <div className="dropdown-item-hr" key="hr-1" />,
                <DropdownMenuButton
                    key={8}
                    className="text-left flex flex-nowrap"
                    onClick={() => config.alignment.setValue(Alignment.Left)}
                >
                    <Icon name="check" className={classnames(['mt0-25', 'visibility-hidden'])} />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Align left`}</span>
                    <Icon name="align-left" className="mt0-25 mr0-5" />
                </DropdownMenuButton>,
                <DropdownMenuButton
                    key={9}
                    className="text-left flex flex-nowrap"
                    onClick={() => config.alignment.setValue(Alignment.Center)}
                >
                    <Icon name="check" className={classnames(['mt0-25', 'visibility-hidden'])} />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Align center`}</span>
                    <Icon name="align-center" className="mt0-25 mr0-5" />
                </DropdownMenuButton>,
                <DropdownMenuButton
                    key={10}
                    className="text-left flex flex-nowrap"
                    onClick={() => config.alignment.setValue(Alignment.Center)}
                >
                    <Icon name="check" className={classnames(['mt0-25', 'visibility-hidden'])} />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Align right`}</span>
                    <Icon name="align-right" className="mt0-25 mr0-5" />
                </DropdownMenuButton>,
                <div className="dropdown-item-hr" key="hr-2" />,
                <DropdownMenuButton
                    key={14}
                    className="text-left flex flex-nowrap"
                    onClick={() => config.blockquote.toggle}
                >
                    <Icon name="check" className={classnames(['mt0-25', getClassname(config.blockquote.isActive)])} />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Quote`}</span>
                    <Icon name="quote-right" className="mt0-25 mr0-5" />
                </DropdownMenuButton>,
                <DropdownMenuButton
                    key={15}
                    className="text-left flex flex-nowrap"
                    onClick={() => config.link.showModal}
                >
                    <Icon name="check" className={classnames(['mt0-25', 'visibility-hidden'])} />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Insert link`}</span>
                    <Icon name="link" className="mt0-25 mr0-5" />
                </DropdownMenuButton>,
                <DropdownMenuButton
                    key={16}
                    className="text-left flex flex-nowrap"
                    onClick={() => config.formatting.clear}
                >
                    <Icon name="check" className={classnames(['mt0-25', 'visibility-hidden'])} />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Clear all formatting`}</span>
                    <Icon name="eraser" className="mt0-25 mr0-5" />
                </DropdownMenuButton>,
                <div className="dropdown-item-hr" key="hr-3" />,
                metadata.supportImages && [
                    <DropdownMenuButton
                        key={17}
                        className="text-left flex flex-nowrap"
                        onClick={() => config.image.showModal}
                    >
                        <Icon name="check" className={classnames(['mt0-25', 'visibility-hidden'])} />
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
                        onClick={() => config.textDirection.setValue(Direction.LeftToRight)}
                    >
                        <Icon
                            name="check"
                            className={classnames([
                                'mt0-25',
                                getClassname(metadata.rightToLeft === Direction.LeftToRight),
                            ])}
                        />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Left to Right`}</span>
                    </DropdownMenuButton>,
                    <DropdownMenuButton
                        key={2}
                        className="text-left flex flex-nowrap"
                        onClick={() => config.textDirection.setValue(Direction.RightToLeft)}
                    >
                        <Icon
                            name="check"
                            className={classnames([
                                'mt0-25',
                                getClassname(metadata.rightToLeft === Direction.RightToLeft),
                            ])}
                        />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Right to Left`}</span>
                    </DropdownMenuButton>,
                    <div className="dropdown-item-hr" key="hr-5" />,
                ]}
            {metadata.supportPlainText && [
                <DropdownMenuButton
                    key={3}
                    className="text-left flex flex-nowrap border-bottom-none"
                    onClick={() => {
                        if (metadata.isPlainText !== false) {
                            onChangeMetadata({ isPlainText: false });
                        }
                    }}
                    data-testid="editor-to-html"
                >
                    <Icon name="check" className={classnames(['mt0-25', getClassname(!metadata.isPlainText)])} />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Normal`}</span>
                </DropdownMenuButton>,
                <DropdownMenuButton
                    key={4}
                    className="text-left flex flex-nowrap"
                    onClick={() => {
                        if (metadata.isPlainText !== true) {
                            onChangeMetadata({ isPlainText: true });
                        }
                    }}
                    data-testid="editor-to-plaintext"
                >
                    <Icon name="check" className={classnames(['mt0-25', getClassname(metadata.isPlainText)])} />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Plain text`}</span>
                </DropdownMenuButton>,
            ]}
        </DropdownMenu>
    </ToolbarDropdown>
);

export default ToolbarMoreDropdown;

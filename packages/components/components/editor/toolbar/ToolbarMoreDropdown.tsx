import { Alignment, Direction } from 'roosterjs-editor-types';
import { c } from 'ttag';

import DropdownMenu from '../../dropdown/DropdownMenu';
import DropdownMenuButton from '../../dropdown/DropdownMenuButton';
import Icon from '../../icon/Icon';
import { ToolbarConfig } from '../helpers/getToolbarConfig';
import { EditorMetadata } from '../interface';
import ToolbarDropdown from './ToolbarDropdown';

const getClassname = (status: boolean) => (status ? undefined : 'visibility-hidden');

interface Props {
    metadata: EditorMetadata;
    isNarrow?: boolean;
    config: ToolbarConfig;
}

const ToolbarMoreDropdown = ({ metadata, isNarrow = false, config }: Props) => (
    <ToolbarDropdown
        content={<Icon name="three-dots-horizontal" alt={c('Action').t`More`} />}
        className="flex-item-noshrink mlauto editor-toolbar-more-dropdown"
        title={c('Action').t`More`}
        data-testid="editor-toolbar-more"
        hasCaret={false}
    >
        <DropdownMenu className="editor-toolbar-more-menu flex-item-noshrink">
            {!isNarrow && metadata.supportImages && (
                <DropdownMenuButton
                    key={17}
                    className="text-left flex flex-nowrap flex-align-items-center"
                    onClick={() => config.image.showModal()}
                >
                    <Icon name="checkmark" className="visibility-hidden" />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Insert image`}</span>
                </DropdownMenuButton>
            )}
            {isNarrow && [
                <DropdownMenuButton
                    key={12}
                    className="text-left flex flex-nowrap flex-align-items-center"
                    onClick={config.unorderedList.toggle}
                >
                    <Icon name="checkmark" className={getClassname(config.unorderedList.isActive)} />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Unordered list`}</span>
                    <Icon name="list-bullets" className="mr0-5" />
                </DropdownMenuButton>,
                <DropdownMenuButton
                    key={13}
                    className="text-left flex flex-nowrap flex-align-items-center"
                    onClick={config.orderedList.toggle}
                >
                    <Icon name="checkmark" className={getClassname(config.orderedList.isActive)} />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Ordered list`}</span>
                    <Icon name="list-numbers" className="mr0-5" />
                </DropdownMenuButton>,
                <div className="dropdown-item-hr" key="hr-1" />,
                <DropdownMenuButton
                    key={8}
                    className="text-left flex flex-nowrap flex-align-items-center"
                    onClick={() => config.alignment.setValue(Alignment.Left)}
                >
                    <Icon name="checkmark" className="visibility-hidden" />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Align left`}</span>
                    <Icon name="text-align-left" className="mr0-5" />
                </DropdownMenuButton>,
                <DropdownMenuButton
                    key={9}
                    className="text-left flex flex-nowrap flex-align-items-center"
                    onClick={() => config.alignment.setValue(Alignment.Center)}
                >
                    <Icon name="checkmark" className="visibility-hidden" />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Align center`}</span>
                    <Icon name="text-align-center" className="mr0-5" />
                </DropdownMenuButton>,
                <DropdownMenuButton
                    key={10}
                    className="text-left flex flex-nowrap flex-align-items-center"
                    onClick={() => config.alignment.setValue(Alignment.Center)}
                >
                    <Icon name="checkmark" className="visibility-hidden" />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Align right`}</span>
                    <Icon name="text-align-right" className="mr0-5" />
                </DropdownMenuButton>,
                <div className="dropdown-item-hr" key="hr-2" />,
                <DropdownMenuButton
                    key={14}
                    className="text-left flex flex-nowrap flex-align-items-center"
                    onClick={config.blockquote.toggle}
                >
                    <Icon name="checkmark" className={getClassname(config.blockquote.isActive)} />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Quote`}</span>
                    <Icon name="text-quote" className="mr0-5" />
                </DropdownMenuButton>,
                <DropdownMenuButton
                    key={15}
                    className="text-left flex flex-nowrap flex-align-items-center"
                    onClick={config.link.showModal}
                >
                    <Icon name="checkmark" className="visibility-hidden" />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Insert link`}</span>
                    <Icon name="link" className="mr0-5" />
                </DropdownMenuButton>,
                <DropdownMenuButton
                    key={16}
                    className="text-left flex flex-nowrap flex-align-items-center"
                    onClick={() => config.formatting.clear()}
                >
                    <Icon name="checkmark" className="visibility-hidden" />
                    <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Clear all formatting`}</span>
                    <Icon name="eraser" className="mr0-5" />
                </DropdownMenuButton>,
                <div className="dropdown-item-hr" key="hr-3" />,
                metadata.supportImages && [
                    <DropdownMenuButton
                        key={17}
                        className="text-left flex flex-nowrap flex-align-items-center"
                        onClick={() => config.image.showModal()}
                    >
                        <Icon name="checkmark" className="visibility-hidden" />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Action').t`Insert image`}</span>
                        <Icon name="file-image" className="mr0-5" />
                    </DropdownMenuButton>,
                    (metadata.supportRightToLeft || metadata.supportPlainText) && (
                        <div className="dropdown-item-hr" key="hr-4" />
                    ),
                ],
            ]}
            {metadata.supportRightToLeft &&
                !metadata.isPlainText && [
                    <DropdownMenuButton
                        key={1}
                        className="text-left flex flex-nowrap flex-align-items-center"
                        onClick={() => config.textDirection.setValue(Direction.LeftToRight)}
                    >
                        <Icon
                            name="checkmark"
                            className={getClassname(metadata.rightToLeft === Direction.LeftToRight)}
                        />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Left to Right`}</span>
                    </DropdownMenuButton>,
                    <DropdownMenuButton
                        key={2}
                        className="text-left flex flex-nowrap flex-align-items-center"
                        onClick={() => config.textDirection.setValue(Direction.RightToLeft)}
                    >
                        <Icon
                            name="checkmark"
                            className={getClassname(metadata.rightToLeft === Direction.RightToLeft)}
                        />
                        <span className="ml0-5 mtauto mbauto flex-item-fluid">{c('Info').t`Right to Left`}</span>
                    </DropdownMenuButton>,
                ]}
        </DropdownMenu>
    </ToolbarDropdown>
);

export default ToolbarMoreDropdown;

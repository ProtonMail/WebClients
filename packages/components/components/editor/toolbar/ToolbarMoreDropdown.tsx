import { Alignment } from 'roosterjs-editor-types';
import { c } from 'ttag';

import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcEraser } from '@proton/icons/icons/IcEraser';
import { IcFileImage } from '@proton/icons/icons/IcFileImage';
import { IcLink } from '@proton/icons/icons/IcLink';
import { IcListBullets } from '@proton/icons/icons/IcListBullets';
import { IcListNumbers } from '@proton/icons/icons/IcListNumbers';
import { IcTextAlignCenter } from '@proton/icons/icons/IcTextAlignCenter';
import { IcTextAlignLeft } from '@proton/icons/icons/IcTextAlignLeft';
import { IcTextAlignRight } from '@proton/icons/icons/IcTextAlignRight';
import { IcTextQuote } from '@proton/icons/icons/IcTextQuote';
import { IcThreeDotsHorizontal } from '@proton/icons/icons/IcThreeDotsHorizontal';
import { COMPOSER_TOOLBAR_ICON_SIZE } from '@proton/shared/lib/constants';
import { DIRECTION } from '@proton/shared/lib/mail/mailSettings';

import type { ToolbarConfig } from '../helpers/getToolbarConfig';
import type { EditorMetadata } from '../interface';
import ToolbarDropdown from './ToolbarDropdown';

const getClassname = (status: boolean) => (status ? undefined : 'visibility-hidden');

interface Props {
    metadata: EditorMetadata;
    isNarrow?: boolean;
    config: ToolbarConfig;
}

const ToolbarMoreDropdown = ({ metadata, isNarrow = false, config }: Props) => (
    <ToolbarDropdown
        content={<IcThreeDotsHorizontal size={COMPOSER_TOOLBAR_ICON_SIZE} alt={c('Action').t`More`} />}
        className="shrink-0 ml-auto editor-toolbar-more-dropdown"
        title={c('Action').t`More`}
        data-testid="editor-toolbar-more"
        hasCaret={false}
    >
        <DropdownMenu className="editor-toolbar-more-menu shrink-0">
            {!isNarrow && metadata.supportFiles && (
                <DropdownMenuButton
                    key={17}
                    className="text-left flex flex-nowrap items-center"
                    onClick={() => config.image.showModal()}
                    data-testid="editor-insert-image"
                >
                    <IcCheckmark className="visibility-hidden" />
                    <span className="ml-2 my-auto flex-1">{c('Action').t`Insert image`}</span>
                </DropdownMenuButton>
            )}
            {isNarrow && [
                <DropdownMenuButton
                    key={12}
                    className="text-left flex flex-nowrap items-center"
                    onClick={config.unorderedList.toggle}
                >
                    <IcCheckmark className={getClassname(config.unorderedList.isActive)} />
                    <span className="ml-2 my-auto flex-1">{c('Action').t`Unordered list`}</span>
                    <IcListBullets className="mr-2" />
                </DropdownMenuButton>,
                <DropdownMenuButton
                    key={13}
                    className="text-left flex flex-nowrap items-center"
                    onClick={config.orderedList.toggle}
                >
                    <IcCheckmark className={getClassname(config.orderedList.isActive)} />
                    <span className="ml-2 my-auto flex-1">{c('Action').t`Ordered list`}</span>
                    <IcListNumbers className="mr-2" />
                </DropdownMenuButton>,
                <div className="dropdown-item-hr" key="hr-1" />,
                <DropdownMenuButton
                    key={8}
                    className="text-left flex flex-nowrap items-center"
                    onClick={() => config.alignment.setValue(Alignment.Left)}
                >
                    <IcCheckmark className="visibility-hidden" />
                    <span className="ml-2 my-auto flex-1">{c('Action').t`Align left`}</span>
                    <IcTextAlignLeft className="mr-2" />
                </DropdownMenuButton>,
                <DropdownMenuButton
                    key={9}
                    className="text-left flex flex-nowrap items-center"
                    onClick={() => config.alignment.setValue(Alignment.Center)}
                >
                    <IcCheckmark className="visibility-hidden" />
                    <span className="ml-2 my-auto flex-1">{c('Action').t`Align center`}</span>
                    <IcTextAlignCenter className="mr-2" />
                </DropdownMenuButton>,
                <DropdownMenuButton
                    key={10}
                    className="text-left flex flex-nowrap items-center"
                    onClick={() => config.alignment.setValue(Alignment.Center)}
                >
                    <IcCheckmark className="visibility-hidden" />
                    <span className="ml-2 my-auto flex-1">{c('Action').t`Align right`}</span>
                    <IcTextAlignRight className="mr-2" />
                </DropdownMenuButton>,
                <div className="dropdown-item-hr" key="hr-2" />,
                <DropdownMenuButton
                    key={14}
                    className="text-left flex flex-nowrap items-center"
                    onClick={config.blockquote.toggle}
                >
                    <IcCheckmark className={getClassname(config.blockquote.isActive)} />
                    <span className="ml-2 my-auto flex-1">{c('Action').t`Quote`}</span>
                    <IcTextQuote className="mr-2" />
                </DropdownMenuButton>,
                <DropdownMenuButton
                    key={15}
                    className="text-left flex flex-nowrap items-center"
                    onClick={config.link.showModal}
                >
                    <IcCheckmark className="visibility-hidden" />
                    <span className="ml-2 my-auto flex-1">{c('Action').t`Insert link`}</span>
                    <IcLink className="mr-2" />
                </DropdownMenuButton>,
                <DropdownMenuButton
                    key={16}
                    className="text-left flex flex-nowrap items-center"
                    onClick={() => config.formatting.clear()}
                >
                    <IcCheckmark className="visibility-hidden" />
                    <span className="ml-2 my-auto flex-1">{c('Action').t`Clear all formatting`}</span>
                    <IcEraser className="mr-2" />
                </DropdownMenuButton>,
                <div className="dropdown-item-hr" key="hr-3" />,
                metadata.supportFiles && [
                    <DropdownMenuButton
                        key={17}
                        className="text-left flex flex-nowrap items-center"
                        onClick={() => config.image.showModal()}
                    >
                        <IcCheckmark className="visibility-hidden" />
                        <span className="ml-2 my-auto flex-1">{c('Action').t`Insert image`}</span>
                        <IcFileImage className="mr-2" />
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
                        className="text-left flex flex-nowrap items-center"
                        onClick={() => config.textDirection.setValue(DIRECTION.LEFT_TO_RIGHT)}
                        data-testid="editor-left-to-right"
                    >
                        <IcCheckmark className={getClassname(metadata.rightToLeft === DIRECTION.LEFT_TO_RIGHT)} />
                        <span className="ml-2 my-auto flex-1">{c('Info').t`Left to Right`}</span>
                    </DropdownMenuButton>,
                    <DropdownMenuButton
                        key={2}
                        className="text-left flex flex-nowrap items-center"
                        onClick={() => config.textDirection.setValue(DIRECTION.RIGHT_TO_LEFT)}
                        data-testid="editor-right-to-left"
                    >
                        <IcCheckmark className={getClassname(metadata.rightToLeft === DIRECTION.RIGHT_TO_LEFT)} />
                        <span className="ml-2 my-auto flex-1">{c('Info').t`Right to Left`}</span>
                    </DropdownMenuButton>,
                ]}
        </DropdownMenu>
    </ToolbarDropdown>
);

export default ToolbarMoreDropdown;

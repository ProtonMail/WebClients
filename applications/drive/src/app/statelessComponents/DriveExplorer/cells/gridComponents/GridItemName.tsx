import { MiddleEllipsis } from '@proton/components';
import { NodeType } from '@proton/drive';
import { splitExtension } from '@proton/shared/lib/helpers/file';
import { rtlSanitize } from '@proton/shared/lib/helpers/string';

import { SignatureIcon } from '../../../SignatureIcon';

export interface GridItemNameProps {
    name: string;
    type: NodeType;
    haveSignatureIssues?: boolean;
    testId?: string;
}

const CHARACTERS_BEFORE_EXTENSION = 1; // The dot before the extension

export function GridItemName({
    name,
    haveSignatureIssues = false,
    type,
    testId = 'grid-item-name',
}: GridItemNameProps) {
    const sanitized = rtlSanitize(name);
    const isFile = type === NodeType.File || type === NodeType.Photo;
    const [, extension] = isFile ? splitExtension(sanitized) : ['', ''];

    const hasExtension = extension.length > 0;
    const charsToDisplayEnd = hasExtension ? extension.length + CHARACTERS_BEFORE_EXTENSION : 0;

    return (
        <div className="flex items-center mx-auto">
            <SignatureIcon haveSignatureIssues={haveSignatureIssues} type={type} className="mr-2 shrink-0" />
            <MiddleEllipsis
                charsToDisplayEnd={charsToDisplayEnd}
                text={sanitized}
                displayTitle={false}
                displayTooltip
                data-testid={testId}
                splitOnlyTooLong
            />
        </div>
    );
}

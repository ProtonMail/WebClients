import { NodeType } from '@proton/drive/index';

import { FileName } from '../../../../components/FileName';
import { SignatureIcon } from '../../../../components/SignatureIcon';

export interface GridItemNameProps {
    name: string;
    type: NodeType;
    haveSignatureIssues?: boolean;
    testId?: string;
}

export function GridItemName({
    name,
    haveSignatureIssues = false,
    type,
    testId = 'grid-item-name',
}: GridItemNameProps) {
    return (
        <div className="flex items-center mx-auto">
            <SignatureIcon
                haveSignatureIssues={haveSignatureIssues}
                isFile={type === NodeType.File || type === NodeType.Photo}
                className="mr-2 shrink-0"
            />
            <FileName text={name} testId={testId} />
        </div>
    );
}

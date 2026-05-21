import { c } from 'ttag';

import { getMimeTypeDescription } from '../../../sections/helpers';

interface Props {
    mimeType: string;
    isFile: boolean;
}

export const DescriptiveTypeCell = ({ mimeType, isFile }: Props) => {
    const type = isFile ? getMimeTypeDescription(mimeType) : c('Label').t`Folder`;

    return (
        <div key="Type" title={type} className="text-ellipsis">
            <span className="text-pre">{type}</span>
        </div>
    );
};

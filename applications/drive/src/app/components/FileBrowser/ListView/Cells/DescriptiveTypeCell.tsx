import { c } from 'ttag';
import { LinkType } from '../../../../interfaces/link';
import { getMimeTypeDescription } from '../../../sections/helpers';

interface Props {
    mimeType: string;
    linkType: LinkType;
}

const DescriptiveTypeCell = ({ mimeType, linkType }: Props) => {
    const type = linkType === LinkType.FILE ? getMimeTypeDescription(mimeType) : c('Label').t`Folder`;

    return (
        <div key="Type" title={type} className="text-ellipsis">
            <span className="text-pre">{type}</span>
        </div>
    );
};

export default DescriptiveTypeCell;

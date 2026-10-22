import { getFileIconName } from '@proton/file-icons/getFileIcon';
import clsx from '@proton/utils/clsx';

import type { MimeIconProps } from '../icon/MimeIcon';
import MimeIcon from '../icon/MimeIcon';

interface Props extends Omit<MimeIconProps, 'name'> {
    mimeType: string;
}

/**
 * Component to render SVG file icons.
 * It's wrapper around MimeIcon component which finds the proper icon
 * name based on the mime type.
 */
const FileIcon = ({ mimeType, className, ...rest }: Props) => {
    const name = getFileIconName(mimeType);

    return <MimeIcon name={name} className={clsx(['shrink-0', className])} {...rest} />;
};

export default FileIcon;

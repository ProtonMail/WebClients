import { CSSProperties, FC } from 'react';

import { Photo } from '../../../../store/_photos/interfaces';

type Props = {
    photo: Photo;
    style: CSSProperties;
};
export const PhotosCard: FC<Props> = ({ style }) => {
    return <div style={style}>abc</div>;
};

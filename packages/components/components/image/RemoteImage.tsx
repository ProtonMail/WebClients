import { useState } from 'react';
import * as React from 'react';
import { c } from 'ttag';
import { SHOW_IMAGES } from '@proton/shared/lib/constants';
import { isURL } from '@proton/shared/lib/helpers/validators';
import Button from '../button/Button';
import { useMailSettings } from '../../hooks';

export interface Props extends React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> {
    src: string;
    text?: string;
}
const RemoteImage = ({ src, text = c('Action').t`Load image`, ...rest }: Props) => {
    const [{ ShowImages } = { ShowImages: SHOW_IMAGES.NONE }, loading] = useMailSettings();
    const [showAnyways, setShowAnyways] = useState(!isURL(src));

    const handleClick = () => setShowAnyways(true);

    if ((!loading && ShowImages & SHOW_IMAGES.REMOTE) || showAnyways) {
        return <img src={src} referrerPolicy="no-referrer" {...rest} />;
    }
    return <Button onClick={handleClick}>{text}</Button>;
};

export default RemoteImage;

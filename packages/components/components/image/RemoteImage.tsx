import type { DetailedHTMLProps, ImgHTMLAttributes } from 'react';
import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Tooltip } from '@proton/components/components';
import Icon from '@proton/components/components/icon/Icon';

import LoadRemoteImageBanner from '../../containers/banner/LoadRemoteImageBanner';
import useLoadContactImage from '../../hooks/useLoadContactImage';
import { Loader } from '../loader';

export interface Props extends DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> {
    src: string;
    text?: string;
    /**
     * Force loading the image on component render
     */
    autoLoad?: boolean;
}
const RemoteImage = ({ src, text = c('Action').t`Load image`, autoLoad = false, ...rest }: Props) => {
    const { handleLoadImageDirect, image, setShowAnyway, display } = useLoadContactImage({
        photo: src,
    });

    const handleClick = () => setShowAnyway(true);

    /**
     * Should be only used in ContactFieldImage, to show it directly
     * In other cases, we want to rely on the auto show setting
     */
    useEffect(() => {
        if (autoLoad) {
            handleClick();
        }
    }, [autoLoad]);

    return (
        <>
            {display === 'loading' && <Loader />}
            {display === 'loadDirectFailed' && (
                <div className="border rounded bg-norm mb-0 flex justify-center items-center p-4">
                    <Tooltip title={c('Tooltip').t`The image could not be loaded`}>
                        <Icon name="cross-circle" size={6} className="color-danger" />
                    </Tooltip>
                </div>
            )}
            {display === 'needsLoadDirect' && (
                <LoadRemoteImageBanner
                    onClick={handleLoadImageDirect}
                    text={c('Action').t`Image could not be loaded with tracker protection.`}
                    tooltip={c('Action').t`Image will be loaded without a proxy`}
                    actionText={c('Action').t`Load`}
                />
            )}
            {display === 'loaded' && <img src={image?.src} alt="" referrerPolicy="no-referrer" {...rest} />}
            {display === 'askLoading' && <Button onClick={handleClick}>{text}</Button>}
        </>
    );
};

export default RemoteImage;

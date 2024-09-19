import type { RefObject } from 'react';
import { useImperativeHandle } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { Tooltip } from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import Loader from '@proton/components/components/loader/Loader';
import { getInitials } from '@proton/shared/lib/helpers/string';

import useLoadContactImage from '../../../hooks/useLoadContactImage';

interface Props {
    photo: string;
    name: string;
    loadImageDirectRef: RefObject<() => void>;
    onToggleLoadDirectBanner: (show: boolean) => void;
}

const ContactImageSummary = ({ photo, name, loadImageDirectRef, onToggleLoadDirectBanner }: Props) => {
    const { handleLoadImageDirect, image, setShowAnyway, display } = useLoadContactImage({
        photo,
        onToggleLoadDirectBanner,
        needsResize: true,
    });

    useImperativeHandle(loadImageDirectRef, () => {
        return handleLoadImageDirect;
    });

    if (!photo) {
        return (
            <div className="flex ratio-square rounded border bg-norm">
                <span className="m-auto color-weak h1">{getInitials(name)}</span>
            </div>
        );
    }

    const handleClick = () => setShowAnyway(true);

    return (
        <>
            {display === 'loading' && (
                <div className="flex ratio-square rounded border bg-norm">
                    <Loader />
                </div>
            )}
            {display === 'loadDirectFailed' && (
                <Tooltip title={c('Tooltip').t`The image could not be loaded`}>
                    <div className="flex ratio-square rounded border bg-norm">
                        <Icon
                            name="cross-circle"
                            size={6}
                            className="color-danger m-auto"
                            alt={c('Tooltip').t`The image could not be loaded`}
                        />
                    </div>
                </Tooltip>
            )}
            {display === 'needsLoadDirect' && (
                <Tooltip title={c('Tooltip').t`The image could not be loaded using proxy`}>
                    <div className="flex ratio-square rounded border bg-norm">
                        <Icon
                            name="file-shapes"
                            size={6}
                            className="m-auto"
                            alt={c('Tooltip').t`The image could not be loaded using proxy`}
                        />
                    </div>
                </Tooltip>
            )}
            {display === 'loaded' && (
                <div className="flex ratio-square rounded border bg-norm overflow-hidden">
                    <img
                        src={image.src}
                        alt={c('Contact image').t`Contact image`}
                        className="flex m-auto w-custom max-w-full ratio-square object-cover"
                        style={{
                            '--w-custom': `${
                                image.width || image.height
                                    ? Math.min(image.width || 0, image.height || 0) + 'px'
                                    : '100%'
                            }`,
                        }}
                    />
                </div>
            )}
            {display === 'askLoading' && (
                <Tooltip openDelay={0} title={c('Tooltip').t`Load image`}>
                    <ButtonLike className="flex ratio-square bg-norm" fullWidth onClick={handleClick}>
                        <Icon name="arrow-down-line" size={8} className="m-auto" alt={c('Tooltip').t`Load image`} />
                    </ButtonLike>
                </Tooltip>
            )}
        </>
    );
};

export default ContactImageSummary;

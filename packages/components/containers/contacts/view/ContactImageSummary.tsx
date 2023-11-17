import { RefObject, useImperativeHandle } from 'react';

import { c } from 'ttag';

import { Tooltip } from '@proton/components/components';
import { getInitials } from '@proton/shared/lib/helpers/string';

import { Icon, Loader } from '../../../components';
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
            <div className="border bg-norm rounded ratio-container-square mb-0">
                <span className="inner-ratio-container flex">
                    <span className="m-auto color-weak h1">{getInitials(name)}</span>
                </span>
            </div>
        );
    }

    const handleClick = () => setShowAnyway(true);

    const style = {
        backgroundImage: `url(${image.src})`,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
    };

    return (
        <>
            {display === 'loading' && (
                <div className="ratio-container-square rounded border">
                    <span className="inner-ratio-container flex">
                        <Loader />
                    </span>
                </div>
            )}
            {display === 'loadDirectFailed' && (
                <div className="border rounded bg-norm ratio-container-square mb-0">
                    <span className="inner-ratio-container flex">
                        <span className="m-auto lh-rg flex flex-column items-center">
                            <Tooltip title={c('Tooltip').t`The image could not be loaded`}>
                                <Icon name="cross-circle" size={24} className="color-danger" />
                            </Tooltip>
                        </span>
                    </span>
                </div>
            )}
            {display === 'needsLoadDirect' && (
                <div className="border rounded bg-norm ratio-container-square mb-0">
                    <span className="inner-ratio-container flex">
                        <span className="m-auto lh-rg flex flex-column items-center">
                            <Tooltip title={c('Tooltip').t`The image could not be loaded using proxy`}>
                                <Icon name="file-shapes" size={24} />
                            </Tooltip>
                        </span>
                    </span>
                </div>
            )}
            {/* For a small image, we have to create a smaller rounded container inside the bigger standard one,
       and fit the image as background inside it. As container width we must pick the smallest dimension*/}
            {display === 'smallImageLoaded' && (
                <div className="ratio-container-square mb-0">
                    <span className="inner-ratio-container flex rounded border overflow-hidden">
                        <div
                            className="m-auto flex w-custom"
                            style={{ '--w-custom': `${Math.min(image.width || 0, image.height || 0)}px` }}
                        >
                            <div className="ratio-container-square" style={style}>
                                <span className="inner-ratio-container" />
                            </div>
                        </div>
                    </span>
                </div>
            )}
            {/*fit the image in the rounded container as background image*/}
            {display === 'loaded' && (
                <div className="ratio-container-square rounded border" style={style}>
                    <span className="inner-ratio-container" />
                </div>
            )}
            {display === 'askLoading' && (
                <button
                    type="button"
                    className="border rounded bg-norm ratio-container-square mb-0"
                    onClick={handleClick}
                >
                    <span className="inner-ratio-container flex">
                        <span className="m-auto lh-rg flex flex-column items-center">
                            <Icon name="file-shapes" />
                            <div className="m-2 color-primary">{c('Action').t`Load image`}</div>
                        </span>
                    </span>
                </button>
            )}
        </>
    );
};

export default ContactImageSummary;

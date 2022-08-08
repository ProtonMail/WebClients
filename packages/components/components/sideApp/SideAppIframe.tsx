import { classnames } from '@proton/components/helpers';
import { useSideApp } from '../../hooks';

const SideAppIframe = () => {
    const { sideAppUrl, showSideApp } = useSideApp();

    if (!sideAppUrl) {
        return null;
    }

    return (
        <div className={classnames(['side-app shadow-norm bg-norm overflow-hidden', !showSideApp && 'hidden'])}>
            <iframe className="side-app-frame h100 w100" src={sideAppUrl} id="side-app" />
        </div>
    );
};

export default SideAppIframe;

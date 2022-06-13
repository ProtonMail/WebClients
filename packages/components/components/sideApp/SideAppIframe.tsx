import { useSideApp } from '../../hooks';

const SideAppIframe = () => {
    const { sideAppUrl } = useSideApp();

    if (!sideAppUrl) {
        return null;
    }

    return (
        <div className="side-app shadow-norm bg-norm overflow-hidden">
            <iframe className="side-app-frame h100 w100" src={sideAppUrl} id="side-app" />
        </div>
    );
};

export default SideAppIframe;

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';

const LoaderIcon = () => (
    <div className="p-4" aria-busy="true">
        <CircleLoader />
    </div>
);

export default LoaderIcon;

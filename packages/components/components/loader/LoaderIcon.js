import { CircleLoader } from '@proton/atoms';

const LoaderIcon = () => (
    <div className="p-4" aria-busy="true">
        <CircleLoader />
    </div>
);

export default LoaderIcon;

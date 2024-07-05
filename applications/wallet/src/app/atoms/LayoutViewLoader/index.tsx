import { CircleLoader } from '@proton/atoms/CircleLoader';

export const LayoutViewLoader = () => {
    return (
        <div className="m-auto">
            <CircleLoader size="large" className="color-primary" />
        </div>
    );
};

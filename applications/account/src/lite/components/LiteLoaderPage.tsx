import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';

const LiteLoaderPage = () => {
    return (
        <div className="flex justify-center items-center h-full">
            <CircleLoader className="color-primary" size="large" />
        </div>
    );
};

export default LiteLoaderPage;

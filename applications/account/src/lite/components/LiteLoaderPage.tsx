import { CircleLoader } from '@proton/atoms';

const LiteLoaderPage = () => {
    return (
        <div className="flex justify-center items-center h-full">
            <CircleLoader className="color-primary" size="large" />
        </div>
    );
};

export default LiteLoaderPage;

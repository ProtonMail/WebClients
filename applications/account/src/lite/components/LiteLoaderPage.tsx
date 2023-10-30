import { CircleLoader } from '@proton/atoms';

const LiteLoaderPage = () => {
    return (
        <div className="flex flex-justify-center flex-align-items-center h-full">
            <CircleLoader className="color-primary" size="large" />
        </div>
    );
};

export default LiteLoaderPage;

import { CircleLoader } from '@proton/atoms';

export const JoiningRoomLoader = () => {
    return (
        <div
            className="flex flex-column flex-nowrap items-center justify-center h-full w-custom"
            style={{ '--w-custom': '28.3rem' }}
        >
            <h1 className="h2 mb-4">Getting ready...</h1>
            <div className="color-weak mb-8 text-center">
                We are preparing the meeting room, for you. You will be able to join in just a moment
            </div>
            <CircleLoader
                className="color-primary w-custom h-custom"
                style={{ '--w-custom': '5rem', '--h-custom': '5rem' }}
            />
        </div>
    );
};

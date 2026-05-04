import { MainContainerBottomLinks } from './MainContainerBottomLinks';

const MainContainerFooter = () => {
    return (
        <>
            <div className="flex flex-row flex-nowrap justify-center p-2 items-center hidden md:flex">
                <MainContainerBottomLinks className="hidden md:flex" />
            </div>
        </>
    );
};

export default MainContainerFooter;

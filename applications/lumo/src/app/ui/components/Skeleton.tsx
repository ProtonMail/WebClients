import './Skeleton.scss';

const Skeleton = () => {
    return (
        <>
            <div className="skeleton flex-grow flex w-full h-custom " style={{ '--h-custom': '22px' }}></div>
            <div className="skeleton flex-grow flex w-5/6 h-custom " style={{ '--h-custom': '22px' }}></div>
        </>
    );
};

export default Skeleton;

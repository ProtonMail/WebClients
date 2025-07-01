import mdx from './Transforms.mdx';

export default {
    title: 'CSS Utilities/Transforms',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

const demoItemClasses = 'user-select flex items-center p-4 justify-center bg-primary rounded-sm text-center';

const demoContainerClasses = 'border rounded w-full relative flex p-4 items-center justify-space-around';

export const Mirror = () => {
    return (
        <div className={demoContainerClasses}>
            <div className={`${demoItemClasses} mirror`} style={{ width: '5rem', height: '5rem' }}>
                Mirror
            </div>
        </div>
    );
};

export const RotateX180 = () => {
    return (
        <div className={demoContainerClasses}>
            <div className={`${demoItemClasses} rotateX-180`} style={{ height: '5rem' }}>
                RotateX(180deg)
            </div>
        </div>
    );
};

export const RotateZ90 = () => {
    return (
        <div className={demoContainerClasses}>
            <div className={`${demoItemClasses} rotateZ-90`} style={{ height: '5rem' }}>
                RotateZ(90deg)
            </div>
        </div>
    );
};

export const RotateZ270 = () => {
    return (
        <div className={demoContainerClasses}>
            <div className={`${demoItemClasses} rotateZ-270`} style={{ height: '5rem' }}>
                RotateZ(270deg)
            </div>
        </div>
    );
};

import { getTitle } from '../../helpers/title';
import mdx from './Sizing.mdx';

export default {
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

const demoItemClasses =
    'user-select flex flex-align-items-center py0-5 flex-justify-center bg-primary rounded-sm text-center';
const demoContainerClasses = 'border p1 rounded w100 relative flex flex-column flex-gap-0-5 scroll-if-needed text-2xs';

export const WidthPercents = () => {
    const sizes = [0, 1, 2, 3, 5, 10, 15, 18, 20, 25, 30, 33, 35, 40, 45, 49, 50, 60, 66, 70, 75, 80, 90, 95, 100];

    return (
        <div className={demoContainerClasses}>
            {sizes.map((size) => (
                <div className={`${demoItemClasses} w${size}`}>
                    <span className={`${size === 0 ? 'color-norm relative' : ''}`}>w{size}</span>
                </div>
            ))}
        </div>
    );
};

export const WidthPixels = () => {
    const sizes = [10, 40, 50, 70, 80, 90, 150, 200, 250, 300, 500];

    return (
        <div className={demoContainerClasses}>
            {sizes.map((size) => (
                <div className={`${demoItemClasses} w${size}p`}>
                    <span className={`${size === 10 ? 'color-norm relative ml-8' : ''}`}>w{size}p</span>
                </div>
            ))}
        </div>
    );
};

export const WidthEm = () => {
    const sizes = [2, 3, 4, 5, 6, 8, 10, 11, 13, 14, 15, 16, 20, 24];

    return (
        <div className={demoContainerClasses}>
            {sizes.map((size) => (
                <div className={`${demoItemClasses} w${size}e`}>w{size}e</div>
            ))}
        </div>
    );
};

export const MaxWidthPercent = () => {
    const sizes = [50, 60, 80, 100];

    return (
        <div className={demoContainerClasses}>
            {sizes.map((size) => (
                <div className={`${demoItemClasses} max-w${size} w100`}>max-w{size}</div>
            ))}
        </div>
    );
};

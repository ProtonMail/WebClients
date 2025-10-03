import mdx from './Opacity.mdx';

export default {
    title: 'CSS Utilities/Opacity',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

const values = ['0', '30', '40', '50', '65', '70', '80', '100'];

const demoItemClasses = 'user-select flex items-center justify-center bg-primary rounded-sm text-center';

export const Opacity = () => {
    return (
        <div
            className="border rounded w-full relative flex flex-nowrap gap-2 overflow-auto items-center justify-space-around text-2xs"
            style={{ height: '9rem' }}
        >
            {values.map((value) => (
                <div
                    key={value}
                    className="bg-strong shrink-0 rounded"
                    style={{ display: 'flow-root', '--border-radius-md': '10%' }}
                >
                    <div className={`${demoItemClasses} opacity-${value}`} style={{ width: '4rem', height: '3rem' }}>
                        opacity-{value}
                    </div>
                </div>
            ))}
        </div>
    );
};

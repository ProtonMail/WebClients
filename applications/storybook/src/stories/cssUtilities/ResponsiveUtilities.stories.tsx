import mdx from './ResponsiveUtilities.mdx';

export default {
    title: 'Css utilities/Responsive',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

const demoItemClasses = 'flex items-center justify-center bg-primary user-select';

export const Responsive = () => {
    return (
        <div className="border rounded overflow-hidden w-full relative flex text-2xs">
            <div className="bg-primary rounded-sm">
                <div
                    className={`${demoItemClasses} pl-4 sm:pl-8 md:pl-10 lg:pl-12 xl:pl-14`}
                    style={{ backgroundColor: 'rgba(0,0,0,.2)' }}
                >
                    <div
                        className="flex items-center justify-center bg-primary"
                        style={{ height: '3rem', width: '3rem' }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

Responsive.parameters = {
    docs: {
        iframeHeight: '100px',
        inlineStories: false,
    },
    layout: 'fullscreen',
};

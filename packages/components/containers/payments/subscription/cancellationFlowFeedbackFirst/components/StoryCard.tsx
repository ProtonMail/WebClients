import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';

interface Props {
    image: string;
    title: string;
    subtitle: string;
    linkText: string;
    url: string;
}

const StoryCard = ({ image, title, subtitle, linkText, url }: Props) => {
    const { viewportWidth } = useActiveBreakpoint();
    const isSmall = viewportWidth['<=small'];

    return (
        <div className="flex flex-column sm:flex-row gap-4">
            <img
                src={image}
                alt=""
                className="rounded-lg shrink-0 object-cover w-full"
                style={isSmall ? undefined : { width: 160, height: 90 }}
            />
            <div className="flex flex-column justify-space-between w-full md:max-w-2/3 gap-1">
                <span className="text-bold">{title}</span>
                <span className="color-weak">{subtitle}</span>
                <a href={url} rel="noopener noreferrer">
                    {linkText}
                </a>
            </div>
        </div>
    );
};

export default StoryCard;

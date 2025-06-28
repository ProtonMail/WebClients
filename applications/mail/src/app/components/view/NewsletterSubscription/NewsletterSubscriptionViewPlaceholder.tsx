import { useTheme } from '@proton/components';
import { getInboxEmptyPlaceholder } from '@proton/mail/helpers/getPlaceholderSrc';

export const NewsletterSubscriptionViewPlaceholder = () => {
    const theme = useTheme();

    const placeholder = getInboxEmptyPlaceholder({
        size: 0,
        theme: theme.information.theme,
    });

    return (
        <div className="flex h-full w-full items-center justify-center">
            <div className="flex flex-column items-center max-w-1/2 md:max-w-3/5 text-center">
                <div className="mb-2">
                    <img src={placeholder} className="w-auto" height={128} alt="" />
                </div>
                <h3 className="text-bold text-ellipsis text-rg">Work in Progress</h3>
                <p className="color-weak my-2">
                    We’re still working on it and will let you know as soon as it’s ready.
                </p>
            </div>
        </div>
    );
};

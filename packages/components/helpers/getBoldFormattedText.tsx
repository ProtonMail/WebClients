// Replace "**" by strong tags
const getBoldFormattedText = (text: string) => {
    const splitText = text.split('**');
    // If the length is odd, it means that we can apply the change on the text
    if (splitText.length > 2 && splitText.length % 2 !== 0) {
        const formattedText = splitText.map((s, index) => {
            // All odd indexes corresponds to a part to surround with a tag
            if (index % 2 !== 0) {
                return <strong key={`formattedText-${s}`}>{s}</strong>;
            }
            return <span key={`formattedText-${s}`}>{s}</span>;
        });

        return <>{formattedText}</>;
    }
    return text;
};

export default getBoldFormattedText;

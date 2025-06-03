const MessageBodyPlaceholder = ({ margin }: { margin: 'small' | 'normal' }) => {
    return (
        <>
            <div
                className={`message-content-loading-placeholder ${margin === 'normal' ? 'mx-4 mb-4' : 'mb-1'} max-w-custom`}
                style={{ '--max-w-custom': '8em' }}
            />
            <div
                className="message-content-loading-placeholder mx-4 mb-4 max-w-custom"
                style={{ '--max-w-custom': '50em' }}
            />
            <div
                className="message-content-loading-placeholder mx-4 mb-4 max-w-custom"
                style={{ '--max-w-custom': '40em' }}
            />
            <div
                className="message-content-loading-placeholder mx-4 mb-4 max-w-custom"
                style={{ '--max-w-custom': '50em' }}
            />
            <div
                className="message-content-loading-placeholder mx-4 mb-4 max-w-custom"
                style={{ '--max-w-custom': '15em' }}
            />
            <div
                className="message-content-loading-placeholder mx-4 mb-4 max-w-custom"
                style={{ '--max-w-custom': '8em' }}
            />
        </>
    );
};

export default MessageBodyPlaceholder;

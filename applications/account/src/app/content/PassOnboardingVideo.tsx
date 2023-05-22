import { useRef, useState } from 'react';

const videoUrl =
    'https://www.youtube-nocookie.com/embed/M8doASpFbuk?autoplay=1&mute=1&cc_load_policy=1&showinfo=0&modestbranding=1';

const getYoutubeHTML = (src: string, title: string) => {
    return `<html>
<head>
    <style>html, body {
        border: 0;
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
    }</style>
</head>
<body>
<iframe
    frameborder='0'
    allowfullscreen='1'
    allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
    title='${title}' width='100%' height='100%'
    sandbox='allow-scripts allow-same-origin allow-presentation'
    src='${src}'></iframe>
</body>
</html>`;
};

const PassOnboardingVideo = () => {
    const title = 'Proton Pass: password manager created by the scientists behind Proton Mail';

    const ref = useRef<HTMLIFrameElement>(null);
    const [src] = useState(() => {
        return `data:text/html;charset=utf-8,${getYoutubeHTML(videoUrl, title)}`;
    });

    return (
        <iframe
            title={title}
            src={src}
            ref={ref}
            className="w-custom h-custom"
            sandbox="allow-scripts allow-same-origin"
            style={{
                '--w-custom': '536px',
                '--h-custom': '301px',
            }}
        />
    );
};

export default PassOnboardingVideo;

/* @ngInject */
function consoleMessage($log) {
    const styles = {
        span: 'color: #505061; font-size: 14px;',
        strong: 'color: #505061; font-size: 14px; font-weight: bold;',
        alert: 'color: #FF5956; font-size: 18px; font-weight: bold;',
        alertSpan: 'color: #FF5956; font-size: 14px;',
        link: 'color: #9397cd; font-size: 14px;'
    };

    return () => {
        // $log.info('%cSTOP⚠️', styles.alert);
        // $log.info('%cThis is a browser feature intended for developers...', styles.alertSpan);
        $log.info('%cFind a %csecurity bug?%c🐛 security@protonmail.com', styles.span, styles.strong, styles.link);
        $log.info("%cWe're %chiring!⛰ %chttps://protonmail.com/careers", styles.span, styles.strong, styles.link);
    };
}
export default consoleMessage;

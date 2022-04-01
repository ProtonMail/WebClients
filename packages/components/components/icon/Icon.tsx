import { forwardRef } from 'react';

import { classnames } from '../../helpers';

export type IconSize = 6 | 8 | 10 | 11 | 12 | 14 | 16 | 18 | 20 | 22 | 24 | 28 | 40 | 42 | 48 | 56 | 60 | 100 | 110;

export type IconName =
    | 'address-card'
    | 'align-center'
    | 'align-justify'
    | 'align-left'
    | 'align-right'
    | 'angle-down'
    | 'angles-left'
    | 'arrow-down'
    | 'arrow-down-arrow-up'
    | 'arrow-down-left-and-arrow-up-right-to-center'
    | 'arrow-down-short-wide'
    | 'arrow-down-to-rectangle'
    | 'arrow-down-to-screen'
    | 'arrow-down-wide-short'
    | 'arrow-left'
    | 'arrow-right'
    | 'arrow-right-arrow-left'
    | 'arrow-right-big'
    | 'arrow-right-from-rectangle'
    | 'arrow-rotate-right'
    | 'arrow-side-up'
    | 'arrow-up'
    | 'arrow-up-and-left-big'
    | 'arrow-up-and-left-double-big'
    | 'arrow-up-big-line'
    | 'arrow-up-from-rectangle'
    | 'arrow-up-from-screen'
    | 'arrow-up-right-and-arrow-down-left-from-center'
    | 'arrow-up-right-from-square'
    | 'arrows-left-right'
    | 'arrows-rotate'
    | 'arrows-up-down-left-right'
    | 'bag-percent'
    | 'bars'
    | 'bell'
    | 'bell-slash'
    | 'bold'
    | 'book'
    | 'book-user'
    | 'box-archive'
    | 'brand-amex'
    | 'brand-android'
    | 'brand-apple'
    | 'brand-bitcoin'
    | 'brand-chrome'
    | 'brand-gmail'
    | 'brand-linux'
    | 'brand-macos'
    | 'brand-mastercard'
    | 'brand-paypal'
    | 'brand-proton-account'
    | 'brand-proton-calendar'
    | 'brand-proton-contacts'
    | 'brand-proton-drive'
    | 'brand-proton-mail'
    | 'brand-proton-vpn'
    | 'brand-tor'
    | 'brand-twitter-filled'
    | 'brand-visa'
    | 'brand-windows'
    | 'brand-yahoo'
    | 'briefcase'
    | 'broom'
    | 'brush'
    | 'bug'
    | 'buildings'
    | 'calendar-day'
    | 'calendar-days'
    | 'check'
    | 'check-triple'
    | 'circle-check'
    | 'circle-check-filled'
    | 'circle-exclamation'
    | 'circle-exclamation-filled'
    | 'circle-filled'
    | 'circle-info'
    | 'circle-info-filled'
    | 'circle-question'
    | 'circle-user'
    | 'circle-xmark'
    | 'circle-xmark-filled'
    | 'clock'
    | 'clock-rotate-left'
    | 'clock-rotate-right'
    | 'code'
    | 'color'
    | 'copy'
    | 'credit-card'
    | 'dash'
    | 'earth'
    | 'ellipsis'
    | 'ellipsis-vertical'
    | 'envelope'
    | 'envelope-fast'
    | 'envelope-open-image'
    | 'envelopes'
    | 'eraser'
    | 'eye'
    | 'eye-slash'
    | 'fax'
    | 'file-arrow-up'
    | 'file-image'
    | 'file-lines'
    | 'file-pdf'
    | 'file-shapes'
    | 'filing-cabinet'
    | 'filter'
    | 'fire'
    | 'fire-slash'
    | 'folder'
    | 'folder-arrow-up'
    | 'folder-filled'
    | 'folder-plus'
    | 'folders'
    | 'folders-filled'
    | 'font'
    | 'gear'
    | 'gift-card'
    | 'globe'
    | 'grid'
    | 'grid-3'
    | 'hat-glasses'
    | 'hook'
    | 'hourglass-empty'
    | 'image'
    | 'inbox'
    | 'inbox-out'
    | 'italic'
    | 'key'
    | 'language'
    | 'layout-columns'
    | 'layout-rows'
    | 'life-ring'
    | 'link'
    | 'link-broken'
    | 'link-pen'
    | 'list'
    | 'list-bullets'
    | 'list-numbers'
    | 'lock'
    | 'lock-check-filled'
    | 'lock-filled'
    | 'lock-pen-filled'
    | 'lock-triangle-exclamation-filled'
    | 'magnifying-glass'
    | 'mailbox'
    | 'map-marker'
    | 'merge'
    | 'messages'
    | 'minimize'
    | 'mobile'
    | 'money-bills'
    | 'note'
    | 'note-pen'
    | 'notepad-list-fast'
    | 'paint-roller'
    | 'paper-plane'
    | 'paperclip'
    | 'pause'
    | 'pen'
    | 'people'
    | 'phone-rotary'
    | 'play'
    | 'plus'
    | 'pm-me'
    | 'presentation-screen'
    | 'printer'
    | 'question'
    | 'quote-right'
    | 'robot'
    | 'rocket'
    | 'servers'
    | 'shield'
    | 'sliders'
    | 'star'
    | 'star-filled'
    | 'star-remove'
    | 'switch'
    | 'tag'
    | 'tags'
    | 'trash'
    | 'triangle-exclamation'
    | 'triangle-exclamation-filled'
    | 'tv'
    | 'underline'
    | 'unlock-check-filled'
    | 'unlock-pen-filled'
    | 'unlock-triangle-exclamation-filled'
    | 'user'
    | 'user-filled'
    | 'user-group'
    | 'user-group-plus'
    | 'user-plus'
    | 'wallet'
    | 'window-image'
    | 'window-terminal'
    | 'wireguard'
    | 'xmark';

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'ref'> {
    /** Determines which icon to render based on its name */
    name: IconName;
    /** If specified, renders an sr-only element for screenreaders */
    alt?: string;
    /** If specified, renders an inline title element */
    title?: string;
    /** The size of the icon */
    size?: IconSize;
    /** How many degrees the icon should be rotated */
    rotate?: number;
    /** Applied as inline css 'color' attribute on the svg element */
    color?: string;
    /** Icon name prefix */
    nameSpaceSvg?: string;
}

const Icon = forwardRef<SVGSVGElement, IconProps>(
    ({ name, alt, title, color, className = '', viewBox = '0 0 16 16', size = 16, rotate = 0, ...rest }, ref) => {
        const style = {
            ...(color && { color }),
            ...(rotate && { transform: `rotate(${rotate}deg)` }),
        };

        return (
            <>
                <svg
                    style={style}
                    viewBox={viewBox}
                    className={classnames([`icon-${size}p`, className])}
                    role="img"
                    focusable="false"
                    ref={ref}
                    {...rest}
                >
                    {title ? <title>{title}</title> : null}
                    <use xlinkHref={`#ic-${name}`} />
                </svg>
                {alt ? <span className="sr-only">{alt}</span> : null}
            </>
        );
    }
);

export default Icon;

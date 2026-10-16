import {
    type LumoEmojiId,
    getLumoEmojiName,
    getLumoEmojiSrc,
    getLumoEmojiStillSrc,
} from '../../utils/lumoEmojis/lumoEmojis';

interface Props {
    id: LumoEmojiId;
}

export const LumoEmoji = ({ id }: Props) => {
    const name = getLumoEmojiName(id);

    return (
        <picture>
            <source srcSet={getLumoEmojiStillSrc(id)} media="(prefers-reduced-motion: reduce)" />
            <img
                src={getLumoEmojiSrc(id)}
                alt={name}
                title={name}
                className="icon-size-8"
                style={{ imageRendering: 'pixelated' }}
            />
        </picture>
    );
};

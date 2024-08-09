import { LevelFormat, type ILevelsOptions, AlignmentType, convertInchesToTwip } from 'docx'

export const NumberingFormat: Record<number, (typeof LevelFormat)[keyof typeof LevelFormat]> = {
  0: LevelFormat.DECIMAL,
  1: LevelFormat.UPPER_LETTER,
  2: LevelFormat.LOWER_LETTER,
  3: LevelFormat.UPPER_ROMAN,
  4: LevelFormat.LOWER_ROMAN,
}

export const NumberingLevelsConfig: ILevelsOptions[] = Array.from({ length: 5 }, (_, i) => ({
  level: i,
  format: NumberingFormat[i],
  text: `%${i + 1}.`,
  alignment: AlignmentType.START,
  style: {
    paragraph: {
      indent: { left: convertInchesToTwip(0.5 * i), hanging: convertInchesToTwip(0.18) },
    },
  },
}))

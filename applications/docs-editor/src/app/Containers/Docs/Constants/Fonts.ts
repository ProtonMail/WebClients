export const DEFAULT_FONT_FACE = 'Arial, sans-serif'
export const MONOSPACE_FONT_FACE = 'Menlo, Consolas, Courier New, Monospace'

const FONT_FACES = {
  SANS_SERIF: {
    id: 'Sans-serif',
    label: 'Sans Serif',
    value: 'sans-serif',
  },
  SERIF: {
    id: 'Serif',
    label: 'Serif',
    value: 'serif',
  },
  GEORGIA: {
    id: 'Georgia',
    label: 'Georgia',
    value: 'Georgia, serif',
  },
  ARIAL: {
    id: 'Arial',
    label: 'Arial',
    value: 'Arial, sans-serif',
  },
  HELVETICA: {
    id: 'Helvetica',
    label: 'Helvetica',
    value: 'Helvetica, sans-serif',
  },
  MONOSPACE: {
    id: 'Menlo, Consolas, Courier New, Monospace',
    label: 'Monospace',
    value: 'Menlo, Consolas, Courier New, Monospace',
  },
  TAHOMA: {
    id: 'Tahoma, sans-serif',
    label: 'Tahoma',
    value: 'Tahoma, sans-serif',
  },
  VERDANA: {
    id: 'Verdana',
    label: 'Verdana',
    value: 'Verdana, sans-serif',
  },
  TIMES_NEW_ROMAN: {
    id: 'Times New Roman',
    label: 'Times New Roman',
    value: 'Times New Roman, serif',
  },
  TREBUCHET_MS: {
    id: 'Trebuchet MS',
    label: 'Trebuchet MS',
    value: 'Trebuchet MS, sans-serif',
  },
}

export const FontOptions = Object.values(FONT_FACES)
export const DefaultFont = FONT_FACES.ARIAL

export const FontSizes = [8, 10, 11, 12, 14, 16, 18, 20, 22, 30, 36, 48, 60, 72, 96]

export const getFontFaceValueFromId = (fontFaceId: string | null | undefined): string | undefined =>
  Object.values(FONT_FACES).find((font) => font.id === fontFaceId)?.value

export const getFontFaceIdFromValue = (fontFaceValue: string): string | undefined =>
  Object.values(FONT_FACES).find((font) => font.value === fontFaceValue)?.id

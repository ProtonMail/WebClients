import { BorderStyle, Paragraph } from 'docx'

export const createHorizontalRuleChild = (): Paragraph => {
  const paragraph = new Paragraph({
    text: '',
    border: {
      top: {
        color: 'auto',
        size: 6,
        style: BorderStyle.SINGLE,
        space: 1,
      },
    },
  })
  return paragraph
}

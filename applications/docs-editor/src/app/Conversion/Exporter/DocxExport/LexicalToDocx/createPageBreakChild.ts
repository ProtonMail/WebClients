import { PageBreak, Paragraph } from 'docx'

export const createPageBreakChild = (): Paragraph => {
  return new Paragraph({
    children: [new PageBreak()],
  })
}

import { genShades } from './colorPalette'

describe('Docs font color shades', () => {
  it.each([
    ['#0C0C14', 'rgb(12, 12, 20)', 'rgb(0, 0, 0)', 'rgba(12, 12, 20, 0.15)'],
    ['#8F8D8A', 'rgb(143, 141, 138)', 'rgb(115, 115, 115)', 'rgba(143, 141, 138, 0.15)'],
    ['#8080FF', 'rgb(128, 128, 255)', 'rgb(86, 86, 246)', 'rgba(128, 128, 255, 0.15)'],
    ['#DB60D6', 'rgb(219, 96, 214)', 'rgb(197, 67, 192)', 'rgba(219, 96, 214, 0.15)'],
    ['#DC3251', 'rgb(220, 50, 81)', 'rgb(176, 43, 67)', 'rgba(220, 50, 81, 0.15)'],
    ['#F78400', 'rgb(247, 132, 0)', 'rgb(186, 104, 10)', 'rgba(247, 132, 0, 0.15)'],
    ['#5252CC', 'rgb(82, 82, 204)', 'rgb(65, 65, 170)', 'rgba(82, 82, 204, 0.15)'],
    ['#415DF0', 'rgb(65, 93, 240)', 'rgb(31, 62, 223)', 'rgba(65, 93, 240, 0.15)'],
    ['#179FD9', 'rgb(23, 159, 217)', 'rgb(28, 121, 161)', 'rgba(23, 159, 217, 0.15)'],
    ['#1DA583', 'rgb(29, 165, 131)', 'rgb(29, 114, 93)', 'rgba(29, 165, 131, 0.15)'],
    ['#B4A40E', 'rgb(180, 164, 14)', 'rgb(125, 115, 17)', 'rgba(180, 164, 14, 0.15)'],
  ])('keeps the Proton accent shades of %s', (color, base, intense, lowOpacity) => {
    expect(genShades(color)).toEqual({ base, intense, lowOpacity })
  })
})

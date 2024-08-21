import { createWordCountInfo } from './createWordCountInfo'

const countWords = (text: string) => createWordCountInfo(text).wordCount

test('Simple sentence', () => {
  const text = 'The quick brown fox jumps over the lazy dog.'
  const { wordCount, characterCount, nonWhitespaceCharacterCount } = createWordCountInfo(text)
  expect(wordCount).toBe(9)
  expect(characterCount).toBe(44)
  expect(nonWhitespaceCharacterCount).toBe(36)
})

test('Different separators', () => {
  const text =
    'Is this a question? Here I am *emphasising* this word. Here: are some comma,separated,words and comma, separated, words'
  const { wordCount, characterCount, nonWhitespaceCharacterCount } = createWordCountInfo(text)

  expect(wordCount).toBe(20)
  expect(characterCount).toBe(119)
  expect(nonWhitespaceCharacterCount).toBe(102)
})

test('Em dashes delimit words', () => {
  const text = 'Btw—hello—world—foo'

  const { wordCount, characterCount, nonWhitespaceCharacterCount } = createWordCountInfo(text)

  expect(wordCount).toBe(4)
  expect(characterCount).toBe(19)
  expect(nonWhitespaceCharacterCount).toBe(19)
})

test('Special characters and symbols', () => {
  const text = 'The cost is $5.99 @store #bigDeal'

  const { wordCount, characterCount, nonWhitespaceCharacterCount } = createWordCountInfo(text)

  /** Matches other online word counters and Docs products*/
  expect(wordCount).toBe(7)
  expect(characterCount).toBe(33)
  expect(nonWhitespaceCharacterCount).toBe(28)
})

test('Numbers in words', () => {
  const text = 'The chemical formula for water is H2O and the pandemic is COVID-19'
  const { wordCount } = createWordCountInfo(text)

  expect(wordCount).toBe(12)
})

test('Accented Characters and diacritics', () => {
  const text = 'Café culture is thriving in the city, with many façades reflecting a historical charm.'
  const { wordCount } = createWordCountInfo(text)

  expect(wordCount).toBe(14)
})

test('Long text and paragraphs', () => {
  // simulate a large gap in text
  const longText = 'This is a long paragraph. ' + ' '.repeat(1000) + 'Another sentence.'
  const { wordCount } = createWordCountInfo(longText)

  expect(wordCount).toBe(7)
})

test('Consecutive punctuation marks', () => {
  const text = 'Wait... what?!!! This is incredible...'
  const { wordCount } = createWordCountInfo(text)

  expect(wordCount).toBe(5)
})

test('URLs and email addresses', () => {
  const text = 'Please visit our site at https://example.com or contact us at info@example.com'
  const { wordCount } = createWordCountInfo(text)

  /** Matches other online word counters and Docs products*/
  expect(wordCount).toBe(15)
})

test('Abbreviations and acronyms', () => {
  const text = 'I live in the U.S.A. and work for NASA.'
  const { wordCount } = createWordCountInfo(text)

  /** Matches other online word counters and Docs products*/
  expect(wordCount).toBe(11)
})

test('Hyphens do not delimit words', () => {
  const text = 'Btw-hello-world-foo'

  const { wordCount, characterCount, nonWhitespaceCharacterCount } = createWordCountInfo(text)

  expect(wordCount).toBe(1)
  expect(characterCount).toBe(19)
  expect(nonWhitespaceCharacterCount).toBe(19)
})

test('Whitespace', () => {
  const text = 'The    quick     brown     fox\njumps\tover the lazy dog'
  const { wordCount, characterCount, nonWhitespaceCharacterCount } = createWordCountInfo(text)

  expect(wordCount).toBe(9)
  expect(characterCount).toBe(54)
  expect(nonWhitespaceCharacterCount).toBe(35)
})

test('Leading and trailing whitespace', () => {
  expect(createWordCountInfo('               The quick brown fox jumps over the lazy dog           ').wordCount).toBe(9)
})

test('The\u00a0quick\u00a0brown\u00a0fox\u00a0jumps\u00a0over\u00a0the\u00a0lazy\u00a0dog', () => {
  const text = 'The\u00a0quick\u00a0brown\u00a0fox\u00a0jumps\u00a0over\u00a0the\u00a0lazy\u00a0dog'

  const { wordCount, characterCount, nonWhitespaceCharacterCount } = createWordCountInfo(text)

  expect(wordCount).toBe(9)
  expect(characterCount).toBe(43)
  expect(nonWhitespaceCharacterCount).toBe(35)
})

test('contractions with apostrophe should not count as two separate words', () => {
  const text = "shouldn't couldn't wouldn't"

  const { wordCount, characterCount, nonWhitespaceCharacterCount } = createWordCountInfo(text)

  expect(wordCount).toBe(3)
  expect(characterCount).toBe(27)
  expect(nonWhitespaceCharacterCount).toBe(25)
})

test('Spanish', () => {
  expect(
    createWordCountInfo('¿Qué opinas de las nuevas reformas? Me gustan los cambios, pero a veces son complicados.')
      .wordCount,
  ).toBe(15)
})

test('Arabic sentence', () => {
  const sentence = 'أنا أحب تعلم اللغات! وأنت؟'
  expect(countWords(sentence)).toBe(5)
})

// Example test for Korean text
test('Korean sentence', () => {
  const sentence = '나는 언어를 배우는 것을 좋아해요! 당신은요?'
  expect(countWords(sentence)).toBe(6)
})

test('Hindi sentence', () => {
  const sentence = 'मुझे भाषाएँ सीखना पसंद है। आप कैसे हैं?'
  expect(countWords(sentence)).toBe(8)
})

test('Portuguese sentence', () => {
  const sentence = 'Eu gosto de aprender línguas. E você, gosta?'
  expect(countWords(sentence)).toBe(8)
})

test('Bengali sentence', () => {
  const sentence = 'আমি ভাষা শেখা পছন্দ করি। আপনি কেমন আছেন?'
  expect(countWords(sentence)).toBe(8)
})

test('Russian sentence', () => {
  const sentence = 'Мне нравится учить языки. А вам?'
  expect(countWords(sentence)).toBe(6)
})

test('French sentence', () => {
  const sentence = 'J’aime apprendre des langues ! Et toi ?'
  expect(countWords(sentence)).toBe(6)
})

test('German sentence', () => {
  const sentence = 'Ich mag Sprachen lernen. Und du?'
  expect(countWords(sentence)).toBe(6)
})

test('Vietnamese sentence', () => {
  const sentence = 'Tôi thích học các ngôn ngữ! Bạn thì sao?'
  expect(countWords(sentence)).toBe(9)
})

test('Urdu sentence', () => {
  const sentence = 'مجھے زبانیں سیکھنا پسند ہے۔ آپ کیسے ہیں؟'
  expect(countWords(sentence)).toBe(8)
})

test('Turkish sentence', () => {
  const sentence = 'Dilleri öğrenmeyi seviyorum! Sen ne düşünüyorsun?'
  expect(countWords(sentence)).toBe(6) // "Dilleri", "öğrenmeyi", "seviyorum", "Sen", "ne", "düşünüyorsun"
})

test('Italian sentence', () => {
  const sentence = 'Mi piace imparare le lingue. E tu?'
  expect(countWords(sentence)).toBe(7)
})

test('Persian (Farsi) sentence', () => {
  const sentence = 'من یادگیری زبان‌ها را دوست دارم! شما چطور؟'
  expect(countWords(sentence)).toBe(8)
})

test('Polish sentence', () => {
  const sentence = 'Lubię uczyć się języków. A ty?'
  expect(countWords(sentence)).toBe(6)
})

test('Tamil sentence', () => {
  const sentence = 'நான் மொழிகள் கற்க விரும்புகிறேன்! நீங்கள் எப்படி?'
  expect(countWords(sentence)).toBe(6)
})

// // Non-Whitespace-Separated Languages
test('Mandarin Chinese sentence', () => {
  const sentence = '我喜欢学习语言。你呢？'
  expect(countWords(sentence)).toBe(9)
  expect(countWords('天地玄黄，宇宙洪荒。日月盈昃，辰宿列张。寒来暑往，秋收冬藏。')).toBe(24)
})

test('Japanese', () => {
  const text = '速い茶色の狐が怠け者の犬の上を飛び越えます。'
  const text2 = 'しい改革についてどう思いますか？'
  const text3 = '変化は好きですが、時々複雑です。'
  const text4 = 'しい改革についてどう思いますか？'

  expect(countWords(text)).toBe(21)
  expect(countWords(text2)).toBe(15)
  expect(countWords(text3)).toBe(14)
  expect(countWords(text4)).toBe(15)
})

test('Thai sentence', () => {
  const sentence = 'ฉันชอบเรียนภาษาไทย! คุณล่ะ?'
  expect(countWords(sentence)).toBe(20)
})

test('Emojis including emoji sequences', () => {
  const text =
    'The quick brown fox jumps over the lazy dog 🦊. Look at this cool rocket and astronaut 1️⃣ 🚀👨‍🚀! 🌈✨🚀 😎'

  const { wordCount, characterCount, nonWhitespaceCharacterCount } = createWordCountInfo(text)
  expect(wordCount).toBe(21)
  expect(characterCount).toBe(97)
  expect(nonWhitespaceCharacterCount).toBe(77)
})

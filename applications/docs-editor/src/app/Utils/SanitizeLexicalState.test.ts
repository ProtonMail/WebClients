import { sanitizeInlineStyle, sanitizeLexicalState } from './SanitizeLexicalState'

describe('sanitizeInlineStyle', () => {
  it('should allow safe CSS properties', () => {
    const input = 'color: red; font-size: 14px; background-color: #fff;'
    const result = sanitizeInlineStyle(input)
    expect(result).toBe('color: red; font-size: 14px; background-color: #fff')
  })

  it('should strip out disallowed properties', () => {
    const input = 'color: red; position: absolute; font-family: Arial;'
    // 'position' is not in the allowed list
    const result = sanitizeInlineStyle(input)
    expect(result).toBe('color: red; font-family: Arial')
  })

  it('should remove malicious values containing url()', () => {
    const input = 'background: url(http://example.com); color: #000;'
    const result = sanitizeInlineStyle(input)
    // background not in allowed list and also has url => removed
    // color is allowed
    expect(result).toBe('color: #000')
  })

  it('should remove malicious values containing javascript:', () => {
    const input = "color: javascript:alert('xss'); background-color: red;"
    const result = sanitizeInlineStyle(input)
    // color property is allowed but value is suspicious
    // background-color is allowed and safe
    expect(result).toBe('background-color: red')
  })

  it('should remove @import directives', () => {
    const input = 'font-family: @import url(http://example.com/font.css); color: blue;'
    const result = sanitizeInlineStyle(input)
    // font-family with @import is malicious
    // color is allowed
    expect(result).toBe('color: blue')
  })

  it('should handle empty style strings gracefully', () => {
    const input = ''
    const result = sanitizeInlineStyle(input)
    expect(result).toBe('')
  })

  it('should handle only disallowed properties', () => {
    const input = 'position: absolute; left: 100px;'
    // none of these are in allowedProperties
    const result = sanitizeInlineStyle(input)
    expect(result).toBe('')
  })

  it('should handle uppercase properties', () => {
    const input = 'COLOR: red; FONT-SIZE: 16px'
    // Should convert property names to lowercase and allow
    const result = sanitizeInlineStyle(input)
    expect(result).toBe('color: red; font-size: 16px')
  })
})

describe('sanitizeLexicalState', () => {
  it('should sanitize style fields in a given JSON state', () => {
    const inputJSON = JSON.stringify({
      root: {
        children: [
          {
            type: 'paragraph',
            style: 'color: red; position: absolute;',
            children: [
              { type: 'text', text: 'Hello', style: "font-family: Arial; background: url('x');" },
              { type: 'text', text: 'World', style: "color: javascript:alert('x');" },
            ],
          },
        ],
      },
    })

    const sanitized = sanitizeLexicalState(inputJSON)
    const parsed = JSON.parse(sanitized)

    // paragraph node: position should be stripped
    expect(parsed.root.children[0].style).toBe('color: red')

    // first text node: font-family allowed, background with url should be stripped
    expect(parsed.root.children[0].children[0].style).toBe('font-family: Arial')

    // second text node: color allowed but value malicious => remove color
    expect(parsed.root.children[0].children[1].style).toBe('')
  })

  it('should handle nodes without style fields', () => {
    const inputJSON = JSON.stringify({
      root: {
        children: [{ type: 'paragraph', children: [{ type: 'text', text: 'No style here' }] }],
      },
    })

    const sanitized = sanitizeLexicalState(inputJSON)
    const parsed = JSON.parse(sanitized)
    expect(parsed.root.children[0].children[0].style).toBeUndefined()
  })

  it('should handle deep nested structures', () => {
    const inputJSON = JSON.stringify({
      root: {
        style: "color: red; @import: 'something';",
        children: [
          {
            style: "font-family: Tahoma; data:url('foo');",
            children: [
              {
                style: 'text-align: left; background-color: #000;',
                children: [
                  {
                    style: 'border: 1px solid #000; url(http://evil.com)',
                    text: 'Nested',
                  },
                ],
              },
            ],
          },
        ],
      },
    })

    const sanitized = sanitizeLexicalState(inputJSON)
    const parsed = JSON.parse(sanitized)

    // root node: @import is malicious, remove that property
    expect(parsed.root.style).toBe('color: red')

    // first child of root: data:url(...) suspicious pattern in value
    // font-family allowed, data-url suspicious => remove it
    expect(parsed.root.children[0].style).toBe('font-family: Tahoma')

    // nested child: text-align and background-color are allowed and safe
    expect(parsed.root.children[0].children[0].style).toBe('text-align: left; background-color: #000')

    // deepest nested node: border allowed, but also has url(...) in the same declaration line
    // Each declaration is processed individually:
    // 1) border: 1px solid #000 - allowed
    // 2) url(http://evil.com) - doesn't have a property name and is suspicious, so ignored
    expect(parsed.root.children[0].children[0].children[0].style).toBe('border: 1px solid #000')
  })

  it('should throw an error for invalid JSON', () => {
    expect(() => sanitizeLexicalState('{invalid json}')).toThrow('Invalid JSON string provided to sanitizeLexicalState')
  })

  it('should leave safe properties intact', () => {
    const inputJSON = JSON.stringify({
      root: {
        style: 'color: blue; font-size: 20px;',
        children: [],
      },
    })

    const sanitized = sanitizeLexicalState(inputJSON)
    const parsed = JSON.parse(sanitized)
    expect(parsed.root.style).toBe('color: blue; font-size: 20px')
  })

  it('should remove everything if all are disallowed or malicious', () => {
    const inputJSON = JSON.stringify({
      root: {
        style: "position: absolute; @import url('foo');",
        children: [
          { style: 'expression(foo); margin-left: 10px;', text: 'test' },
          { style: 'color: data:evil;', text: 'test2' },
        ],
      },
    })

    const sanitized = sanitizeLexicalState(inputJSON)
    const parsed = JSON.parse(sanitized)

    // root: position and @import both disallowed => empty style
    expect(parsed.root.style).toBe('')

    // first child: expression(...) is disallowed
    // margin-left isn't in the allowedProperties (only margin is listed)
    // both declarations are removed, resulting in an empty style
    expect(parsed.root.children[0].style).toBe('')

    // second child: color is allowed property but value is 'data:evil' which is suspicious
    // so it should be removed => empty style
    expect(parsed.root.children[1].style).toBe('')
  })

  it('should remove malicious CSS while preserving allowed properties', () => {
    const inputJSON = `{
      "root": {
        "children": [
          {
            "children": [
              {
                "detail":0,
                "format":0,
                "mode":"normal",
                "style":"",
                "text":"hello",
                "type":"text",
                "version":1
              },
              {
                "detail":0,
                "format":0,
                "mode":"normal",
                "style":"font-family: Tahoma, sans-serif;",
                "text":" ",
                "type":"text",
                "version":1
              },
              {
                "detail":0,
                "format":0,
                "mode":"normal",
                "style":"background-color: rgba(109, 74, 255, 0.15);font-family: Tahoma, sans-serif; expression(alert('xss'));",
                "text":"wor",
                "type":"text",
                "version":1
              },
              {
                "detail":0,
                "format":0,
                "mode":"normal",
                "style":"background-color: rgba(109, 74, 255, 0.15);data:evil();",
                "text":"ld how g",
                "type":"text",
                "version":1
              },
              {
                "detail":0,
                "format":5,
                "mode":"normal",
                "style":"background-color: rgba(109, 74, 255, 0.15);color: #5C5958; background-image: url('http://evil.com/xss.png');",
                "text":"oes it",
                "type":"text",
                "version":1
              }
            ],
            "direction":"ltr",
            "format":"",
            "indent":0,
            "type":"paragraph",
            "version":1,
            "textFormat":0,
            "textStyle":"font-family: Tahoma, sans-serif; @import url(http://malicious.com)"
          }
        ],
        "direction":"ltr",
        "format":"",
        "indent":0,
        "type":"root",
        "version":1
      }
    }`

    const sanitized = sanitizeLexicalState(inputJSON)
    const parsed = JSON.parse(sanitized)

    const paragraphNode = parsed.root.children[0]
    const textNodes = paragraphNode.children

    // Check paragraph's textStyle
    // "@import" should be removed, leaving only the safe font-family property
    expect(paragraphNode.textStyle).toBe('font-family: Tahoma, sans-serif')

    // Text Node 1: style is empty and should remain empty
    expect(textNodes[0].style).toBe('')

    // Text Node 2: style: "font-family: Tahoma, sans-serif;" is allowed and safe
    expect(textNodes[1].style).toBe('font-family: Tahoma, sans-serif')

    // Text Node 3: style includes allowed (background-color, font-family) and disallowed (expression)
    // Allowed: "background-color: rgba(109, 74, 255, 0.15)" and "font-family: Tahoma, sans-serif"
    // Disallowed: "expression(alert('xss'))"
    // After sanitization, expression(...) should be removed
    expect(textNodes[2].style).toBe('background-color: rgba(109, 74, 255, 0.15); font-family: Tahoma, sans-serif')

    // Text Node 4: style includes allowed "background-color: rgba(109, 74, 255, 0.15)" and disallowed "data:evil()"
    // data:evil should be stripped out, leaving only the allowed property
    expect(textNodes[3].style).toBe('background-color: rgba(109, 74, 255, 0.15)')

    // Text Node 5: style includes allowed "background-color: rgba(109, 74, 255, 0.15)" and "color: #5C5958"
    // and disallowed "background-image: url(...)"
    // The malicious url() property should be removed
    expect(textNodes[4].style).toBe('background-color: rgba(109, 74, 255, 0.15); color: #5C5958')

    // Check that no malicious patterns remain
    const serialized = JSON.stringify(parsed)
    expect(serialized).not.toMatch(/url\(/i)
    expect(serialized).not.toMatch(/expression\(/i)
    expect(serialized).not.toMatch(/javascript:/i)
    expect(serialized).not.toMatch(/@import/i)
    expect(serialized).not.toMatch(/data:/i)
  })
})

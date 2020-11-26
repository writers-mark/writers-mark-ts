import { compileEdgeMatter, compileParagraph, extractLinks, precompile } from '../text';
import * as style from '../style';
import { compileWhitelist } from '../whitelist';

const blankWhitelist = compileWhitelist({ para: [], span: [], cont: [] });
const blankStyle = style.compile('', blankWhitelist);
const blankStyleLUT = style.buildLUT([blankStyle]);

const simpleStyle = style.compile('para # {} para __ {} span * {} span - {}', blankWhitelist);
const simpleStyleLUT = style.buildLUT([simpleStyle]);

/* tslint:disable:no-string-literal */

describe('Blank precompilation', () => {
  describe('empty text', () => {
    const sut = precompile('');

    it('is empty', () => {
      expect(sut.edgeMatter).toBe('');
      expect(sut.paragraphs.length).toBe(0);
    });
  });

  describe('blank text', () => {
    const sut = precompile('    ');

    it('is empty', () => {
      expect(sut.edgeMatter).toBe('');
      expect(sut.paragraphs.length).toBe(0);
    });
  });

  describe('blank lines', () => {
    const sut = precompile('  \n \n   \n  ');

    it('is empty', () => {
      expect(sut.edgeMatter).toBe('');
      expect(sut.paragraphs.length).toBe(0);
    });
  });
});

describe('Simple paragraphs', () => {
  describe('by itself', () => {
    const sut = precompile('hello');
    it('is extracted', () => {
      expect(sut.paragraphs).toStrictEqual([['hello']]);
    });
  });

  describe('with blanks', () => {
    const sut = precompile('\nhello\n');
    it('is extracted', () => {
      expect(sut.paragraphs).toStrictEqual([['hello']]);
    });
  });

  describe('with whitespace', () => {
    const sut = precompile('    hello     ');
    it('is extracted', () => {
      expect(sut.paragraphs).toStrictEqual([['hello']]);
    });
  });
});

describe('Multiline paragraphs', () => {
  const sut = precompile('hello\nworld');
  it('are extracted', () => {
    expect(sut.paragraphs).toStrictEqual([['hello', 'world']]);
  });
});

describe('Multiple paragraphs', () => {
  const sut = precompile('hello\n\nworld');
  it('are extracted', () => {
    expect(sut.paragraphs).toStrictEqual([['hello'], ['world']]);
  });
});

describe('Multiple paragraphs with lots of whitespace', () => {
  const sut = precompile('hello\n\n\n\n\nworld');
  it('are extracted', () => {
    expect(sut.paragraphs).toStrictEqual([['hello'], ['world']]);
  });
});

describe('Edgematter extraction', () => {
  describe('Simple front matter', () => {
    const sut = precompile('---\nhello\n---');

    it('has been extracted', () => {
      expect(sut.edgeMatter).toBe('hello');
      expect(sut.paragraphs.length).toBe(0);
    });
  });

  describe('Front matter with content', () => {
    const sut = precompile('---\nhello\n---\nworld');

    it('has been extracted', () => {
      expect(sut.edgeMatter).toBe('hello');
      expect(sut.paragraphs).toStrictEqual([['world']]);
    });
  });

  describe('Unterminated front matter', () => {
    const sut = precompile('---\nhello\nworld');

    it('looks like text', () => {
      expect(sut.edgeMatter).toBe('');
      expect(sut.paragraphs).toStrictEqual([['---', 'hello', 'world']]);
    });
  });

  describe('Front matter after first line', () => {
    const sut = precompile('\n---\nhello\n---\nworld');

    it('Looks like text', () => {
      expect(sut.edgeMatter).toBe('');
      expect(sut.paragraphs).toStrictEqual([['---', 'hello', '---', 'world']]);
    });
  });

  describe('Back matter with content', () => {
    const sut = precompile('world\n---\nhello\n---');

    it('has been extracted', () => {
      expect(sut.edgeMatter).toBe('hello');
      expect(sut.paragraphs).toStrictEqual([['world']]);
    });
  });

  describe('Back matter not on last line', () => {
    const sut = precompile('world\n---\nhello\n---\n');

    it('Looks like text', () => {
      expect(sut.edgeMatter).toBe('');
      expect(sut.paragraphs).toStrictEqual([['world', '---', 'hello', '---']]);
    });
  });

  describe('Unterminated back matter', () => {
    const sut = precompile('\nhello\nworld\n---');

    it('looks like text', () => {
      expect(sut.edgeMatter).toBe('');
      expect(sut.paragraphs).toStrictEqual([['hello', 'world', '---']]);
    });
  });
});

describe('Edgematter compilation', () => {
  // Just making sure the style compiler is invoked should be enough.
  const sut = compileEdgeMatter('para aaa {}', blankWhitelist);
  expect(sut.style.para['aaa']).toBeDefined();
});

describe('compile paragraph', () => {
  describe('simple single line', () => {
    const sut = compileParagraph(['hello'], blankStyleLUT, { links: true });
    expect(sut.contents.length).toBe(1);
  });

  describe('simple multi line', () => {
    const sut = compileParagraph(['hello', 'world'], blankStyleLUT, { links: true });
    expect(sut.contents.length).toBe(1);
    expect(sut.contents).toStrictEqual(['hello world']);
  });
});

describe('Style paragraph', () => {
  describe('Applies single style', () => {
    const sut = compileParagraph(['#', 'world'], simpleStyleLUT, { links: true });
    expect(sut.contents.length).toBe(1);
    expect(sut.contents).toStrictEqual(['world']);
    expect(sut.styles).toStrictEqual(['#']);
  });

  describe('Applies multiple styles', () => {
    const sut = compileParagraph(['#', '__', 'world'], simpleStyleLUT, { links: true });
    expect(sut.contents.length).toBe(1);
    expect(sut.contents).toStrictEqual(['world']);
    expect(sut.styles).toStrictEqual(['#', '__']);
  });

  describe('Aborts reading styles', () => {
    const sut = compileParagraph(['a', '__', 'world'], simpleStyleLUT, { links: true });
    expect(sut.contents.length).toBe(1);
    expect(sut.contents).toStrictEqual(['a __ world']);
    expect(sut.styles).toStrictEqual([]);
  });
});

describe('Style span', () => {
  describe('Applies single style', () => {
    const sut = compileParagraph(['*world*'], simpleStyleLUT, { links: true });
    expect(sut.contents).toStrictEqual([{ contents: ['world'], styles: ['*'] }]);
  });

  describe('Match in the middle', () => {
    const sut = compileParagraph(['hi *there* world'], simpleStyleLUT, { links: true });
    expect(sut.contents).toStrictEqual(['hi ', { contents: ['there'], styles: ['*'] }, ' world']);
  });

  describe('Partial match', () => {
    const sut = compileParagraph(['wo*rld'], simpleStyleLUT, { links: true });
    expect(sut.contents).toStrictEqual(['wo*rld']);
  });

  describe('ambiguous rules', () => {
    const s = style.compile('span * {} span ** {} span __ {} span _ {}', blankWhitelist);
    const sLUT = style.buildLUT([s]);

    expect(compileParagraph(['**hi *there* world**'], sLUT, { links: true }).contents).toStrictEqual([
      { styles: ['**'], contents: ['hi ', { contents: ['there'], styles: ['*'] }, ' world'] },
    ]);

    expect(compileParagraph(['__hi _there_ world__'], sLUT, { links: true }).contents).toStrictEqual([
      { styles: ['__'], contents: ['hi ', { contents: ['there'], styles: ['_'] }, ' world'] },
    ]);

    expect(compileParagraph(['**hi _there_ world'], sLUT, { links: true }).contents).toStrictEqual([
      '**hi ',
      { contents: ['there'], styles: ['_'] },
      ' world',
    ]);
  });
});

describe('Extract links', () => {
  it('Works alone', () => {
    const sut = extractLinks('[http://example.com](yo)');
    expect(sut).toStrictEqual([{ url: 'http://example.com', contents: ['yo'] }]);
  });

  it('Works in context', () => {
    const sut = extractLinks('hello [http://example.com](yo) world');
    expect(sut).toStrictEqual(['hello ', { url: 'http://example.com', contents: ['yo'] }, ' world']);
  });

  it('Finds multiples', () => {
    const sut = extractLinks('hello [http://example.com](yo) world [http://perdu.com](sup)');
    expect(sut).toStrictEqual([
      'hello ',
      { url: 'http://example.com', contents: ['yo'] },
      ' world ',
      { url: 'http://perdu.com', contents: ['sup'] },
    ]);
  });

  it('Externally styled', () => {
    const sut = compileParagraph(['*[http://example.com](yo)*'], simpleStyleLUT, { links: true });

    expect(sut.contents).toStrictEqual([
      { styles: ['*'], contents: [{ url: 'http://example.com', contents: ['yo'] }] },
    ]);
  });

  it('Internally styled', () => {
    const sut = compileParagraph(['[http://example.com](*yo*)'], simpleStyleLUT, { links: true });

    expect(sut.contents).toStrictEqual([
      { url: 'http://example.com', contents: [{ styles: ['*'], contents: ['yo'] }] },
    ]);
  });
});

import { compile } from '../style';
import { compileWhitelist } from '../whitelist';

/* tslint:disable:no-string-literal */

const blankWhitelist = compileWhitelist({ para: [], span: [], cont: [] });
const simpleWhitelist = compileWhitelist({ para: ['abc', 'hello'], span: ['def'], cont: ['xyz'] });

describe('Parse nothing', () => {
  const compiled = compile('', blankWhitelist);
  it('compiled nothing', () => {
    expect(Object.keys(compiled.para).length).toBe(0);
    expect(Object.keys(compiled.span).length).toBe(0);
    expect(compiled.cont).toBeUndefined();
  });
});

describe('Parse whitespace', () => {
  const compiled = compile('     ', blankWhitelist);

  it('compiled nothing', () => {
    expect(Object.keys(compiled.para).length).toBe(0);
    expect(Object.keys(compiled.span).length).toBe(0);
    expect(compiled.cont).toBeUndefined();
  });
});

describe('Para Rules', () => {
  describe('Minimal', () => {
    const compiled = compile('para abc {}', blankWhitelist);

    it('compiled successfully', () => {
      expect(Object.keys(compiled.para).length).toBe(1);
      expect(compiled.para['abc']).toBeDefined();
    });

    it('Did not cross-talk', () => {
      expect(Object.keys(compiled.span).length).toBe(0);
      expect(compiled.cont).toBeUndefined();
    });
  });

  describe('No Name', () => {
    const data = 'para {}';

    const compiled = compile(data, simpleWhitelist);
    it('compiled nothing', () => {
      expect(Object.keys(compiled.para).length).toBe(0);
    });
  });

  describe('No Props', () => {
    const data = 'para abc';

    const compiled = compile(data, simpleWhitelist);
    it('compiled nothing', () => {
      expect(Object.keys(compiled.para).length).toBe(0);
    });
  });

  describe('Simple', () => {
    const data = 'para abc {abc: value;}';

    const compiled = compile(data, simpleWhitelist);
    it('compiled successfully', () => {
      expect(compiled.para['abc']).toBeDefined();
    });

    it('extracted the property', () => {
      expect(Object.keys(compiled.para).length).toBe(1);
      expect(compiled.para['abc'].props['abc']).toBe('value');
    });
  });
});

describe('Span Rules', () => {
  describe('Minimal', () => {
    const compiled = compile('span abc {}', blankWhitelist);

    it('compiled successfully', () => {
      expect(Object.keys(compiled.span).length).toBe(1);
      expect(compiled.span['abc']).toBeDefined();
    });

    it('Did not cross-talk', () => {
      expect(Object.keys(compiled.para).length).toBe(0);
      expect(compiled.cont).toBeUndefined();
    });
  });

  describe('With End', () => {
    const compiled = compile('span abc def {}', blankWhitelist);

    it('compiled successfully', () => {
      expect(Object.keys(compiled.span).length).toBe(1);
      expect(compiled.span['abc']).toBeDefined();
      expect(compiled.span['abc'].endPattern).toBe('def');
    });

    it('Did not cross-talk', () => {
      expect(Object.keys(compiled.para).length).toBe(0);
      expect(compiled.cont).toBeUndefined();
    });
  });

  describe('No Name', () => {
    const data = 'span {}';

    const compiled = compile(data, simpleWhitelist);
    it('compiled nothing', () => {
      expect(Object.keys(compiled.span).length).toBe(0);
    });
  });

  describe('No Props', () => {
    const data = 'span abc';

    const compiled = compile(data, simpleWhitelist);
    it('compiled nothing', () => {
      expect(Object.keys(compiled.span).length).toBe(0);
    });
  });

  describe('Simple', () => {
    const data = 'span abc {def: value;}';

    const compiled = compile(data, simpleWhitelist);
    it('compiled successfully', () => {
      expect(compiled.span['abc']).toBeDefined();
    });

    it('extracted the property', () => {
      expect(Object.keys(compiled.span).length).toBe(1);
      expect(compiled.span['abc'].props['def']).toBe('value');
    });
  });
});

describe('With space in value', () => {
  const compiled = compile('span abc {def: 32px 0px;}', simpleWhitelist);

  it('extracted the property', () => {
    expect(Object.keys(compiled.span).length).toBe(1);
    expect(compiled.span['abc'].props['def']).toBe('32px 0px');
  });
});

describe('Cont Rules', () => {
  describe('Minimal', () => {
    const compiled = compile('cont {}', blankWhitelist);

    it('compiled successfully', () => {
      expect(compiled.cont).toBeDefined();
    });

    it('Did not cross-talk', () => {
      expect(Object.keys(compiled.para).length).toBe(0);
      expect(Object.keys(compiled.span).length).toBe(0);
    });
  });

  describe('Named ', () => {
    const compiled = compile('cont abc {}', blankWhitelist);

    it('compiled unsuccessfully', () => {
      expect(compiled.cont).toBeUndefined();
    });
  });
});

describe('Comments', () => {
  describe('Basic', () => {
    const compiled = compile('para a {}\n// para b {}\n para c {}', blankWhitelist);
    it('compiled successfully', () => {
      expect(compiled.para['a']).toBeDefined();
      expect(compiled.para['c']).toBeDefined();
    });

    it('ignored the commented line', () => {
      expect(compiled.para['b']).toBeUndefined();
    });
  });
});

describe('Properties', () => {
  describe('basic', () => {
    const data = 'para abc {abc: value;}';

    const compiled = compile(data, simpleWhitelist);
    it('extracted the property', () => {
      expect(compiled.para['abc'].props['abc']).toBe('value');
    });
  });

  describe('multiple', () => {
    const data = 'para abc {abc: value; hello: world; }';

    const compiled = compile(data, simpleWhitelist);
    it('extracted the property', () => {
      expect(compiled.para['abc'].props['abc']).toBe('value');
      expect(compiled.para['abc'].props['hello']).toBe('world');
    });
  });

  describe('Unterminated Block', () => {
    const data = 'para abc {abc: value; hello: world;';

    const compiled = compile(data, simpleWhitelist);
    it('Did not compile', () => {
      expect(compiled.para['abc']).toBeUndefined();
    });
  });

  describe('Unterminated prop', () => {
    const data = 'para abc {abc: value; hello: world}';

    const compiled = compile(data, simpleWhitelist);
    it('partially extracted', () => {
      expect(compiled.para['abc'].props['abc']).toBe('value');
      expect(compiled.para['abc'].props['hello']).toBeUndefined();
    });
  });

  describe('Refuse url', () => {
    const data = 'para abc {abc: url();}';

    const compiled = compile(data, simpleWhitelist);
    it('extracted the property', () => {
      expect(compiled.para['abc'].props['abc']).toBeUndefined();
    });
  });

  describe('Refuse escape', () => {
    const data = 'para abc {abc: valu\\ne;}';

    const compiled = compile(data, simpleWhitelist);
    it('extracted the property', () => {
      expect(compiled.para['abc'].props['abc']).toBeUndefined();
    });
  });

  describe('Filtered out', () => {
    const data = 'para abc {abc: value; def: what; hello: world;}';

    const compiled = compile(data, simpleWhitelist);
    it('extracted the valid properties', () => {
      expect(compiled.para['abc'].props['abc']).toBe('value');
      expect(compiled.para['abc'].props['hello']).toBe('world');
    });
    it('Did not extract the filtered property', () => {
      expect(compiled.para['abc'].props['def']).toBeUndefined();
    });
  });
});

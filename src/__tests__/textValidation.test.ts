import { CompiledText, isValid } from '../text';
import { compileWhitelist } from '../whitelist';
/* tslint:disable:no-string-literal */

const blankWhitelist = compileWhitelist({ para: [], span: [], cont: [] });
const simpleWhitelist = compileWhitelist({ para: ['abc', 'hello'], span: ['def'], cont: ['xyz'] });

describe('Accepts valid text', () => {
  it('passes empty text', () => {
    expect(isValid({ paragraphs: [], styles: [] }, blankWhitelist)).toBe(true);
  });

  it('passes valid style', () => {
    expect(isValid({ paragraphs: [], styles: [{ para: {}, span: {} }] }, blankWhitelist)).toBe(true);
  });

  it('passes valid paragraphs', () => {
    expect(isValid({ paragraphs: [{ styles: [], contents: ['yo'] }], styles: [] }, blankWhitelist)).toBe(true);
  });

  it('passes valid paragraphs recur', () => {
    expect(
      isValid(
        { paragraphs: [{ styles: [], contents: [{ styles: [], contents: ['yo'] }] }], styles: [] },
        blankWhitelist,
      ),
    ).toBe(true);
  });
});

describe('Rejects invalid text', () => {
  it('Refuses malformed Object', () => {
    expect(isValid(JSON.parse('{"paragraphs": []}') as CompiledText, blankWhitelist)).toBe(false);
    expect(isValid(JSON.parse('{"styles": []}') as CompiledText, blankWhitelist)).toBe(false);
  });

  it('Refuses invalid style', () => {
    expect(isValid(JSON.parse('{"paragraphs": [], "styles":[{}]}') as CompiledText, blankWhitelist)).toBe(false);
  });

  it('Refuses invalid paragraphs', () => {
    expect(isValid(JSON.parse('{"paragraphs": [{}], "styles":[]}') as CompiledText, blankWhitelist)).toBe(false);
  });
});

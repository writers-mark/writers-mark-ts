import { compileWhitelist } from '../whitelist';
import { isValid, Style } from '../style';
/* tslint:disable:no-string-literal */

const blankWhitelist = compileWhitelist({ para: [], span: [], cont: [] });
const simpleWhitelist = compileWhitelist({ para: ['abc', 'hello'], span: ['def'], cont: ['xyz'] });

describe('Accepts valid style', () => {
  it('passes empty style', () => {
    expect(isValid({ para: {}, span: {} }, blankWhitelist)).toBe(true);
  });

  it('passes rule-less style', () => {
    expect(
      isValid({ para: { x: { props: {} } }, span: { y: { props: {} } }, cont: { props: {} } }, blankWhitelist),
    ).toBe(true);
  });

  it('passes good rules', () => {
    expect(
      isValid(
        { para: { x: { props: { abc: '12' } } }, span: { y: { props: { def: '12' } } }, cont: { props: { xyz: '4' } } },
        simpleWhitelist,
      ),
    ).toBe(true);
  });
});

describe('Rejects invalid style', () => {
  it('Refuses malformed Object', () => {
    expect(isValid({} as Style, blankWhitelist)).toBe(false);
    expect(isValid({ para: {} } as Style, blankWhitelist)).toBe(false);
    expect(isValid({ span: {} } as Style, blankWhitelist)).toBe(false);
  });

  it('Refuses non-whitelisted props', () => {
    expect(isValid({ para: { x: { props: { def: '12' } } }, span: {} }, simpleWhitelist)).toBe(false);
    expect(isValid({ para: {}, span: { y: { props: { abc: '12' } } } }, simpleWhitelist)).toBe(false);
    expect(isValid({ para: {}, span: {}, cont: { props: { aaa: '4' } } }, simpleWhitelist)).toBe(false);
  });

  it('Refuses evil value props', () => {
    expect(isValid({ para: { x: { props: { abc: '; color: red' } } }, span: {} }, simpleWhitelist)).toBe(false);
  });

  it('Refuses evil key value', () => {
    const diceyWhitelist = compileWhitelist({ para: ['a*'], span: [], cont: [] });
    expect(isValid({ para: { x: { props: { 'a:red;"background=...': 'red' } } }, span: {} }, diceyWhitelist)).toBe(
      false,
    );
  });
});

import { compileWhitelist } from '../whitelist';

/* tslint:disable:no-string-literal */

describe('Blank Whitelist', () => {
  const sut = compileWhitelist({ para: [], span: [], cont: [] });

  it('disallows the empty string', () => {
    expect(sut.para.allows('')).toBe(false);
    expect(sut.span.allows('')).toBe(false);
    expect(sut.cont.allows('')).toBe(false);
  });

  it('disallows non-empty string', () => {
    expect(sut.para.allows('abc')).toBe(false);
    expect(sut.span.allows('abc')).toBe(false);
    expect(sut.cont.allows('abc')).toBe(false);
  });
});

describe('Simple Whitelist', () => {
  const sut = compileWhitelist({ para: ['abc'], span: ['def'], cont: ['xyz'] });

  it('disallows the empty string', () => {
    expect(sut.para.allows('')).toBe(false);
    expect(sut.span.allows('')).toBe(false);
    expect(sut.cont.allows('')).toBe(false);
  });

  it('Allows pattern', () => {
    expect(sut.para.allows('abc')).toBe(true);
    expect(sut.span.allows('def')).toBe(true);
    expect(sut.cont.allows('xyz')).toBe(true);
  });

  it('Does not cross-talk', () => {
    expect(sut.para.allows('def')).toBe(false);
    expect(sut.span.allows('xyz')).toBe(false);
    expect(sut.cont.allows('abc')).toBe(false);
  });

  it('Does not pass prefix or postfix', () => {
    expect(sut.para.allows('ab')).toBe(false);
    expect(sut.para.allows('abcd')).toBe(false);
  });
});

describe('Multi Pattern Whitelist', () => {
  const sut = compileWhitelist({ para: ['abc', 'ab', 'de', 'def'], span: [], cont: [] });

  it('Works for all patterns', () => {
    expect(sut.para.allows('abc')).toBe(true);
    expect(sut.para.allows('ab')).toBe(true);
    expect(sut.para.allows('de')).toBe(true);
    expect(sut.para.allows('def')).toBe(true);
  });
});

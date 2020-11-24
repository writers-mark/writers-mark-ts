import { Trie } from '../trie';

describe('trie insertion and retrieval', () => {
  it('recovers inserted data', () => {
    const t = new Trie(['allo']);
    expect(t.has('')).toBe(false);
    expect(t.has('a')).toBe(false);
    expect(t.has('al')).toBe(false);
    expect(t.has('all')).toBe(false);
    expect(t.has('allo')).toBe(true);
    expect(t.has('alloa')).toBe(false);
  });

  it('tolerates overlaps inserted data', () => {
    const t = new Trie(['allo', 'al']);
    expect(t.has('')).toBe(false);
    expect(t.has('a')).toBe(false);
    expect(t.has('al')).toBe(true);
    expect(t.has('all')).toBe(false);
    expect(t.has('allo')).toBe(true);
    expect(t.has('alloa')).toBe(false);
  });
});

describe('Trie string walk', () => {
  const t = new Trie(['allo', 'al']);

  it('correctly finds nothing', () => {
    expect(t.firstFirstMatch('abcdef')).toStrictEqual([-1, []]);
  });

  it('Locates a single string', () => {
    expect(t.firstFirstMatch('123alabc')).toStrictEqual([3, ['al']]);
  });

  it('Locates a multiple matches string', () => {
    expect(t.firstFirstMatch('12allo34')).toStrictEqual([2, ['allo', 'al']]);
  });
});

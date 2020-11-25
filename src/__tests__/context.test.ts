import { Context, defaultOptions } from '../index';
import * as textModule from '../text';

/* tslint:disable:no-string-literal */

describe('Using a default context', () => {
  const ctx = new Context();
  const style = ctx.compileStyle('para aaa {color: red;}');
  it('compiles a style correctly', () => {
    expect(style.para.aaa.props.color).toBe('red');
  });

  describe('doing a single pass compile', () => {
    it('compiles a text correctly', () => {
      const text = ctx.compileText('aaa\nhello', [style]);
      expect(text.paragraphs[0].contents).toStrictEqual(['hello']);
      expect(text.paragraphs[0].styles).toStrictEqual(['aaa']);
    });

    it('consumes edge matter as expected', () => {
      const text = ctx.compileText('---\npara bbb {}\n---\naaa\nbbb\nhello', [style]);
      expect(text.paragraphs[0].contents).toStrictEqual(['hello']);
      expect(text.paragraphs[0].styles).toStrictEqual(['aaa', 'bbb']);
    });
  });

  describe('performs validation as expected', () => {
    const validText = { paragraphs: [{ styles: [], contents: [{ styles: [], contents: ['yo'] }] }], styles: [] };
    const invalidText = JSON.parse('{"paragraphs": [{}], "styles":[]}') as textModule.CompiledText;

    const validStyle = {
      para: { x: { props: { color: '12' } } },
      span: { y: { props: { color: '12' } } },
      cont: { props: { color: '4' } },
    };
    const invalidStyle = { para: { x: { props: { abc: '; color: red' } } }, span: {} };

    expect(ctx.isTextValid(validText)).toBe(true);
    expect(ctx.isTextValid(invalidText)).toBe(false);
    expect(ctx.isStyleValid(validStyle)).toBe(true);
    expect(ctx.isStyleValid(invalidStyle)).toBe(false);
  });
});

describe('Using explicitely default options', () => {
  const ctx = new Context({});
  it('does a single pass compile', () => {
    const style = ctx.compileStyle('para aaa {color: red;}');
    expect(style.para.aaa.props.color).toBe('red');
  });
});

describe('Using explicitely default whitelist', () => {
  const ctx = new Context({ whitelist: defaultOptions.whitelist });
  it('does a single pass compile', () => {
    const style = ctx.compileStyle('para aaa {color: red;}');
    expect(style.para.aaa.props.color).toBe('red');
  });
});

describe('Using custom whitelist', () => {
  const ctx = new Context({ whitelist: { para: ['gold'], span: [], cont: [] } });

  it('does a single pass compile', () => {
    const style = ctx.compileStyle('para aaa {gold: red; color: blue;}');
    expect(style.para.aaa.props.gold).toBe('red');
    expect(style.para.aaa.props.blue).toBeUndefined();
  });
});

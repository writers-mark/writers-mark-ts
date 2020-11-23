import { allowValue } from './validation';
import { CompiledWhitelist, WhitelistFilter } from './whitelist';

export interface StyleLUT {
  para: Set<string>;
  span: Record<string, string>;
}

export interface Style {
  para: Record<string, ParaStyleRule>;
  span: Record<string, SpanStyleRule>;
  cont?: ContStyleRule;
}

export type PropSet = Record<string, string>;

export interface StyleRule {
  props: PropSet;
}

export interface SpanStyleRule extends StyleRule {
  endPattern?: string;
}

export type ParaStyleRule = StyleRule;

export type ContStyleRule = StyleRule;

interface Parser {
  data: string;
  cursor: number;
}

const skipWs = (p: Parser) => {
  while (p.cursor < p.data.length && p.data[p.cursor].trim() === '') {
    ++p.cursor;
  }
};

const maybe = (p: Parser, pat: string): boolean => {
  skipWs(p);

  if (p.data.slice(p.cursor, p.cursor + pat.length) === pat) {
    p.cursor += pat.length;
    return true;
  }
  return false;
};

const token = (p: Parser, term: string): string => {
  skipWs(p);

  let tokEnd = p.cursor;
  while (tokEnd < p.data.length && p.data[tokEnd] !== term && p.data[tokEnd].trim() !== '') {
    ++tokEnd;
  }
  const result = p.data.slice(p.cursor, tokEnd);
  p.cursor = tokEnd;
  return result;
};

const readValue = (p: Parser): string => {
  skipWs(p);

  let tokEnd = p.cursor;
  while (tokEnd < p.data.length && p.data[tokEnd] !== ';' && p.data.slice(tokEnd).trim() !== '') {
    ++tokEnd;
  }
  const result = p.data.slice(p.cursor, tokEnd);
  p.cursor = tokEnd;
  return result;
};

export const compile = (data: string, whitelist: CompiledWhitelist): Style => {
  const para: Record<string, ParaStyleRule> = {};
  const span: Record<string, SpanStyleRule> = {};
  let cont: ContStyleRule | undefined;

  const p: Parser = { data, cursor: 0 };

  const readProps = (filter: WhitelistFilter): PropSet | undefined => {
    if (maybe(p, '{')) {
      const end = data.indexOf('}', p.cursor);
      if (end === -1) {
        p.cursor = data.length;
        return undefined;
      }
      const payload = data.slice(p.cursor, end);
      p.cursor = end + 1;

      const result: PropSet = {};
      const subP: Parser = { data: payload, cursor: 0 };

      while (subP.cursor < payload.length) {
        const key = token(subP, ':');
        if (key !== '' && maybe(subP, ':')) {
          const value = readValue(subP);
          if (value !== '' && maybe(subP, ';')) {
            if (filter.allows(key) && allowValue(key, value)) {
              result[key] = value;
            }
          }
        }
      }
      return result;
    }
    return undefined;
  };

  while (p.cursor < data.length) {
    if (maybe(p, 'para')) {
      const name = token(p, '{');
      if (name !== '') {
        const props = readProps(whitelist.para);
        if (props) {
          para[name] = { props };
        }
      }
    } else if (maybe(p, 'span')) {
      const name = token(p, '{');
      if (name !== '') {
        const end = token(p, '{');
        const props = readProps(whitelist.span);
        if (props) {
          const rule: SpanStyleRule = { props };
          if (end !== '') {
            rule.endPattern = end;
          }
          span[name] = rule;
        }
      }
    } else if (maybe(p, 'cont')) {
      const props = readProps(whitelist.cont);
      if (props) {
        cont = { props };
      }
    } else if (maybe(p, '//')) {
      while (p.cursor < data.length && data[p.cursor] !== '\n') {
        p.cursor += 1;
      }
    } else {
      p.cursor += 1;
    }
  }
  return { para, span, cont };
};

export const buildLUT = (styles: Style[]): StyleLUT => {
  const para = new Set<string>();
  const span: Record<string, string> = {};

  for (const s of styles) {
    Object.keys(s.para).forEach((k) => para.add(k));
    Object.keys(s.span).forEach((k) => (span[k] = s.span[k].endPattern || k));
  }
  return { para, span };
};

export const isValid = (style: Style, whitelist: CompiledWhitelist): boolean => {
  if (!style.para || !style.span) {
    return false;
  }

  for (const ruleKey of Object.keys(style.para)) {
    const rule = style.para[ruleKey];
    for (const propKey of Object.keys(rule.props)) {
      const propVal = rule.props[propKey];
      if (!whitelist.para.allows(propKey) || !allowValue(propKey, propVal)) {
        return false;
      }
    }
  }

  for (const ruleKey of Object.keys(style.span)) {
    const rule = style.span[ruleKey];
    for (const propKey of Object.keys(rule.props)) {
      const propVal = rule.props[propKey];
      if (!whitelist.span.allows(propKey) || !allowValue(propKey, propVal)) {
        return false;
      }
    }
  }

  if (style.cont) {
    for (const propKey of Object.keys(style.cont.props)) {
      const propVal = style.cont.props[propKey];
      if (!whitelist.cont.allows(propKey) || !allowValue(propKey, propVal)) {
        return false;
      }
    }
  }

  return true;
};

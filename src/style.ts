import { Options, defaultOptions, makeInternalOptions, InternalOptions } from './options';
import { Whitelist } from './whitelist';

/**
 * Individual style rule that can be applied to a <p> or a <span>
 */
export interface StyleRule {
  props: Record<string, string>;
}

interface SpanStyleRule extends StyleRule {
  endPattern?: string;
}

/**
 * Top level Style interface.
 */
export interface Style {
  /** Rules that can apply to paragraphs */
  paragraph: Record<string, StyleRule>;

  /** Rules that can apply to spans */
  span: Record<string, SpanStyleRule>;
}

const clonePRule = (src: StyleRule): StyleRule => {
  return { props: { ...src.props } };
};

const cloneSRule = (src: SpanStyleRule): SpanStyleRule => {
  return {
    props: { ...src.props },
    endPattern: src.endPattern,
  };
};

export const appendToStyleRule = (dst: StyleRule, src: StyleRule): void => {
  for (const srcKey of Object.keys(src.props)) {
    dst.props[srcKey] = src.props[srcKey];
  }
};

// Regular expression patterns
const nameKey = 'key';
const closeKey = 'close';
const payloadKey = 'value';
const paragraphRuleReStr = `p\\s+(?<${nameKey}>[^\\{\\}\\s]+)\\s*\\{(?<${payloadKey}>[^\\{\\}]*)\\}`;
const spanRuleReStr = `s\\s+(?<${nameKey}>[^\\{\\}\\s]+)(\\s+(?<${closeKey}>[^\\{\\}\\s]+))?\\s*\\{(?<${payloadKey}>[^\\{\\}]*)\\}`;
const propReStr = `(?<${nameKey}>[a-z\\-]+)\\:\\s*(?<${payloadKey}>[^\\;]+)\\;`;

/**
 * Returns wether a given property value is acceptable for the given property.
 * @param property The name of the property
 * @param value The value we want to assign to the property.
 * @param options Writers-Mark options
 */
const allowValue = (property: string, value: string, options: InternalOptions): boolean => {
  // Anything that contains an escape sequence
  if (value.indexOf('\\') !== -1) {
    return false;
  }

  // If a semicolon makes its way through somehow. It really shouldn't,
  // but we want to be extra sure of this.
  if (value.indexOf(';') !== -1) {
    return false;
  }

  // Any and all reference to urls are disallowed.
  if (value.indexOf('url(') !== -1) {
    return false;
  }

  return true;
};

const parseRuleProps = (data: string, whitelist: Whitelist, options: InternalOptions): Record<string, string> => {
  const result: Record<string, string> = {};
  const re = new RegExp(propReStr, 'g');

  let match: RegExpExecArray | null = re.exec(data);
  while (match) {
    const key = match.groups![nameKey];
    const value = match.groups![payloadKey];
    if (whitelist.allows(key) && allowValue(key, value, options)) {
      result[key] = value;
    }
    match = re.exec(data);
  }

  return result;
};

/** Checks that a style is valid usable with the provided options
 * @param ast The ast to validate.
 * @param style The style to apply.
 */
export const isValid = (style: Style, options?: Options): boolean => {
  const opts = makeInternalOptions(options || defaultOptions);

  if (!style.paragraph[opts.defaultPRule]) {
    return false;
  }

  for (const ruleKey of Object.keys(style.paragraph)) {
    const rule = style.paragraph[ruleKey];
    for (const propKey of Object.keys(rule.props)) {
      const propVal = rule.props[propKey];
      if (!opts.pProps.allows(propKey) || !allowValue(propKey, propVal, opts)) {
        return false;
      }
    }
  }

  for (const ruleKey of Object.keys(style.span)) {
    const rule = style.span[ruleKey];
    for (const propKey of Object.keys(rule.props)) {
      const propVal = rule.props[propKey];
      if (!opts.spanProps.allows(propKey) || !allowValue(propKey, propVal, opts)) {
        return false;
      }
    }
  }
  return true;
};

/**
 * Parses raw text into a Writers-Mark style
 * @param data The raw string to interpret.
 * @param options Writers-Mark options.
 */
export const compile = (data: string, options?: Options): Style => {
  const opts = makeInternalOptions(options || defaultOptions);

  const paragraph: Record<string, StyleRule> = {};
  const span: Record<string, SpanStyleRule> = {};

  // Make sure the default rule is present
  paragraph[opts.defaultPRule] = { props: {} };

  const pRe = new RegExp(paragraphRuleReStr, 'g');
  let pMatch: RegExpExecArray | null = pRe.exec(data);
  while (pMatch) {
    paragraph[pMatch.groups![nameKey]] = {
      props: parseRuleProps(pMatch.groups![payloadKey], opts.pProps, opts),
    };

    pMatch = pRe.exec(data);
  }

  const sRe = new RegExp(spanRuleReStr, 'g');
  let sMatch: RegExpExecArray | null = sRe.exec(data);
  while (sMatch) {
    const epStr = sMatch.groups![closeKey];

    const rule: SpanStyleRule = { props: parseRuleProps(sMatch.groups![payloadKey], opts.spanProps, opts) };
    if (epStr) {
      rule.endPattern = epStr;
    }
    span[sMatch.groups![nameKey]] = rule;

    sMatch = sRe.exec(data);
  }

  return { paragraph, span };
};

export const combineStyles = (styles: Style[]): Style => {
  const result: Style = {
    /** Rules that can apply to paragraphs */
    paragraph: {},

    /** Rules that can apply to spans */
    span: {},
  };

  for (const src of styles) {
    for (const pSrc of Object.keys(src.paragraph)) {
      const existing = result.paragraph[pSrc];
      if (existing) {
        appendToStyleRule(existing, src.paragraph[pSrc]);
      } else {
        result.paragraph[pSrc] = clonePRule(src.paragraph[pSrc]);
      }
    }

    for (const pSrc of Object.keys(src.span)) {
      const existing = result.span[pSrc];
      if (existing) {
        appendToStyleRule(existing, src.span[pSrc]);
      } else {
        result.span[pSrc] = cloneSRule(src.span[pSrc]);
      }
    }
  }

  return result;
};

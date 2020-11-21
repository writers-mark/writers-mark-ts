import { Style } from './style';

export type Block = (string | SpanSection)[];

export interface SpanSection {
  contents: Block;
  style: string;
}

export interface Paragraph {
  contents: Block;
  styles?: string[];
}

export interface AST {
  paragraphs: Paragraph[];
}

const applySpanStyles = (data: string, style: Style): Block => {
  let rule: string = '';
  let start = data.length;
  let payloadStart = data.length;
  let end = data.length;
  let postEnd = data.length;
  for (const k of Object.keys(style.span)) {
    const startMatch = data.indexOf(k);
    if (startMatch === -1 || startMatch > start || (startMatch === start && k.length < rule.length)) {
      continue;
    }

    const payloadStartMatch = startMatch + k.length;
    const endPattern = style.span[k].endPattern || k;
    const endMatch = data.indexOf(endPattern, payloadStartMatch);
    if (endMatch === -1) {
      continue;
    }

    rule = k;
    start = startMatch;
    payloadStart = payloadStartMatch;
    end = endMatch;
    postEnd = end + endPattern.length;
  }

  if (rule !== '') {
    const prefix = data.substr(0, start);
    const current = {
      contents: applySpanStyles(data.substr(payloadStart, end - payloadStart), style),
      style: rule,
    };
    const postfixStr = data.substr(postEnd);

    const postfixArray = postfixStr.length > 0 ? applySpanStyles(data.substr(postEnd), style) : [];
    const prefixArray = prefix.length > 0 ? [prefix] : [];

    return [...prefixArray, current, ...postfixArray];
  } else {
    return [data];
  }
};

/** Checks that an ast is validly usable with the provided style
 * @param ast The ast to validate.
 * @param style The style to apply.
 */
export const isValid = (ast: AST, style: Style): boolean => {
  const blockIsValid = (block: Block): boolean => {
    for (const s of block) {
      const asSection = s as SpanSection;

      if (asSection.contents && asSection.style) {
        if (!style.span[asSection.style] || !blockIsValid(asSection.contents)) {
          return false;
        }
      }
    }
    return true;
  };

  for (const p of ast.paragraphs) {
    if (p.styles !== undefined) {
      for (const s of p.styles) {
        if (!style.paragraph[s]) {
          return false;
        }
      }
    }

    if (!blockIsValid(p.contents)) {
      return false;
    }
  }
  return true;
};

/** Splits raw text into a sequence of paragraphs.
 * @param data The raw string to interpret.
 */
export function* splitParagraphs(data: string) {
  const lines = data.split('\n');
  let current: string[] = [];

  for (let line of lines) {
    line = line.trim();
    if (line === '') {
      if (current.length > 0) {
        yield current;
        current = [];
      }
    } else {
      current.push(line);
    }
  }

  if (current.length > 0) {
    yield current;
    current = [];
  }
}

/** Converts a raw paragraph into the final AST form.
 * @param data The paragraph data as returned from splitParagraphs()
 */
export const compileParagraph = (data: string[], style: Style): Paragraph => {
  let starting = true;

  const styles: string[] = [];
  let text: string = '';

  for (const line of data) {
    if (starting && style.paragraph[line]) {
      styles.push(line);
    } else {
      if (text !== '') {
        text += ' ';
      }
      text += line;
      starting = false;
    }
  }

  const result: Paragraph = {
    contents: applySpanStyles(text, style),
  };
  if (styles.length > 0) {
    result.styles = styles;
  }
  return result;
};

/** Compiles a raw string into an AST according to a given style
 * @param data The raw string to interpret.
 * @param style The style to apply.
 */
export const compile = (data: string, style: Style): AST => {
  const paragraphs: Paragraph[] = [];
  for (const rawP of splitParagraphs(data)) {
    paragraphs.push(compileParagraph(rawP, style));
  }

  return {
    paragraphs,
  };
};

import { Options } from '.';
import { Style, compile as compileStyle, combineStyles } from './style';

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
  style: Style;
}

export interface SplitContent {
  paragraphs: string[][];
  edgeMatter: string[];
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
export const isValid = (ast: AST): boolean => {
  const style = ast.style;

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

const eleminateTrailingBlanks = (lines: string[]): void => {
  while (lines.length > 0 && lines[0] === '') {
    lines.shift();
  }

  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
};

/** Extracts and returns any edge matter present are removes it from the passed array  */
export const extractEdgeMatter = (lines: string[]): string[] => {
  if (lines.length < 2) {
    return [];
  }

  let result: string[] = [];

  // If there is front-matter
  if (lines[0] === '---') {
    const frontMatterEnd = lines.indexOf('---', 1);
    if (frontMatterEnd !== -1) {
      result = lines.slice(1, frontMatterEnd);
      lines.splice(0, frontMatterEnd + 1);
    }
  }

  // If there is back-matter
  if (lines.length > 1 && lines[lines.length - 1] === '---') {
    const endMatterStart = lines.lastIndexOf('---', lines.length - 2);
    if (endMatterStart !== -1) {
      result = result.concat(lines.slice(endMatterStart + 1, lines.length - 1));
      lines.splice(endMatterStart);
    }
  }

  return result;
};

/** Splits raw text into a sequence of paragraphs.
 * @param data The raw string to interpret.
 */
export const splitParagraphs = (data: string): SplitContent => {
  const lines = data.split('\n').map((s) => s.trim());

  eleminateTrailingBlanks(lines);
  const edgeMatter = extractEdgeMatter(lines);

  const paragraphs: string[][] = [];

  let current: string[] = [];
  for (const line of lines) {
    if (line === '') {
      if (current.length > 0) {
        paragraphs.push(current);
        current = [];
      }
    } else {
      current.push(line);
    }
  }

  if (current.length > 0) {
    paragraphs.push(current);
    current = [];
  }

  return { paragraphs, edgeMatter };
};

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
export const compile = (data: string, style: Style, options?: Options): AST => {
  const paragraphs: Paragraph[] = [];
  const splitData = splitParagraphs(data);

  if (splitData.edgeMatter.length > 0) {
    const inlineStyle = compileStyle(splitData.edgeMatter.join('\n'), options);
    style = combineStyles([style, inlineStyle]);
  }

  for (const rawP of splitData.paragraphs) {
    paragraphs.push(compileParagraph(rawP, style));
  }

  return {
    paragraphs,
    style,
  };
};

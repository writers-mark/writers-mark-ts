import * as Style from './style';
import { CompiledWhitelist } from './whitelist';

const EDGEMATTER_DELIMITER = '---';

export type Paragraph = string[];

export interface PrecompiledText {
  paragraphs: Paragraph[];
  edgeMatter: string;
}

export interface CompiledEdgeMatter {
  style: Style.Style;
}

export type Content = string | Span;
export interface Span {
  contents: Content[];
  styles: string[];
}

export interface CompiledParagraph {
  contents: Content[];
  styles: string[];
}

export interface CompiledText {
  paragraphs: CompiledParagraph[];
  styles: Style.Style[];
}

const trimBlanks = (lines: string[]): void => {
  while (lines.length > 0 && lines[0] === '') {
    lines.shift();
  }

  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
};

const extractEdgeMatter = (lines: string[]): string => {
  if (lines.length < 2) {
    return '';
  }

  let result: string[] = [];

  // If there is front-matter
  if (lines[0] === EDGEMATTER_DELIMITER) {
    const frontMatterEnd = lines.indexOf(EDGEMATTER_DELIMITER, 1);
    if (frontMatterEnd !== -1) {
      result = lines.slice(1, frontMatterEnd);
      lines.splice(0, frontMatterEnd + 1);
    }
  }

  // If there is back-matter
  if (lines.length > 1 && lines[lines.length - 1] === EDGEMATTER_DELIMITER) {
    const endMatterStart = lines.lastIndexOf(EDGEMATTER_DELIMITER, lines.length - 2);
    if (endMatterStart !== -1) {
      result = result.concat(lines.slice(endMatterStart + 1, lines.length - 1));
      lines.splice(endMatterStart);
    }
  }

  return result.join('\n');
};

export const precompile = (data: string): PrecompiledText => {
  const lines = data.split('\n').map((s) => s.trim());

  const edgeMatter = extractEdgeMatter(lines);
  trimBlanks(lines);

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

export const compileEdgeMatter = (data: string, whitelist: CompiledWhitelist): CompiledEdgeMatter => {
  return { style: Style.compile(data, whitelist) };
};

const applySpanRules = (data: string, styleLut: Style.StyleLUT): Content[] => {
  let rule = '';
  let start = data.length;
  let payloadStart = data.length;
  let end = data.length;
  let postEnd = data.length;

  for (const bPat of Object.keys(styleLut.span)) {
    const ePat = styleLut.span[bPat];
    const startMatch = data.indexOf(bPat);
    if (startMatch === -1 || startMatch > start || (startMatch === start && bPat.length < rule.length)) {
      continue;
    }

    const payloadStartMatch = startMatch + bPat.length;
    const endMatch = data.indexOf(ePat, payloadStartMatch);
    if (endMatch === -1) {
      continue;
    }

    rule = bPat;
    start = startMatch;
    payloadStart = payloadStartMatch;
    end = endMatch;
    postEnd = end + ePat.length;
  }

  if (rule !== '') {
    const prefix = data.substr(0, start);
    const current = {
      contents: applySpanRules(data.substr(payloadStart, end - payloadStart), styleLut),
      styles: [rule],
    };
    const postfixStr = data.substr(postEnd);

    const postfixArray = postfixStr.length > 0 ? applySpanRules(data.substr(postEnd), styleLut) : [];
    const prefixArray = prefix.length > 0 ? [prefix] : [];

    return [...prefixArray, current, ...postfixArray];
  } else {
    return [data];
  }
};

export const compileParagraph = (p: Paragraph, styleLut: Style.StyleLUT): CompiledParagraph => {
  const styles: string[] = [];

  // Step 1: Identify styles to apply and combine all lines into a single block of text
  let starting = true;
  let text: string = '';
  for (const line of p) {
    if (starting && styleLut.para.has(line)) {
      styles.push(line);
    } else {
      if (text !== '') {
        text += ' ';
      }
      text += line;
      starting = false;
    }
  }

  // Step 2: apply span rules.
  const contents = applySpanRules(text, styleLut);
  return { contents, styles };
};

export const isValid = (text: CompiledText, whitelist: CompiledWhitelist): boolean => {
  // Check for invalid object.
  if (!text.styles || !text.paragraphs) {
    return false;
  }

  // All embedded style should be valid.
  for (const s of text.styles) {
    if (!Style.isValid(s, whitelist)) {
      return false;
    }
  }

  for (const p of text.paragraphs) {
    if (!p || !p.contents || !p.styles) {
      return false;
    }
    // No need to validate the contents. It's very forgiving, since at worst, it just gets stringized.
  }
  return true;
};

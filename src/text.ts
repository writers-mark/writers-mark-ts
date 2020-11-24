import * as Style from './style';
import { Trie } from './trie';
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

export type Content = string | Span | Link;
export interface Span {
  contents: Content[];
  styles: string[];
}

export interface Link {
  url: string;
  contents: Content[];
}

export const isSpan = (x: string | Span | Link): x is Span => {
  const asSpan = x as Span;
  return asSpan.contents !== undefined && asSpan.styles !== undefined;
};

export const isLink = (x: string | Span | Link): x is Span => {
  const asLink = x as Link;
  return asLink.url !== undefined && asLink.contents !== undefined;
};

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

const applySpanRules = (raw: string, styleLut: Style.StyleLUT): Content[] => {
  interface Entry {
    tgt: Content[];
    data: string;
  }
  const queue: Entry[] = [];
  const apply = (tgt: Content[], data: string) => {
    queue.push({ tgt, data });
  };

  const result: Content[] = [];
  apply(result, raw);

  while (queue.length !== 0) {
    const { data, tgt } = queue.shift()!;
    let startAt = 0;

    let matchMade = false;
    while (!matchMade && startAt < data.length) {
      const [pos, matches] = styleLut.spanTrie.firstFirstMatch(data, startAt);
      if (pos === -1) {
        break;
      } else {
        for (const pBeg of matches) {
          const pEnd = styleLut.span[pBeg];

          const pEndLoc = data.indexOf(pEnd, pos + 1);
          // If the end token is found and is not immediately after the start.
          if (pEndLoc !== -1 && pEndLoc !== pos + pBeg.length) {
            matchMade = true;
            // Anything up to the rule start gets used as-is.
            if (pos !== 0) tgt.push(data.slice(0, pos));

            // The new span gets added to the target, and its contents needs to be handled.
            const newSpan: Span = { contents: [], styles: [pBeg] };
            tgt.push(newSpan);
            apply(newSpan.contents, data.slice(pos + pBeg.length, pEndLoc));

            // Anything past the span needs to be handled.
            const postFixPos = pEndLoc + pEnd.length;
            if (postFixPos < data.length) {
              apply(tgt, data.slice(postFixPos));
            }
          }
        }

        // Next loop will start one character after the start of the previous match.
        startAt = pos + 1;
      }
    }
    if (!matchMade) {
      tgt.push(data);
    }
  }
  return result;
};

export const extractLinks = (data: string): (string | Link)[] => {
  return [];
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

  // Step 2: extract Links
  //  const links = extractLinks(text);

  // The tricky thing is supporting aaa**pre [aaa](http://google.com) post**bbb
  // where ["aaa**pre" , {...}, "post**bbb"]
  // needs to transform into
  // ["aaa", {contents:["pre", {...}, "post"]}, "bbb"]

  // Step 3: apply span rules.
  // const contents = applySpanRulesRoot(links, styleLut);
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

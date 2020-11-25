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

export const isString = (x: string | Span | Link): x is string => {
  return !isSpan(x) && !isLink(x);
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

const applySpanRules = (input: Content[], styleLut: Style.StyleLUT): Content[] => {
  interface Entry {
    tgt: Content[];
    data: Content[];
  }
  const queue: Entry[] = [];
  const apply = (tgt: Content[], data: Content[]) => {
    queue.push({ tgt, data });
  };

  const result: Content[] = [];
  apply(result, input);

  while (queue.length > 0) {
    const { data, tgt } = queue.shift()!;

    let matchMade = false;
    ///////////////////////////////////
    for (let startIndex = 0; startIndex < data.length && !matchMade; ++startIndex) {
      const startData = data[startIndex];

      if (isString(startData)) {
        let startAt = 0;
        while (startAt < startData.length && !matchMade) {
          const [startPos, matches] = styleLut.spanTrie.firstFirstMatch(startData, startAt);

          if (startPos !== -1) {
            for (let pBegIndex = 0; pBegIndex !== matches.length && !matchMade; pBegIndex++) {
              const pBeg = matches[pBegIndex];
              const pEnd = styleLut.span[pBeg];

              let searchStart = startPos + 1;
              for (let endIndex = startIndex; endIndex < data.length && !matchMade; ++endIndex) {
                const endData = data[endIndex];
                if (isString(endData)) {
                  const pEndLoc = endData.indexOf(pEnd, searchStart);
                  if (pEndLoc !== -1 && (endIndex !== startIndex || pEndLoc !== startPos + pBeg.length)) {
                    matchMade = true;

                    // All of the data of the matched section up to the starting mark
                    // gets outputed as is.
                    if (startPos !== 0) {
                      tgt.push(startData.slice(0, startPos));
                    }

                    // Output the span and queue its content for processing
                    const spanContents: Content[] = [];
                    let cursor = startPos + pBeg.length;
                    let walkIndex = startIndex;

                    while (walkIndex !== endIndex) {
                      const walkData = data[walkIndex];
                      if (isString(walkData)) {
                        if (cursor !== walkData.length) {
                          spanContents.push(walkData.slice(cursor));
                        }
                      } else {
                        const content = walkData.contents;
                        walkData.contents = [];
                        apply(walkData.contents, content);

                        spanContents.push(walkData);
                      }

                      cursor = 0;
                      walkIndex++;
                    }

                    if (pEndLoc !== 0) {
                      spanContents.push(endData.slice(cursor, pEndLoc));
                    }

                    const newSpan: Span = { contents: [], styles: [pBeg] };
                    tgt.push(newSpan);
                    apply(newSpan.contents, spanContents);
                    // Queue the remaining data for processing

                    const remainder: Content[] = [];
                    if (pEndLoc + pEnd.length !== endData.length) {
                      remainder.push(endData.slice(pEndLoc + pEnd.length));
                    }

                    for (let endWalkIndex = endIndex + 1; endWalkIndex !== data.length; endWalkIndex++) {
                      remainder.push(data[endWalkIndex]);
                    }

                    apply(tgt, remainder);
                  }
                }

                searchStart = 0;
              }
            }
            startAt = startPos + 1;
          } else {
            break;
          }
        }
      }

      // If we failed to open a span in that section, file it as is
      // and move on to the next.
      if (!matchMade) {
        if (isLink(startData)) {
          const content = startData.contents;
          startData.contents = [];
          apply(startData.contents, content);
        }
        tgt.push(startData);
      }
    }
  }

  return result;
};

export const extractLinks = (data: string): (string | Link)[] => {
  const result: (string | Link)[] = [];

  let cursor = 0;
  let offset = 0;
  while (cursor < data.length) {
    const openLoc = data.indexOf('[', cursor + offset);
    offset = 0;

    // No open at all, just bail out.
    if (openLoc === -1) {
      if (cursor !== data.length) {
        result.push(data.slice(cursor));
      }
      break;
    } else {
      let matchMade = false;
      const closeLoc = data.indexOf(']', openLoc);
      if (closeLoc !== -1) {
        const parensOpenLoc = closeLoc + 1;
        if (parensOpenLoc < data.length && data[parensOpenLoc] === '(') {
          const parensCloseLoc = data.indexOf(')', parensOpenLoc + 1);
          if (parensCloseLoc !== -1) {
            matchMade = true;
            if (openLoc !== cursor) {
              result.push(data.slice(cursor, openLoc));
            }
            result.push({
              url: data.slice(openLoc + 1, closeLoc),
              contents: [data.slice(parensOpenLoc + 1, parensCloseLoc)],
            });
            cursor = parensCloseLoc + 1;
          }
        }
      }

      if (!matchMade) {
        offset += 1;
      }
    }
  }
  return result;
};

interface ParagraphOptions {
  links: boolean;
}

export const compileParagraph = (
  p: Paragraph,
  styleLut: Style.StyleLUT,
  options: ParagraphOptions,
): CompiledParagraph => {
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

  let contents: Content[] = [];
  if (options.links) {
    contents = extractLinks(text);
  }

  contents = applySpanRules(contents, styleLut);

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

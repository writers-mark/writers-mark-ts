import { defaultOptions } from '.';
import * as Style from './style';
import { Trie } from './trie';
import { CompiledWhitelist } from './whitelist';

const EDGEMATTER_DELIMITER = '---';

export type PrecompiledParagraph = string[];

export interface PrecompiledText {
  paragraphs: PrecompiledParagraph[];
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

export const isLink = (x: string | Span | Link): x is Link => {
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

export const precompile = (data: string): PrecompiledText => {
  let payloadStart = 0;
  let payloadEnd = data.length;

  // extract edgematter
  let edgeMatter = '';
  if (data.startsWith('---\n')) {
    const fmEnd = data.indexOf('\n---\n');
    if (fmEnd !== -1) {
      payloadStart = fmEnd + 5;
      edgeMatter = data.slice(4, fmEnd);
    }
  }

  if (data.endsWith('\n---')) {
    const bmEnd = data.lastIndexOf('\n---\n');
    if (bmEnd !== -1) {
      payloadEnd = bmEnd;
      edgeMatter += data.slice(bmEnd + 5, -4);
    }
  }

  // Break up paragraphs.
  const lines = data
    .slice(payloadStart, payloadEnd)
    .split('\n')
    .map((s) => s.trim());

  const paragraphs: PrecompiledParagraph[] = [];
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
  // For the time being, edgematter can only contain a style.
  return { style: Style.compile(data, whitelist) };
};

/** Appends a slice to a content list if that slice would not be empty. */
const maybeAppendSlice = (tgt: Content[], data: string, from: number, to: number) => {
  if (from !== to) {
    tgt.push(data.slice(from, to));
  }
};

const applySpanRules = (input: (string | Link)[], styleLut: Style.StyleLUT): Content[] => {
  const result: Content[] = [];

  interface Entry {
    tgt: Content[];
    data: (string | Link)[];
  }

  // N.B. Work units are processed out of order so that we can used the faster push/pop.
  const work: Entry[] = [{ tgt: result, data: input }];
  while (work.length > 0) {
    const { tgt, data } = work.pop()!;

    // Look for a opening mark.
    for (let startBlock = 0; startBlock < data.length; ++startBlock) {
      let startData = data[startBlock];

      if (isLink(startData)) {
        // Replace the link's content with its processed equivalent
        const content = startData.contents;
        startData.contents = [];
        work.push({ tgt: startData.contents, data: content as (string | Link)[] });

        tgt.push(startData);
        continue;
      }

      let startBlockTailLoc = 0; // All data after this location has not been handled yet.

      for (let beginSearchLoc = 0; beginSearchLoc < (startData as string).length; beginSearchLoc++) {
        // There are three possible scenarios here:
        // 1. No starting mark is found: We break out of the loop.
        // 2. An opening and closing mark pair is found: startBlock and beginSearchLoc will be updated to after the closing mark.
        // 3. An orphaned opening mark is found: the loop will repeat with beginSearchLoc incremented by 1.

        const [startPos, matches] = styleLut.spanTrie.firstFirstMatch(startData as string, beginSearchLoc);
        if (startPos === -1) break;

        // For each span rule that begins here, from longest to shortest.
        pattern_loop: for (let pBegIndex = 0; pBegIndex !== matches.length; pBegIndex++) {
          const pBeg = matches[pBegIndex]; // opening token
          const pEnd = styleLut.span[pBeg]; // expected closing token

          for (
            let endSearchLoc = startPos + 1, endBlock = startBlock;
            endBlock < data.length;
            ++endBlock, endSearchLoc = 0
          ) {
            const endBlockData = data[endBlock];
            if (isString(endBlockData)) {
              const pEndLoc = endBlockData.indexOf(pEnd, endSearchLoc);

              // If this is an opening immediately followed by a closing, disregard it.
              if (endBlock === startBlock && pEndLoc === startPos + pBeg.length) {
                break;
              }

              if (pEndLoc !== -1) {
                // We officially have a marked span at this point.

                // All unhandled data up to the starting mark gets outputed as is.
                maybeAppendSlice(tgt, startData as string, startBlockTailLoc, startPos);

                // Identify all of the span's content.
                const spanContents: (string | Link)[] = [];

                let spanDataStartLoc = startPos + pBeg.length;
                if (startBlock !== endBlock) {
                  // Anything from the start mark to the end of the starting block
                  maybeAppendSlice(spanContents, startData as string, spanDataStartLoc, (startData as string).length);
                  spanDataStartLoc = 0;

                  // All intermediate blocks
                  for (let walkBlock = startBlock + 1; walkBlock < endBlock; walkBlock++) {
                    spanContents.push(data[walkBlock]);
                  }
                }

                // Data up to the closing mark. Either from the starting mark, or the start of the block.
                maybeAppendSlice(spanContents, endBlockData, spanDataStartLoc, pEndLoc);

                // Contents will be populated when the work unit will be processed.
                const newSpan: Span = { contents: [], styles: [pBeg] };
                tgt.push(newSpan);

                // The contents of the span itself needs to be processed recursively.
                work.push({ tgt: newSpan.contents, data: spanContents });

                // Resume the search for spans after the closing mark.
                startBlockTailLoc = pEndLoc + pEnd.length;
                beginSearchLoc = startBlockTailLoc - 1; // -1 because it will be incremented by the for loop.
                startBlock = endBlock;
                startData = data[startBlock];

                break pattern_loop;
              } // if (pEndLoc !== -1 && (endIndex !== startIndex || pEndLoc !== startPos + pBeg.length))
            } // if (isString(endData)) {
          } // for (let endIndex = startIndex; endIndex < data.length ; ++endIndex)
        } // pattern_loop: for (let pBegIndex = 0; pBegIndex !== matches.length; pBegIndex++)
      } // for (let beginSearchLoc = 0; beginSearchLoc < startDataAsString.length; beginSearchLoc++)

      // Anything left after we reach the end of the block gets appended as is.
      maybeAppendSlice(tgt, startData as string, startBlockTailLoc, (startData as string).length);
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

    if (openLoc === -1) {
      if (cursor !== data.length) result.push(data.slice(cursor));
      break;
    } else {
      const closeLoc = data.indexOf(']', openLoc);
      if (closeLoc === -1) {
        if (cursor !== data.length) result.push(data.slice(cursor));
        break;
      } else {
        // If we don't make a match, we can restart the search from this location.
        offset += closeLoc - cursor;

        const parensOpenLoc = closeLoc + 1;
        if (parensOpenLoc < data.length && data[parensOpenLoc] === '(') {
          const parensCloseLoc = data.indexOf(')', parensOpenLoc + 1);
          if (parensCloseLoc !== -1) {
            if (openLoc !== cursor) {
              result.push(data.slice(cursor, openLoc));
            }
            result.push({
              url: data.slice(openLoc + 1, closeLoc),
              contents: [data.slice(parensOpenLoc + 1, parensCloseLoc)],
            });
            cursor = parensCloseLoc + 1;
            offset = 0;
          }
        }
      }
    }
  }
  return result;
};

interface ParagraphOptions {
  links: boolean;
}

export const compileParagraph = (
  p: PrecompiledParagraph,
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
    contents = applySpanRules(extractLinks(text), styleLut);
  } else {
    contents = applySpanRules([text], styleLut);
  }

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

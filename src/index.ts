import * as Style from './style';
import * as Text from './text';
import { CompiledWhitelist, compileWhitelist } from './whitelist';

const defaultCommonProps: string[] = ['color', 'background-color', 'font*', 'text-decoration'];

/** CSS property whitelist. */
interface Whitelist {
  /** Properties allowed in para <name> {} rules */
  para: string[];

  /** Properties allowed in span <name> [close] {} rules */
  span: string[];

  /** Properties allowed in cont {} rules */
  cont: string[];
}

/** The default set of allowed CSS properties */
const defaultWhitelist: Whitelist = {
  para: [...defaultCommonProps, 'margin*', 'border', 'text-align'],
  span: [...defaultCommonProps],
  cont: [...defaultCommonProps],
};

/** Parameters for configuring a Context */
interface Options {
  /**
   * List of allowable CSS properties
   */
  whitelist?: Whitelist;
}

/** Primary user-facing entry point */
class Context {
  whitelist: CompiledWhitelist;

  /** Create a context
   *
   * @param options Optional configs. If none is provided, sane defautls will be used.
   */
  constructor(options?: Options) {
    if (!options) options = {};
    if (!options.whitelist) options.whitelist = defaultWhitelist;

    this.whitelist = compileWhitelist(options.whitelist);
  }

  /** Compiles a style
   * @param data The raw style string to compile
   * @returns The compiled style, ready to be passed to compileText().
   */
  compileStyle(data: string): Style.Style {
    return Style.compile(data, this.whitelist);
  }

  /** Performs a full compilation of a text all at once.
   * @param text The text to compile
   * @param styles Styles to be applied to the text.
   * @returns The compiled text.
   */
  compileText(text: string, styles: Style.Style[]): Text.CompiledText {
    const precompiled = Text.precompile(text);

    const compiledEdgeMatter = Text.compileEdgeMatter(precompiled.edgeMatter, this.whitelist);

    styles = [...styles, compiledEdgeMatter.style];

    const styleLut = Style.buildLUT(styles);
    const paragraphs = precompiled.paragraphs.map((p) => Text.compileParagraph(p, styleLut));

    return { paragraphs, styles };
  }

  /** Validates that a style is safely usable. Meant to be used after deserialization.
   * @param style The style to validate
   * @returns Whether or not the style is safe to use.
   */
  isStyleValid(style: Style.Style): boolean {
    return Style.isValid(style, this.whitelist);
  }

  /** Validates that a text is safely usable. Meant to be used after deserialization.
   * @param text The text to validate
   * @returns Whether or not the text is safe to use.
   */
  isTextValid(text: Text.CompiledText): boolean {
    return Text.isValid(text, this.whitelist);
  }
}

export { Options, Context, Whitelist, defaultWhitelist };

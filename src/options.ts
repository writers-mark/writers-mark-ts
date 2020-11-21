import { Whitelist } from './whitelist';

const defaultCommonProps: string[] = ['color', 'background-color', 'font*'];
export const defaultPProps: string[] = [...defaultCommonProps, 'margin*', 'border', 'text-align'];
export const defaultSpanProps: string[] = [...defaultCommonProps];
export const defaultClassPrefix: string = 'wm_ns__';
export const defaultParagraphRule: string = 'default';

/** Set of options that can be passed to Writers-Mark */
export interface Options {
  pProps?: string[];
  spanProps?: string[];
  defaultPRule?: string;
}

/** Sane default options that will be used if nothing is provided. */
export const defaultOptions: Options = {
  pProps: defaultPProps,
  spanProps: defaultSpanProps,
};

export interface InternalOptions {
  pProps: Whitelist;
  spanProps: Whitelist;
  defaultPRule: string;
}

export const makeInternalOptions = (opts: Options): InternalOptions => {
  return {
    pProps: new Whitelist(opts.pProps || defaultPProps),
    spanProps: new Whitelist(opts.spanProps || defaultSpanProps),
    defaultPRule: opts.defaultPRule || defaultParagraphRule,
  };
};

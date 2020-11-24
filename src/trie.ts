interface Node {
  match: boolean;
  children: Map<string, Node>;
}

export class Trie {
  root: Node = { match: false, children: new Map<string, Node>() };

  constructor(patterns: string[]) {
    patterns.forEach((p) => {
      let current: Node = this.root;
      for (const char of p) {
        let next = current.children.get(char);
        if (!next) {
          next = { match: false, children: new Map<string, Node>() };
          current.children.set(char, next);
        }
        current = next;
      }
      current.match = true;
    });
  }

  has(pattern: string): boolean {
    let current: Node = this.root;
    for (const char of pattern) {
      const next = current.children.get(char);
      if (!next) {
        return false;
      }
      current = next;
    }
    return current.match;
  }

  firstFirstMatch(data: string, startAt: number = 0): [number, string[]] {
    const matches: string[] = [];
    let matchStart = -1;

    let current: Node = this.root;

    for (let cursor = startAt; cursor < data.length; ++cursor) {
      const char = data[cursor];
      const next = current.children.get(char);
      if (next) {
        if (matchStart === -1) {
          matchStart = cursor;
        }
        if (next.match) {
          matches.push(data.slice(matchStart, cursor + 1));
        }
        current = next;
      } else if (matches.length !== 0) {
        return [matchStart, matches.reverse()];
      } else {
        if (matchStart !== -1) {
          cursor = matchStart + 1;
          matchStart = -1;
          current = this.root;
        }
      }
    }

    return [-1, []];
  }
}

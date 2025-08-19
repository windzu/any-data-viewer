// Minimal Pyodide type declarations used in this project
// Avoid bringing full @types since we only need a few functions

declare global {
  interface Window {
    loadPyodide?: (options: { indexURL: string }) => Promise<Pyodide>; // loaded from CDN
  }
}

export interface Pyodide {
  runPython: (code: string) => any;
  globals: any;
  FS: {
    writeFile: (path: string, data: Uint8Array | string) => void;
    unlink: (path: string) => void;
  };
}

export {};

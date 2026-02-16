// custom ambient declarations to silence missing type errors

// React router & related packages
declare module 'react-router';
declare module 'react-router-dom';

// icon and animation libs
declare module 'lucide-react';
declare module 'motion/react';

// other missing types
declare module 'react';
declare module 'react-dom';
declare module 'react/jsx-runtime';
declare module 'react-transition-group';
declare module 'ws';
declare module 'estree';
declare module 'node';

// Provide minimal ImportMeta env typings used in routes.ts
interface ImportMeta {
  readonly env: {
    PROD: boolean;
    [key: string]: any;
  };
}

// allow JSX without errors
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

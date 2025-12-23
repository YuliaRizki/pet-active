import { setup, styled } from 'goober';
import React from 'react';

// This tells goober to use React's factory
if (typeof window !== 'undefined') {
  setup(React.createElement);
}

const Title = styled('h1')`
  /* ... your existing styles ... */
  mix-blend-mode: difference;
  color: #fff; /* It will invert against the background */
`;
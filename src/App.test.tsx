import React from 'react';
import { render } from '@testing-library/react';
import * as testingLibraryDom from '@testing-library/dom';
import App from './App';

const { screen } = testingLibraryDom;

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

describe('Smoke Test', () => {
  it('should pass a basic truthy test', () => {
    expect(true).toBe(true);
  });

  it('should be able to render a simple div', () => {
    render(<div data-testid="test-div">Hello World</div>);
    const element = screen.getByTestId('test-div');
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('Hello World');
  });
});

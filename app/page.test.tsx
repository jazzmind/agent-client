import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import Home from './page';

const redirectMock = vi.fn();

vi.mock('next/navigation', () => ({
  redirect: (path: string) => redirectMock(path),
}));

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /agents', () => {
    render(<Home />);
    expect(redirectMock).toHaveBeenCalledWith('/agents');
  });
});

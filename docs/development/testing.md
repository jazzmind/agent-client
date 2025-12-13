# Testing & Storybook Guide - Agent Client

This guide covers the testing setup and Storybook documentation for the agent client project.

## Testing Framework

We use **Vitest** with **React Testing Library** for our testing setup:
- Vitest for fast test execution and coverage
- React Testing Library for component testing
- jsdom for browser environment simulation
- User Event for realistic user interactions

## Storybook Setup

We use **Storybook** for component documentation and development:
- Interactive component playground
- Visual documentation
- Test scenarios and edge cases
- Design system documentation

## Setup

### Prerequisites
```bash
npm install
```

### Environment Variables
Test environment variables are configured in `test/setup.ts`.

## Running Tests

### Test Commands
```bash
# Run all tests once
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with UI interface
npm run test:ui
```

### Storybook Commands
```bash
# Start Storybook development server
npm run storybook

# Build Storybook for production
npm run build-storybook
```

## Project Structure

### Test Structure
```
app/
├── components/
│   └── admin/
│       ├── ClientManagement.tsx
│       ├── ClientManagement.test.tsx
│       └── ClientManagement.stories.tsx
├── page.tsx
├── page.test.tsx
└── page.stories.tsx
lib/
├── admin-client.ts
└── admin-client.test.ts
test/
├── setup.ts              # Test configuration
└── fixtures/             # Test data and helpers
.storybook/
├── main.ts               # Storybook configuration
└── preview.ts            # Global Storybook settings
```

## Writing Tests

### Component Testing Example
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('handles user interactions', async () => {
    const user = userEvent.setup();
    render(<MyComponent onSubmit={vi.fn()} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });
});
```

### API Testing Example
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listClients } from './admin-client';

global.fetch = vi.fn();

describe('admin-client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch clients successfully', async () => {
    const mockResponse = { servers: [] };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await listClients();
    expect(result).toEqual(mockResponse);
  });
});
```

## Writing Storybook Stories

### Basic Story Structure
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from './MyComponent';

const meta: Meta<typeof MyComponent> = {
  title: 'Components/MyComponent',
  component: MyComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Default Title',
    variant: 'primary',
  },
};

export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true,
  },
};
```

### Interactive Story with Play Function
```typescript
export const WithInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    const button = canvas.getByRole('button');
    await userEvent.click(button);
    
    await expect(canvas.getByText('Clicked!')).toBeInTheDocument();
  },
};
```

### Story Categories

1. **Pages/**: Full page components
2. **Components/**: Reusable UI components
3. **Admin/**: Admin-specific components
4. **Forms/**: Form components and interactions

## Testing Best Practices

### Component Testing
1. **Test User Behavior**: Focus on what users see and do
2. **Use Semantic Queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Test Accessibility**: Ensure components are accessible
4. **Mock External Dependencies**: Mock API calls, routers, etc.
5. **Test Error States**: Include error conditions and loading states

### Queries Priority (React Testing Library)
1. `getByRole` - Most accessible way to find elements
2. `getByLabelText` - Good for form controls
3. `getByPlaceholderText` - For inputs
4. `getByText` - For non-interactive text
5. `getByDisplayValue` - For form elements with values
6. `getByTestId` - Last resort for complex cases

### Storybook Best Practices
1. **Document All States**: Show different component states
2. **Use Controls**: Make stories interactive with Storybook controls
3. **Add Documentation**: Use JSDoc comments for auto-documentation
4. **Test Edge Cases**: Include error states, empty states, loading states
5. **Organize Stories**: Use clear naming and categorization

## Configuration

### Vitest Configuration (`vitest.config.ts`)
- React plugin for JSX support
- jsdom environment for browser simulation
- Path aliases for imports
- Coverage configuration with thresholds

### Storybook Configuration
- Next.js integration for proper handling of Next.js features
- Tailwind CSS support
- Auto-documentation generation
- Interactive testing with play functions

## Mocking in Tests

### Next.js Router
```typescript
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    pathname: '/',
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));
```

### API Calls
```typescript
global.fetch = vi.fn();

beforeEach(() => {
  (global.fetch as any).mockClear();
});

// In test
(global.fetch as any).mockResolvedValueOnce({
  ok: true,
  json: async () => ({ data: 'test' }),
});
```

## Coverage Requirements

Minimum coverage thresholds (80%):
- Statements
- Branches  
- Functions
- Lines

View coverage reports in `coverage/index.html` after running `npm run test:coverage`.

## Accessibility Testing

We include basic accessibility testing:
```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should not have accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## CI/CD Integration

Tests and Storybook builds are integrated into CI/CD:
- Tests must pass before merging
- Storybook is built and deployed for visual review
- Coverage reports are generated

## Debugging

### VS Code Configuration
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/vitest",
  "args": ["run", "--reporter=verbose"],
  "console": "integratedTerminal"
}
```

### Browser Debugging
```typescript
import { screen } from '@testing-library/react';

// Add this in tests to see the rendered HTML
screen.debug();
```

## Common Patterns

### Testing Forms
```typescript
it('submits form with correct data', async () => {
  const user = userEvent.setup();
  const mockSubmit = vi.fn();
  
  render(<MyForm onSubmit={mockSubmit} />);
  
  await user.type(screen.getByLabelText('Name'), 'John Doe');
  await user.click(screen.getByRole('button', { name: 'Submit' }));
  
  expect(mockSubmit).toHaveBeenCalledWith({ name: 'John Doe' });
});
```

### Testing Async Operations
```typescript
it('shows loading state', async () => {
  render(<AsyncComponent />);
  
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Storybook Documentation](https://storybook.js.org/docs)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

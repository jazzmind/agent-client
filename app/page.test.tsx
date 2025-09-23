import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from './page';

// Mock fetch globally
global.fetch = vi.fn();

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the chat interface', () => {
    render(<Home />);
    
    expect(screen.getByText('Weather Agent Chat')).toBeInTheDocument();
    expect(screen.getByText('Ask about weather conditions or get activity suggestions')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask about weather in any city...')).toBeInTheDocument();
    expect(screen.getByText('Send')).toBeInTheDocument();
  });

  it('displays initial assistant message', () => {
    render(<Home />);
    
    expect(screen.getByText(/Hello! I'm your weather assistant/)).toBeInTheDocument();
  });

  it('shows suggestion buttons', () => {
    render(<Home />);
    
    expect(screen.getByText('Weather in New York')).toBeInTheDocument();
    expect(screen.getByText('Weather in London')).toBeInTheDocument();
    expect(screen.getByText('Activities for rainy weather')).toBeInTheDocument();
  });

  it('handles user input and sends messages', async () => {
    const user = userEvent.setup();
    
    // Mock successful API response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        text: 'The weather in New York is sunny.',
      }),
    });

    render(<Home />);
    
    const input = screen.getByPlaceholderText('Ask about weather in any city...');
    const sendButton = screen.getByText('Send');
    
    // Type a message
    await user.type(input, 'What is the weather in New York?');
    expect(input).toHaveValue('What is the weather in New York?');
    
    // Send the message
    await user.click(sendButton);
    
    // Check that the user message appears
    await waitFor(() => {
      expect(screen.getByText('What is the weather in New York?')).toBeInTheDocument();
    });
    
    // Check that the API was called
    expect(global.fetch).toHaveBeenCalledWith('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'What is the weather in New York?' }],
      }),
    });
    
    // Check that the assistant response appears
    await waitFor(() => {
      expect(screen.getByText('The weather in New York is sunny.')).toBeInTheDocument();
    });
  });

  it('shows loading state while waiting for response', async () => {
    const user = userEvent.setup();
    
    // Mock delayed API response
    (global.fetch as any).mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true, text: 'Response' }),
        }), 100)
      )
    );

    render(<Home />);
    
    const input = screen.getByPlaceholderText('Ask about weather in any city...');
    const sendButton = screen.getByText('Send');
    
    await user.type(input, 'Test message');
    await user.click(sendButton);
    
    // Check loading state
    expect(screen.getByText('Weather assistant is typing...')).toBeInTheDocument();
    expect(screen.getByText('Sending...')).toBeInTheDocument();
    
    // Wait for response
    await waitFor(() => {
      expect(screen.getByText('Response')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock API error
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Network error',
      }),
    });

    render(<Home />);
    
    const input = screen.getByPlaceholderText('Ask about weather in any city...');
    const sendButton = screen.getByText('Send');
    
    await user.type(input, 'Test message');
    await user.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Sorry, there was an error connecting to the weather service/)).toBeInTheDocument();
    });
  });

  it('clicking suggestion fills the input', async () => {
    const user = userEvent.setup();
    
    render(<Home />);
    
    const input = screen.getByPlaceholderText('Ask about weather in any city...');
    const suggestion = screen.getByText('Weather in New York');
    
    await user.click(suggestion);
    
    expect(input).toHaveValue('Weather in New York');
  });
});

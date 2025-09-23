import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from '@storybook/test';
import AdminPage from './page';

const meta: Meta<typeof AdminPage> = {
  title: 'Pages/AdminPage',
  component: AdminPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The main admin dashboard page with tabs for managing different aspects of the agent server.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default view showing the client management tab.',
      },
    },
  },
};

export const AgentsTab: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Click on the Agents tab
    const agentsTab = canvas.getByText('Agent Definitions');
    await userEvent.click(agentsTab);
    
    // Verify the agents tab is active
    await expect(agentsTab.closest('button')).toHaveClass('text-blue-600');
    await expect(canvas.getByText('Agent management coming soon')).toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the agent definitions management tab.',
      },
    },
  },
};

export const WorkflowsTab: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Click on the Workflows tab
    const workflowsTab = canvas.getByText('Workflow Definitions');
    await userEvent.click(workflowsTab);
    
    // Verify the workflows tab is active
    await expect(workflowsTab.closest('button')).toHaveClass('text-blue-600');
    await expect(canvas.getByText('Workflow management coming soon')).toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the workflow definitions management tab.',
      },
    },
  },
};

export const ToolsTab: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Click on the Tools tab
    const toolsTab = canvas.getByText('Tool Definitions');
    await userEvent.click(toolsTab);
    
    // Verify the tools tab is active
    await expect(toolsTab.closest('button')).toHaveClass('text-blue-600');
    await expect(canvas.getByText('Tool management coming soon')).toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the tool definitions management tab.',
      },
    },
  },
};

export const NavigationFlow: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test navigation between all tabs
    const tabs = [
      'Agent Definitions',
      'Workflow Definitions', 
      'Tool Definitions',
      'Client Management'
    ];
    
    for (const tabName of tabs) {
      const tab = canvas.getByText(tabName);
      await userEvent.click(tab);
      
      // Verify tab is active
      await expect(tab.closest('button')).toHaveClass('text-blue-600');
      
      // Small delay for visual effect
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates navigation between all available tabs.',
      },
    },
  },
};

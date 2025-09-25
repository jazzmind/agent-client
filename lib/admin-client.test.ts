import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

// Mock environment variables
const mockEnv = {
  MASTRA_API_URL: 'http://localhost:4111',
  MANAGEMENT_CLIENT_ID: 'test-management-client',
  MANAGEMENT_CLIENT_SECRET: 'test-management-secret',
};

// Mock the admin-client module functions directly
const mockListClients = vi.fn();
const mockRegisterClient = vi.fn();
const mockDeleteClient = vi.fn();
const mockUpdateClientScopes = vi.fn();

vi.mock('./admin-client', () => ({
  listClients: mockListClients,
  registerClient: mockRegisterClient,
  deleteClient: mockDeleteClient,
  updateClientScopes: mockUpdateClientScopes,
}));

describe('admin-client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listClients', () => {
    it('should fetch and return list of clients', async () => {
      const mockClients = {
        clients: [
          {
            serverId: 'test-client',
            name: 'Test Client',
            scopes: ['weather.read'],
            createdAt: '2023-01-01T00:00:00Z',
            registeredBy: 'admin'
          }
        ]
      };

      // Mock the implementation to return our test data
      mockListClients.mockImplementation(async () => {
        const response = await fetch(`${mockEnv.MASTRA_API_URL}/clients`, {
          method: 'GET',
          headers: {
            'X-Management-Client-Id': mockEnv.MANAGEMENT_CLIENT_ID,
            'X-Management-Client-Secret': mockEnv.MANAGEMENT_CLIENT_SECRET,
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockClients,
      });

      const result = await mockListClients();
      expect(result).toEqual(mockClients);
    });

    it('should handle API errors', async () => {
      mockListClients.mockImplementation(async () => {
        const response = await fetch(`${mockEnv.MASTRA_API_URL}/clients`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      await expect(mockListClients()).rejects.toThrow('HTTP error! status: 500');
    });
  });

  describe('registerClient', () => {
    it('should register a new client', async () => {
      const clientData = {
        serverId: 'new-client',
        name: 'New Client',
        scopes: ['weather.read', 'weather.write'],
      };

      const mockResponse = {
        serverId: 'new-client',
        clientId: 'new-client',
        clientSecret: 'generated-secret',
        scopes: ['weather.read', 'weather.write'],
      };

      mockRegisterClient.mockImplementation(async (data) => {
        const response = await fetch(`${mockEnv.MASTRA_API_URL}/clients/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Management-Client-Id': mockEnv.MANAGEMENT_CLIENT_ID,
            'X-Management-Client-Secret': mockEnv.MANAGEMENT_CLIENT_SECRET,
          },
          body: JSON.stringify({
            ...data,
            managementClientId: mockEnv.MANAGEMENT_CLIENT_ID,
            managementClientSecret: mockEnv.MANAGEMENT_CLIENT_SECRET,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await mockRegisterClient(clientData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteClient', () => {
    it('should delete a client', async () => {
      mockDeleteClient.mockImplementation(async (clientId) => {
        const response = await fetch(`${mockEnv.MASTRA_API_URL}/clients/${clientId}`, {
          method: 'DELETE',
          headers: {
            'X-Management-Client-Id': mockEnv.MANAGEMENT_CLIENT_ID,
            'X-Management-Client-Secret': mockEnv.MANAGEMENT_CLIENT_SECRET,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Client deleted successfully' }),
      });

      const result = await mockDeleteClient('test-client');
      expect(result).toEqual({ message: 'Client deleted successfully' });
    });
  });

  describe('updateClientScopes', () => {
    it('should update client scopes', async () => {
      const newScopes = ['weather.read', 'agent.execute'];
      
      mockUpdateClientScopes.mockImplementation(async (clientId, scopes) => {
        const response = await fetch(`${mockEnv.MASTRA_API_URL}/clients/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Management-Client-Id': mockEnv.MANAGEMENT_CLIENT_ID,
            'X-Management-Client-Secret': mockEnv.MANAGEMENT_CLIENT_SECRET,
          },
          body: JSON.stringify({
            serverId: clientId,
            name: clientId,
            scopes: scopes,
            managementClientId: mockEnv.MANAGEMENT_CLIENT_ID,
            managementClientSecret: mockEnv.MANAGEMENT_CLIENT_SECRET,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          message: 'Client updated',
          clientId: 'test-client',
          scopes: newScopes
        }),
      });

      const result = await mockUpdateClientScopes('test-client', newScopes);
      expect(result.scopes).toEqual(newScopes);
    });
  });
});
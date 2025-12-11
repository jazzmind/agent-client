'use client';

import { useState, useEffect } from 'react';
import { listClients, registerClient, deleteClient, updateClientScopes, getClientSecret, resetClientSecret } from '../../lib/admin-client';

interface Application {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  scope_prefix?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  components?: ApplicationComponent[];
  clientPermissions?: ApplicationClientPermission[];
}

interface ApplicationComponent {
  id: string;
  application_id: string;
  component_type: 'agent' | 'workflow' | 'tool' | 'rag_database' | 'network' | 'scorer';
  component_id: string;
  component_name: string;
  scopes: string[];
  created_at: string;
}

interface ApplicationClientPermission {
  id: string;
  client_id: string;
  application_id: string;
  component_scopes: string[];
  granted_by?: string;
  created_at: string;
  updated_at: string;
}

interface Client {
  serverId: string;
  name: string;
  scopes: string[];
  createdAt: string;
  registeredBy: string;
}

// Component types for UI display
const COMPONENT_TYPES = [
  { 
    value: 'agent', 
    label: 'Agent', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    )
  },
  { 
    value: 'workflow', 
    label: 'Workflow', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  { 
    value: 'tool', 
    label: 'Tool', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  { 
    value: 'rag_database', 
    label: 'RAG Database', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    )
  },
  { 
    value: 'network', 
    label: 'Network', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
      </svg>
    )
  },
  { 
    value: 'scorer', 
    label: 'Scorer', 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    )
  }
];

export default function ApplicationManagement() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [showClientSelectorModal, setShowClientSelectorModal] = useState(false);
  const [showScopePrefixEditor, setShowScopePrefixEditor] = useState(false);
  const [editingScopePrefix, setEditingScopePrefix] = useState('');
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'components' | 'clients' | 'testing'>('overview');

  // Testing state
  const [selectedTestClient, setSelectedTestClient] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{[key: string]: {success: boolean, message: string, timestamp: string}}>({});
  const [testingInProgress, setTestingInProgress] = useState<{[key: string]: boolean}>({});

  // Navigation handler for component clicks
  const handleComponentNavigation = (componentType: string, componentId: string) => {
    // Create URL based on component type
    const routeMap = {
      'agent': '/admin/agents',
      'workflow': '/admin/workflows', 
      'tool': '/admin/tools',
      'rag_database': '/admin/rag',
      'network': '/admin/networks',
      'scorer': '/admin/scorers'
    };
    
    const baseRoute = routeMap[componentType as keyof typeof routeMap];
    if (baseRoute) {
      // Navigate to the component details page - assuming the ID is part of the URL path
      window.location.href = `${baseRoute}/${encodeURIComponent(componentId)}`;
    }
  };

  // Form states
  const [newApplication, setNewApplication] = useState({
    name: '',
    display_name: '',
    description: ''
  });

  const [newComponent, setNewComponent] = useState({
    component_type: 'agent' as const,
    component_id: '',
    component_name: '',
    scopes: [] as string[] // This will be auto-populated by the backend based on component type
  });
  
  const [availableComponents, setAvailableComponents] = useState<{
    id: string;
    name: string;
    display_name: string;
    component_type: string;
    scopes: string[];
  }[]>([]);
  const [loadingComponents, setLoadingComponents] = useState(false);

  const [newPermission, setNewPermission] = useState({
    client_id: '',
    component_scopes: [] as string[]
  });

  const [newClient, setNewClient] = useState({
    serverId: '',
    name: '',
    scopes: [] as string[]
  });

  const [selectedClientForPermission, setSelectedClientForPermission] = useState<Client | null>(null);

  useEffect(() => {
    fetchApplications();
    fetchClients();
  }, []);

  // Fetch available components when component type changes
  useEffect(() => {
    if (showComponentModal) {
      fetchAvailableComponents(newComponent.component_type);
    }
  }, [showComponentModal, newComponent.component_type]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/applications');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch applications');
      }
      
      const data = await response.json();
      setApplications(data.applications || []);
      setError(null);
    } catch (error: any) {
      setError(error.message);
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/admin/clients');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch clients');
      }
      
      const data = await response.json();
      setClients(data.servers || []);
    } catch (error: any) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const fetchApplicationDetails = async (applicationId: string) => {
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch application details');
      }
      
      const data = await response.json();
      setSelectedApplication(data.application);
    } catch (error: any) {
      setError(error.message);
      console.error('Failed to fetch application details:', error);
    }
  };

  const fetchAvailableComponents = async (componentType?: string) => {
    setLoadingComponents(true);
    try {
      const applicationId = selectedApplication?.id;
      const queryString = componentType ? `?type=${encodeURIComponent(componentType)}` : '';
      const response = await fetch(`/api/admin/applications/${applicationId}/components${queryString}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch available components');
      }
      
      const data = await response.json();
      setAvailableComponents(data.components || []);
    } catch (error: any) {
      console.error('Failed to fetch available components:', error);
      setAvailableComponents([]);
    } finally {
      setLoadingComponents(false);
    }
  };

  const createApplication = async () => {
    try {
      const response = await fetch('/api/admin/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newApplication),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create application');
      }

      setNewApplication({ name: '', display_name: '', description: '' });
      setShowCreateModal(false);
      await fetchApplications();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const deleteApplication = async (applicationId: string) => {
    if (!confirm('Are you sure you want to delete this application? This will remove all associated components and permissions.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete application');
      }

      if (selectedApplication?.id === applicationId) {
        setSelectedApplication(null);
      }
      await fetchApplications();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleComponentSelection = (componentId: string) => {
    const selectedComponent = availableComponents.find(c => c.id === componentId);
    if (selectedComponent) {
      setNewComponent(prev => ({
        ...prev,
        component_id: selectedComponent.id,
        component_name: selectedComponent.display_name,
        scopes: selectedComponent.scopes || [] // Use component-defined scopes
      }));
    }
  };


  const addComponent = async () => {
    if (!selectedApplication) return;

    try {
      // Use the component's defined scopes (already populated from component selection)
      const response = await fetch(`/api/admin/applications/${selectedApplication.id}/components`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newComponent),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add component');
      }

      setNewComponent({
        component_type: 'agent',
        component_id: '',
        component_name: '',
        scopes: [] // Reset to empty - backend will determine scopes
      });
      setShowComponentModal(false);
      await fetchApplicationDetails(selectedApplication.id);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const removeComponent = async (componentId: string, componentType: string, componentName: string) => {
    if (!selectedApplication) return;
    
    if (!confirm(`Are you sure you want to remove "${componentName}" from this application?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/applications/${selectedApplication.id}/components/${componentId}?type=${componentType}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove component');
      }

      await fetchApplicationDetails(selectedApplication.id);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const grantPermission = async () => {
    if (!selectedApplication) return;

    try {
      const response = await fetch(`/api/admin/applications/${selectedApplication.id}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPermission),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to grant permission');
      }

      setNewPermission({
        client_id: '',
        component_scopes: []
      });
      setShowPermissionModal(false);
      await fetchApplicationDetails(selectedApplication.id);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleScopeToggle = (scope: string, currentScopes: string[], setter: (scopes: string[]) => void) => {
    if (currentScopes.includes(scope)) {
      setter(currentScopes.filter(s => s !== scope));
    } else {
      setter([...currentScopes, scope]);
    }
  };

  const createClient = async () => {
    try {
      await registerClient(newClient);
      setNewClient({ serverId: '', name: '', scopes: [] });
      setShowCreateClientModal(false);
      await fetchClients();
      // After creating client, show selector modal if we came from there
      setShowClientSelectorModal(true);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? This will remove all associated permissions.')) {
      return;
    }

    try {
      await deleteClient(clientId);
      await fetchClients();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleUpdateClientScopes = async (clientId: string, scopes: string[]) => {
    try {
      await updateClientScopes(clientId, scopes);
      await fetchClients();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleGetClientSecret = async (clientId: string) => {
    try {
      const result = await getClientSecret(clientId);
      setClientSecret(result.secret);
      setShowSecret(true);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleResetClientSecret = async (clientId: string) => {
    if (!confirm('Are you sure you want to reset this client secret? This will invalidate the current secret.')) {
      return;
    }

    try {
      const result = await resetClientSecret(clientId);
      setClientSecret(result.secret);
      setShowSecret(true);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const updateScopePrefix = async () => {
    if (!selectedApplication) return;

    try {
      const response = await fetch(`/api/admin/applications/${selectedApplication.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...selectedApplication,
          scope_prefix: editingScopePrefix
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update scope prefix');
      }

      setSelectedApplication(prev => prev ? { ...prev, scope_prefix: editingScopePrefix } : null);
      setShowScopePrefixEditor(false);
      setEditingScopePrefix('');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const revokePermission = async (clientId: string, clientName?: string) => {
    if (!selectedApplication) return;
    
    if (!confirm(`Are you sure you want to revoke access for "${clientName || clientId}" from this application?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/applications/${selectedApplication.id}/permissions/${clientId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to revoke permission');
      }

      await fetchApplicationDetails(selectedApplication.id);
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Testing functions
  const testComponentAccess = async (clientId: string, componentType: string, componentId: string, action: string, shouldSucceed: boolean) => {
    const testKey = `${clientId}-${componentType}-${componentId}-${action}`;
    setTestingInProgress(prev => ({ ...prev, [testKey]: true }));
    
    try {
      // Get client secret for authentication
      const secretResponse = await fetch(`/api/admin/clients/${clientId}/secret`);
      if (!secretResponse.ok) {
        throw new Error('Failed to get client credentials');
      }
      const { secret } = await secretResponse.json();

      // Test OAuth token generation with the specific scope
      const requestedScope = `${selectedApplication?.name}.${componentType}.${action}`;
      const tokenResponse = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: secret,
          audience: `${process.env.MASTRA_API_URL || 'agent-client'}/admin`,
          scope: requestedScope
        })
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        const result = {
          success: !shouldSucceed, // If we expected failure and got failure, it's a success
          message: shouldSucceed 
            ? `❌ Failed to get access token: ${errorData.error || 'Unknown error'}` 
            : `✅ Correctly denied access token for scope: ${requestedScope}`,
          timestamp: new Date().toLocaleTimeString()
        };
        setTestResults(prev => ({ ...prev, [testKey]: result }));
        return;
      }

      const { access_token, scope: grantedScope } = await tokenResponse.json();

      // Verify the token was granted with correct scope
      const result = {
        success: shouldSucceed,
        message: shouldSucceed 
          ? `✅ Successfully obtained access token for ${componentType}.${action}${grantedScope ? ` (granted: ${grantedScope})` : ''}`
          : `❌ Incorrectly obtained access token for ${componentType}.${action} - this should have been denied`,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setTestResults(prev => ({ ...prev, [testKey]: result }));
    } catch (error: any) {
      const result = {
        success: !shouldSucceed,
        message: shouldSucceed ? `❌ Error: ${error.message}` : `✅ Correctly blocked: ${error.message}`,
        timestamp: new Date().toLocaleTimeString()
      };
      setTestResults(prev => ({ ...prev, [testKey]: result }));
    } finally {
      setTestingInProgress(prev => ({ ...prev, [testKey]: false }));
    }
  };

  const createTestAgent = async () => {
    if (!selectedApplication) return;

    try {
      const testAgentData = {
        name: `test-agent-restricted-${Date.now()}`,
        display_name: `Test Agent (Restricted Access)`,
        instructions: 'This is a test agent created to demonstrate access control restrictions. It should only be accessible to clients with proper scopes.',
        model: 'gpt-4o-mini',
        tools: [],
        scopes: ['agent.read', 'agent.execute'], // Standard agent scopes
        is_active: true
      };

      const response = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testAgentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create test agent');
      }

      const { agent } = await response.json();
      
      // Add the agent to the current application
      const componentData = {
        component_type: 'agent',
        component_id: agent.id,
        component_name: agent.display_name,
        scopes: agent.scopes
      };

      const addResponse = await fetch(`/api/admin/applications/${selectedApplication.id}/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(componentData)
      });

      if (!addResponse.ok) {
        const errorData = await addResponse.json();
        throw new Error(errorData.error || 'Failed to add agent to application');
      }

      // Refresh application details to show the new agent
      await fetchApplicationDetails(selectedApplication.id);
      
      alert(`Created test agent "${agent.display_name}" with restricted access. You can now test access control with this agent.`);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const runAllTests = async (clientId: string) => {
    if (!selectedApplication?.components) return;
    
    const clientPermission = selectedApplication.clientPermissions?.find(p => p.client_id === clientId);
    if (!clientPermission) return;

    const allowedScopes = clientPermission.component_scopes;

    // Test positive cases (should succeed)
    for (const component of selectedApplication.components) {
      const componentScopes = component.scopes || [];
      for (const scope of componentScopes) {
        if (allowedScopes.includes(scope)) {
          const [action] = scope.split('.').slice(-1);
          await testComponentAccess(clientId, component.component_type, component.component_id, action, true);
          await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
        }
      }
    }

    // Test negative cases (should fail) - test a few scopes the client doesn't have
    for (const component of selectedApplication.components) {
      const componentScopes = component.scopes || [];
      const deniedScopes = componentScopes.filter(scope => !allowedScopes.includes(scope));
      
      // Test first denied scope for each component
      if (deniedScopes.length > 0) {
        const scope = deniedScopes[0];
        const [action] = scope.split('.').slice(-1);
        await testComponentAccess(clientId, component.component_type, component.component_id, action, false);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  const ApplicationCard = ({ application }: { application: Application }) => (
    <div
      onClick={() => fetchApplicationDetails(application.id)}
      className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200/50 group hover:scale-[1.02]"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
              {application.display_name}
            </h3>
            <p className="text-sm text-gray-500">{application.name}</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteApplication(application.id);
          }}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      
      {application.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{application.description}</p>
      )}
      
      <div className="text-sm text-gray-500">
        <span>Created {new Date(application.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );

  if (selectedApplication) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50">
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedApplication(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedApplication.display_name}</h2>
                <p className="text-sm text-gray-500">{selectedApplication.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {activeDetailTab === 'components' && (
                <button
                  onClick={() => setShowComponentModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Add Component
                </button>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 pt-4">
            <nav className="flex space-x-8" aria-label="Tabs">
              {[
                { 
                  id: 'overview', 
                  label: 'Overview', 
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )
                },
                { 
                  id: 'components', 
                  label: 'Components', 
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  )
                },
                { 
                  id: 'clients', 
                  label: 'Clients', 
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  )
                },
                { 
                  id: 'testing', 
                  label: 'Testing', 
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDetailTab(tab.id as any)}
                  className={`${
                    activeDetailTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {selectedApplication.description && activeDetailTab === 'overview' && (
            <div className="p-6 border-b border-gray-200/50">
              <p className="text-gray-700">{selectedApplication.description}</p>
            </div>
          )}
        </div>

        {/* Tab Content */}
        {activeDetailTab === 'overview' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50">
            <div className="p-6 border-b border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-900">Application Overview</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Components</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedApplication.components?.length || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Clients</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedApplication.clientPermissions?.length || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-9 4h10M5 11h14l-1 7a1 1 0 01-1 1H7a1 1 0 01-1-1l-1-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="text-lg font-bold text-gray-900">{new Date(selectedApplication.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
              {selectedApplication.description && (
              <div className="space-y-4">
              {selectedApplication.description && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700">{selectedApplication.description}</p>
                </div>
              )}
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Scope Prefix</h4>
                    <button
                      onClick={() => {
                        setEditingScopePrefix(selectedApplication.scope_prefix || selectedApplication.name);
                        setShowScopePrefixEditor(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-gray-700 font-mono text-sm">
                    {selectedApplication.scope_prefix || selectedApplication.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    This prefix is used for application-scoped permissions (e.g., {selectedApplication.scope_prefix || selectedApplication.name}.agent.read)
                  </p>
                </div>
              </div>
              )}
            </div>
          </div>
        )}

        {activeDetailTab === 'components' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50">
            <div className="p-6 border-b border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-900">Application Components</h3>
            </div>
          <div className="p-6">
            {selectedApplication.components && selectedApplication.components.length > 0 ? (
              <div className="space-y-3">
                {selectedApplication.components.map((component) => {
                  const typeInfo = COMPONENT_TYPES.find(t => t.value === component.component_type);
                  return (
                    <div 
                      key={component.id} 
                        className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center text-gray-600 group-hover:text-blue-600 transition-colors">
                          {typeInfo?.icon}
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">{component.component_name}</p>
                          <p className="text-sm text-gray-500">{typeInfo?.label} • {component.component_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex flex-wrap gap-1">
                          {component.scopes.map((scope) => (
                            <span
                              key={scope}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {scope}
                            </span>
                          ))}
                        </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleComponentNavigation(component.component_type, component.component_id);
                              }}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Component"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeComponent(component.component_id, component.component_type, component.component_name);
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove Component"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No components added yet. Click "Add Component" to get started.
              </div>
            )}
          </div>
          </div>
        )}

        {activeDetailTab === 'clients' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50">
              <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
                <div>
                <h3 className="text-lg font-semibold text-gray-900">Application Access</h3>
                <p className="text-sm text-gray-500">Clients with access to "{selectedApplication.display_name}"</p>
                </div>
                <button
                onClick={() => setShowClientSelectorModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                <span>Add Client</span>
                </button>
              </div>
              <div className="p-6">
                {selectedApplication.clientPermissions && selectedApplication.clientPermissions.length > 0 ? (
                  <div className="space-y-3">
                    {selectedApplication.clientPermissions.map((permission) => {
                      const client = clients.find(c => c.serverId === permission.client_id);
                      return (
                        <div key={permission.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{client?.name || permission.client_id}</p>
                              <p className="text-sm text-gray-500">Client ID: {permission.client_id}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {permission.component_scopes.map((scope) => (
                                  <span
                                    key={scope}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                  >
                                    {scope}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                const client = clients.find(c => c.serverId === permission.client_id);
                                if (client) {
                                setSelectedClientForPermission(client);
                                setNewPermission({
                                  client_id: client.serverId,
                                  component_scopes: permission.component_scopes
                                });
                                setShowPermissionModal(true);
                                }
                                  }}
                                  className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors text-sm"
                                >
                                  Edit Access
                                </button>
                              <button
                              onClick={() => handleGetClientSecret(permission.client_id)}
                              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors text-sm"
                            >
                              View Secret
                              </button>
                            <button
                              onClick={() => handleResetClientSecret(permission.client_id)}
                              className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded transition-colors text-sm"
                            >
                              Reset Secret
                            </button>
                            <button
                              onClick={() => {
                                const client = clients.find(c => c.serverId === permission.client_id);
                                revokePermission(permission.client_id, client?.name);
                              }}
                              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors text-sm"
                            >
                              Revoke
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                  No clients have access to this application yet. Click "Add Client" to grant access.
                  </div>
                )}
              </div>
            </div>
        )}

        {activeDetailTab === 'testing' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50">
              <div className="p-6 border-b border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-900">Application Testing</h3>
              <p className="text-sm text-gray-600 mt-1">Test client access controls and scope restrictions</p>
              </div>
              <div className="p-6">
                {selectedApplication.clientPermissions && selectedApplication.clientPermissions.length > 0 ? (
                <div className="space-y-6">
                  {/* Client Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Client to Test</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedApplication.clientPermissions.map((permission) => {
                      const client = clients.find(c => c.serverId === permission.client_id);
                        const isSelected = selectedTestClient === permission.client_id;
                      return (
                          <div
                            key={permission.id}
                            onClick={() => setSelectedTestClient(permission.client_id)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                          <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                isSelected ? 'bg-blue-600' : 'bg-gray-400'
                              }`}>
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                              <div className="flex-1">
                              <p className="font-medium text-gray-900">{client?.name || permission.client_id}</p>
                                <p className="text-sm text-gray-500">
                                  {permission.component_scopes.length} scope{permission.component_scopes.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="mt-3 pt-3 border-t border-blue-200">
                                <div className="flex flex-wrap gap-1">
                                  {permission.component_scopes.map(scope => (
                                    <span key={scope} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {scope}
                                  </span>
                                ))}
                              </div>
                            </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Test Controls */}
                  {selectedTestClient && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-medium text-gray-900">Access Control Tests</h4>
                        <div className="flex space-x-3">
                          <button
                            onClick={createTestAgent}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                          >
                            Create Test Agent
                          </button>
                          <button
                            onClick={() => runAllTests(selectedTestClient)}
                            disabled={Object.values(testingInProgress).some(Boolean)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {Object.values(testingInProgress).some(Boolean) ? 'Testing...' : 'Run All Tests'}
                          </button>
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-start space-x-2">
                          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="text-sm">
                            <p className="font-medium text-blue-900 mb-1">How Testing Works</p>
                            <p className="text-blue-800">
                              This tests OAuth token generation with specific scopes. <strong>Green tests</strong> verify the client can get tokens for permitted scopes. 
                              <strong>Red tests</strong> verify the client is denied tokens for forbidden scopes. Use "Create Test Agent" to add a component with restricted access for testing.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Test Results */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Positive Tests (Should Succeed) */}
                          <div>
                            <h5 className="font-medium text-green-900 mb-3 flex items-center space-x-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Allowed Access Tests</span>
                            </h5>
                            <div className="space-y-2">
                              {selectedApplication.components?.map(component => {
                                const clientPermission = selectedApplication.clientPermissions?.find(p => p.client_id === selectedTestClient);
                                const allowedScopes = clientPermission?.component_scopes || [];
                                const componentScopes = component.scopes || [];
                                
                                return componentScopes
                                  .filter(scope => allowedScopes.includes(scope))
                                  .map(scope => {
                                    const [action] = scope.split('.').slice(-1);
                                    const testKey = `${selectedTestClient}-${component.component_type}-${component.component_id}-${action}`;
                                    const result = testResults[testKey];
                                    const isLoading = testingInProgress[testKey];
                                    
                                    return (
                                      <div key={testKey} className={`p-3 rounded-lg border-l-4 ${
                                        result 
                                          ? (result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50')
                                          : 'border-gray-300 bg-white'
                                      }`}>
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <p className="text-sm font-medium text-gray-900">
                                              {component.component_name} - {action}
                                            </p>
                                            <p className="text-xs text-gray-500">{scope}</p>
                                          </div>
                            <button
                                            onClick={() => testComponentAccess(selectedTestClient, component.component_type, component.component_id, action, true)}
                                            disabled={isLoading}
                                            className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors disabled:opacity-50"
                                          >
                                            {isLoading ? '...' : 'Test'}
                            </button>
                          </div>
                                        {result && (
                                          <div className="mt-2 text-xs">
                                            <p className={result.success ? 'text-green-700' : 'text-red-700'}>
                                              {result.message}
                                            </p>
                                            <p className="text-gray-500">{result.timestamp}</p>
                  </div>
                )}
              </div>
                                    );
                                  });
                              }).flat()}
            </div>
          </div>

                          {/* Negative Tests (Should Fail) */}
                          <div>
                            <h5 className="font-medium text-red-900 mb-3 flex items-center space-x-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                              <span>Denied Access Tests</span>
                            </h5>
                            <div className="space-y-2">
                              {selectedApplication.components?.map(component => {
                                const clientPermission = selectedApplication.clientPermissions?.find(p => p.client_id === selectedTestClient);
                                const allowedScopes = clientPermission?.component_scopes || [];
                                const componentScopes = component.scopes || [];
                                const deniedScopes = componentScopes.filter(scope => !allowedScopes.includes(scope));
                                
                                return deniedScopes.slice(0, 1).map(scope => { // Only show first denied scope per component
                                  const [action] = scope.split('.').slice(-1);
                                  const testKey = `${selectedTestClient}-${component.component_type}-${component.component_id}-${action}`;
                                  const result = testResults[testKey];
                                  const isLoading = testingInProgress[testKey];
                                  
                      return (
                                    <div key={testKey} className={`p-3 rounded-lg border-l-4 ${
                                      result 
                                        ? (result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50')
                                        : 'border-gray-300 bg-white'
                                    }`}>
                                      <div className="flex items-center justify-between">
                            <div>
                                          <p className="text-sm font-medium text-gray-900">
                                            {component.component_name} - {action}
                              </p>
                                          <p className="text-xs text-gray-500">{scope} (should be denied)</p>
                          </div>
                          <button 
                                          onClick={() => testComponentAccess(selectedTestClient, component.component_type, component.component_id, action, false)}
                                          disabled={isLoading}
                                          className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors disabled:opacity-50"
                                        >
                                          {isLoading ? '...' : 'Test'}
                          </button>
                                      </div>
                                      {result && (
                                        <div className="mt-2 text-xs">
                                          <p className={result.success ? 'text-green-700' : 'text-red-700'}>
                                            {result.message}
                                          </p>
                                          <p className="text-gray-500">{result.timestamp}</p>
                                        </div>
                                      )}
                        </div>
                      );
                                });
                              }).flat()}
                            </div>
                          </div>
                        </div>

                        {/* Clear Results */}
                        {Object.keys(testResults).length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <button
                              onClick={() => setTestResults({})}
                              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                            >
                              Clear Results
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 mb-4">No clients have access to this application yet.</p>
                    <button
                      onClick={() => {
                        setActiveDetailTab('clients');
                      setShowClientSelectorModal(true);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                    Add Client Access
                    </button>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Add Component Modal */}
        {showComponentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Component</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Component Type</label>
                  <select
                    value={newComponent.component_type}
                    onChange={(e) => setNewComponent(prev => ({ 
                      ...prev, 
                      component_type: e.target.value as any,
                      component_id: '',
                      component_name: '',
                      scopes: [] // Will be determined by backend
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {COMPONENT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Component</label>
                  <select
                    value={newComponent.component_id}
                    onChange={(e) => handleComponentSelection(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    disabled={loadingComponents}
                  >
                    <option value="">
                      {loadingComponents ? 'Loading components...' : 'Select a component'}
                    </option>
                    {availableComponents
                      .filter(c => c.component_type === newComponent.component_type)
                      .map((component) => (
                        <option key={component.id} value={component.id}>
                          {component.display_name} ({component.name})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Component Name</label>
                  <input
                    type="text"
                    value={newComponent.component_id}
                    readOnly
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                    placeholder="Auto-populated from selection"
                  />
                </div>

                <div className="bg-blue-50 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 mb-2">Component Scopes</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    This component defines the following scopes:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {newComponent.component_id ? (
                      // Show actual component-defined scopes
                      newComponent.scopes.map(scope => (
                        <span
                          key={scope}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {scope}
                        </span>
                      ))
                    ) : (
                      // Show placeholder when no component selected
                      <span className="text-sm text-gray-500 italic">
                        Select a component to see its defined scopes
                      </span>
                    )}
                  </div>
                  {newComponent.component_id && (
                    <p className="text-xs text-gray-500 mt-2">
                      These are the scopes defined by this specific component and will be available for client permissions.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={addComponent}
                  disabled={!newComponent.component_id || !newComponent.component_name}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Add Component
                </button>
                <button
                  onClick={() => setShowComponentModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Client Modal */}
        {showCreateClientModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Client</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                  <input
                    type="text"
                    value={newClient.serverId}
                    onChange={(e) => setNewClient(prev => ({ ...prev, serverId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g., weather-app-client"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={newClient.name}
                    onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g., Weather App Client"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Global Scopes</label>
                  <p className="text-xs text-gray-500 mb-2">
                    These are global client scopes. Application-specific permissions will be configured separately.
                  </p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {['admin.read', 'admin.write'].map(scope => (
                      <label key={scope} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newClient.scopes.includes(scope)}
                          onChange={() => handleScopeToggle(scope, newClient.scopes, 
                            (scopes) => setNewClient(prev => ({ ...prev, scopes })))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{scope}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={createClient}
                  disabled={!newClient.serverId || !newClient.name}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Create Client
                </button>
                <button
                  onClick={() => setShowCreateClientModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Client Modal */}
        {showEditClientModal && selectedClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Client: {selectedClient.name}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                  <input
                    type="text"
                    value={selectedClient.serverId}
                    disabled
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                  />
                </div>


              <div className="space-y-4">
                {/* Client Secret Management */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client Secret Management</label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleGetClientSecret(selectedClient.serverId)}
                      className="px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded transition-colors text-sm"
                    >
                      Show Secret
                    </button>
                    <button
                      onClick={() => handleResetClientSecret(selectedClient.serverId)}
                      className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors text-sm"
                    >
                      Reset Secret
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    handleUpdateClientScopes(selectedClient.serverId, selectedClient.scopes);
                    setShowEditClientModal(false);
                    setSelectedClient(null);
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Update Client
                </button>
                <button
                  onClick={() => {
                    setShowEditClientModal(false);
                    setSelectedClient(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
              </div>
            </div>
          </div>
        )}

        {/* Grant Permission Modal */}
        {showPermissionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedClientForPermission ? 'Edit Client Permission' : 'Grant Client Permission'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                  <select
                    value={newPermission.client_id}
                    onChange={(e) => setNewPermission(prev => ({ ...prev, client_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    disabled={!!selectedClientForPermission}
                  >
                    <option value="">Select a client...</option>
                    {clients.map(client => (
                      <option key={client.serverId} value={client.serverId}>
                        {client.name} ({client.serverId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Application Scopes</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedApplication?.components && selectedApplication.components.length > 0 ? (
                      // Show scopes from actual application components
                      Array.from(new Set(
                        selectedApplication.components.flatMap(component => component.scopes)
                      )).map(scope => (
                      <label key={scope} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newPermission.component_scopes.includes(scope)}
                          onChange={() => handleScopeToggle(scope, newPermission.component_scopes, 
                            (scopes) => setNewPermission(prev => ({ ...prev, component_scopes: scopes })))}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{scope}</span>
                      </label>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        No components in this application yet. Add components first to see available scopes.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={grantPermission}
                  disabled={!newPermission.client_id || newPermission.component_scopes.length === 0}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {selectedClientForPermission ? 'Update Permission' : 'Grant Permission'}
                </button>
                <button
                  onClick={() => {
                    setShowPermissionModal(false);
                    setSelectedClientForPermission(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Client Selector Modal */}
        {showClientSelectorModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Client Access</h3>
              
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h4 className="font-medium text-gray-900 mb-3">Existing Clients</h4>
                  {clients.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {clients
                        .filter(client => !selectedApplication.clientPermissions?.find(p => p.client_id === client.serverId))
                        .map((client) => (
                          <div key={client.serverId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{client.name}</p>
                                <p className="text-sm text-gray-500">{client.serverId}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setNewPermission({ client_id: client.serverId, component_scopes: [] });
                                setShowClientSelectorModal(false);
                                setShowPermissionModal(true);
                              }}
                              className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors text-sm"
                            >
                              Grant Access
                            </button>
                          </div>
                        ))
                      }
                      {clients.every(client => selectedApplication.clientPermissions?.find(p => p.client_id === client.serverId)) && (
                        <div className="text-center py-4 text-gray-500">
                          All existing clients already have access to this application.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No clients found.
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Create New Client</h4>
                  <button
                    onClick={() => {
                      setShowClientSelectorModal(false);
                      setShowCreateClientModal(true);
                    }}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2 text-gray-600 hover:text-blue-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Create New Client</span>
                  </button>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowClientSelectorModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scope Prefix Editor Modal */}
        {showScopePrefixEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Scope Prefix</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scope Prefix</label>
                  <input
                    type="text"
                    value={editingScopePrefix}
                    onChange={(e) => setEditingScopePrefix(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono"
                    placeholder="e.g., weather-app"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This will be used as the prefix for all application scopes (e.g., {editingScopePrefix || 'prefix'}.agent.read)
                  </p>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 mb-2">Preview Scopes:</h4>
                  <div className="space-y-1 text-sm font-mono">
                    {['agent', 'workflow', 'tool'].map(component => (
                      <div key={component} className="text-gray-600">
                        {editingScopePrefix || 'prefix'}.{component}.read
                      </div>
                    ))}
                    <div className="text-gray-400">... and more component types</div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={updateScopePrefix}
                  disabled={!editingScopePrefix.trim()}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Update Prefix
                </button>
                <button
                  onClick={() => {
                    setShowScopePrefixEditor(false);
                    setEditingScopePrefix('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Client Secret Modal */}
        {showSecret && clientSecret && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Secret</h3>
              
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-sm font-medium text-yellow-800">Important</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Store this secret securely. It will not be displayed again.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client Secret</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={clientSecret}
                      readOnly
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 font-mono text-sm"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(clientSecret);
                        // You might want to show a toast notification here
                      }}
                      className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors text-sm"
                      title="Copy to clipboard"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowSecret(false);
                    setClientSecret(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-base-content">Applications</h1>
          <p className="text-base-content/60">Manage application collections and client access</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Create Application</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Applications Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/80 rounded-xl p-6 shadow-lg animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📦</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
          <p className="text-gray-600 mb-4">Create your first application to group agents, workflows, and tools.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Create Application
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      )}

      {/* Create Application Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Application</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Application Name</label>
                <input
                  type="text"
                  value={newApplication.name}
                  onChange={(e) => setNewApplication(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="e.g., weather-app"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={newApplication.display_name}
                  onChange={(e) => setNewApplication(prev => ({ ...prev, display_name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="e.g., Weather Application"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={newApplication.description}
                  onChange={(e) => setNewApplication(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Describe what this application does..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={createApplication}
                disabled={!newApplication.name || !newApplication.display_name}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                Create Application
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { MastraClient } from "@mastra/client-js";
import { getAgentWithDocsHeaders, getAuthHeaders } from '../../../lib/oauth-client.js';

// Server-side Mastra client
const baseUrl = process.env.MASTRA_API_URL || 'https://agent-sundai.vercel.app';

// Document-aware agents that need special handling
const DOCUMENT_AGENTS = ['documentAgent', 'ragChatAgent', 'rfp-analysis-agent', 'rfp-analyzer-agent'];

console.log('Mastra API URL:', baseUrl);

/**
 * Format RAG response with citations
 */
function formatRAGResponse(text: string, sources: any[] = []): { formattedText: string; citations: string[] } {
  const citations: string[] = [];
  
  // Extract citations from the text
  const citationRegex = /\[Source:\s*([^\]]+)\]/g;
  let match;
  while ((match = citationRegex.exec(text)) !== null) {
    const citation = match[1].trim();
    if (!citations.includes(citation)) {
      citations.push(citation);
    }
  }
  
  // Add sources from response data
  if (sources && sources.length > 0) {
    sources.forEach(source => {
      const citation = source.pageNumber 
        ? `${source.filename}, Page ${source.pageNumber}` 
        : source.filename;
      if (citation && !citations.includes(citation)) {
        citations.push(citation);
      }
    });
  }
  
  return {
    formattedText: text,
    citations
  };
}

export async function POST(request: NextRequest) {
  try {
    const { messages, agentId = 'weatherAgent', context } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Check if this is a document-aware agent
    const isDocumentAgent = DOCUMENT_AGENTS.includes(agentId);

    // Get authenticated headers using OAuth 2.0 client credentials
    // Use document scopes for document agents
    const authHeaders = isDocumentAgent 
      ? await getAgentWithDocsHeaders()
      : await getAuthHeaders();
    
    console.log(`Using OAuth 2.0 authentication for agent: ${agentId} (document: ${isDocumentAgent})`);

    // Create authenticated Mastra client
    const mastraClient = new MastraClient({
      baseUrl,
      headers: authHeaders
    });

    // Get the specified agent from the Mastra server
    const agent = mastraClient.getAgent(agentId);
    
    // Build generate options
    const generateOptions: any = {};
    if (context) {
      generateOptions.context = context;
    }
    
    // Generate response from the agent
    let response;
    if (Object.keys(generateOptions).length > 0) {
      response = await agent.generateVNext(messages, generateOptions);
    } else {
      response = await agent.generateVNext(messages);
    }

    // Process RAG response if from document agent
    let formattedText = response.text || 'Sorry, I couldn\'t process that request.';
    let citations: string[] = [];
    
    if (isDocumentAgent && response.text) {
      const formatted = formatRAGResponse(response.text, response.sources);
      formattedText = formatted.formattedText;
      citations = formatted.citations;
    }

    return NextResponse.json({
      text: formattedText,
      success: true,
      agentId,
      ...(isDocumentAgent && {
        isRAGResponse: true,
        citations,
        sourcesFound: citations.length > 0,
      }),
    });

  } catch (error: any) {
    console.error(`Error communicating with agent:`, error);
    
    // Check if it's an authentication error
    if (error.message.includes('401') || error.message.includes('403') || error.message.includes('invalid_client')) {
      return NextResponse.json(
        { 
          error: 'Authentication failed. Please check client credentials.',
          success: false
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to communicate with agent service',
        success: false,
        details: error.message
      },
      { status: 500 }
    );
  }
}

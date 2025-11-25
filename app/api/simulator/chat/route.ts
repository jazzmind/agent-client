import { NextRequest, NextResponse } from 'next/server';
import { MastraClient } from "@mastra/client-js";

const baseUrl = process.env.MASTRA_API_URL || 'https://agent-sundai.vercel.app';

// Document-aware agents that need special context
const DOCUMENT_AGENTS = ['documentAgent', 'ragChatAgent', 'rfp-analysis-agent', 'rfp-analyzer-agent'];

/**
 * Format RAG response with citations
 * Extracts source information from the response and formats it nicely
 */
function formatRAGResponse(text: string, sources: any[] = []): { formattedText: string; citations: string[] } {
  const citations: string[] = [];
  
  // Extract citations from the text (format: [Source: filename.pdf, Page X])
  const citationRegex = /\[Source:\s*([^\]]+)\]/g;
  let match;
  while ((match = citationRegex.exec(text)) !== null) {
    const citation = match[1].trim();
    if (!citations.includes(citation)) {
      citations.push(citation);
    }
  }
  
  // If we have source data passed in, add those too
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
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { agentId, messages, context } = await request.json();

    if (!agentId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Agent ID and messages array are required' },
        { status: 400 }
      );
    }

    // Check if this is a document-aware agent
    const isDocumentAgent = DOCUMENT_AGENTS.includes(agentId);
    
    // Create authenticated Mastra client
    const mastraClient = new MastraClient({
      baseUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    try {
      // Get the specified agent
      const agent = mastraClient.getAgent(agentId);
      
      // Build the generate options
      const generateOptions: any = {};
      
      // For document agents, include the user's token in the context
      // so the agent can use it for document search
      if (isDocumentAgent) {
        generateOptions.context = {
          ...context,
          userAuthToken: token,
        };
      } else if (context) {
        generateOptions.context = context;
      }
      
      // Generate response from the agent
      // Pass messages and options if we have document context
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
        // Include RAG-specific metadata for document agents
        ...(isDocumentAgent && {
          isRAGResponse: true,
          citations,
          sourcesFound: citations.length > 0,
        }),
      });

    } catch (mastraError: any) {
      console.error('Mastra client error:', mastraError);
      
      // Fallback: try direct API call to the agent server
      const requestBody: any = { messages };
      
      // Include context for document agents
      if (isDocumentAgent) {
        requestBody.context = {
          ...context,
          userAuthToken: token,
        };
      }
      
      const response = await fetch(`${baseUrl}/admin/agents/${agentId}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Agent server error: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      
      // Process RAG response
      let formattedText = data.text || data.response || 'Sorry, I couldn\'t process that request.';
      let citations: string[] = [];
      
      if (isDocumentAgent && formattedText) {
        const formatted = formatRAGResponse(formattedText, data.sources);
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
    }

  } catch (error: any) {
    console.error('Error communicating with agent:', error);
    
    // Check if it's an authentication error
    if (error.message.includes('401') || error.message.includes('403') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { 
          error: 'Authentication failed. Please check your credentials.',
          success: false
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to communicate with agent',
        success: false,
        details: error.message
      },
      { status: 500 }
    );
  }
}

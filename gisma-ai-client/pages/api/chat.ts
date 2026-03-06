// This API endpoint is now deprecated in favor of WebSocket communication
// The chat functionality has been moved to WebSocket for real-time communication
export const config = {
  runtime: 'edge',
};

const handler = async (_req: Request): Promise<Response> => {
  return new Response(
    JSON.stringify({ 
      error: 'This endpoint is deprecated. Please use WebSocket connection for chat functionality.' 
    }), 
    { 
      status: 410, // Gone
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};

export default handler;

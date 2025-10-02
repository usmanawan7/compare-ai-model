export interface AppConfig {
  port: number;
  nodeEnv: string;
  mongodb: {
    uri: string;
  };
  apiKeys: {
    openai: string;
    anthropic: string;
    xai: string;
  };
  websocket: {
    port: number;
  };
  cors: {
    origin: string[];
  };
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/multi-model-ai-playground',
  },
  apiKeys: {
    openai: process.env.OPENAI_API_KEY || '',
    anthropic: process.env.ANTHROPIC_API_KEY || '',
    xai: process.env.XAI_API_KEY || '',
  },
  websocket: {
    port: parseInt(process.env.WEBSOCKET_PORT || '3000', 10),
  },
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3001'],
  },
});


export interface GoogleChatUser {
  name: string;
  displayName: string;
  avatarUrl: string;
  email: string;
}

export interface GoogleChatSpace {
  name: string;
  type: 'ROOM' | 'DM';
  displayName?: string;
}

// Based on actual payload observation
export interface GoogleChatEvent {
  commonEventObject: {
    userLocale: string;
    hostApp: string;
    platform: string;
    timeZone: { id: string; offset: number };
  };
  chat?: {
    user?: {
      name: string;
      displayName: string;
      email: string;
      type: string;
    };
    messagePayload?: {
      message: {
        name: string;
        sender: {
          name: string;
          displayName: string;
          email: string;
          type: string;
        };
        createTime: string;
        text: string;
        argumentText?: string;
        formattedText?: string;
        space: {
          name: string;
          displayName?: string;
          type: string;
        };
      };
    };
    space?: {
        name: string;
        type: string;
    }
  };
  // Fallback for flat structure if used elsewhere or legacy
  type?: string; 
  message?: any;
  space?: any;
}

export interface GoogleChatResponse {
  text?: string;
  cards?: any[];
}

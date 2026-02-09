
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

export interface GoogleChatEvent {
  type: 'MESSAGE' | 'ADDED_TO_SPACE' | 'REMOVED_FROM_SPACE';
  eventTime: string;
  space: GoogleChatSpace;
  message?: {
    name: string;
    sender: GoogleChatUser;
    createTime: string;
    text: string;
    argumentText?: string;
  };
  user?: GoogleChatUser;
}

export interface GoogleChatResponse {
  text?: string;
  cards?: any[];
}

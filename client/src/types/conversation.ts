export interface UserPublic {
  id: string;
  fullName: string;
  email: string;
}

export interface Participant {
  user: UserPublic;
}

export interface Conversation {
  id: string;
  type: "PRIVATE" | "GROUP";
  participants: Participant[];
}

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: UserPublic;
}



/**
 * it is a shared folder 
 * 
 */
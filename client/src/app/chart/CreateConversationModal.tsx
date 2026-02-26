import {useEffect,useState} from "react";
import { createPrivateConversation,createGroupConversation } from "../../lib/api";
import {type UserPublic, type Conversation } from "../../types/conversation";


interface CreateConversationModalProps{
    workspaceId:string;
    onClose:()=>void;
    onConversationCreated:(conversation:Conversation)=>void;
}

export const CreateConversationModal = ({workspaceId,onClose,onConversationCreated}:CreateConversationModalProps) =>{
    const [users,setusers]=useState<UserPublic[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");


}

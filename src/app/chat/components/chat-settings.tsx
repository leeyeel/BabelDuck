'use client'
import { createContext } from "react";
import { LocalChatSettings } from "../lib/chat";

// just to avoid circular dependency
export const ChatSettingsContext = createContext<LocalChatSettings | null>(null);

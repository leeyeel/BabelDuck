
import { chatIntelligenceSettingsRecord } from "./intelligence"

export function _getDefaultChatIntelligencesFromLocalStorage(): chatIntelligenceSettingsRecord[] {
    const defaultIntelligences = localStorage.getItem('defaultChatIntelligences')
    if (defaultIntelligences) {
        return JSON.parse(defaultIntelligences)
    }
    return []
}

export function _saveDefaultChatIntelligencesToLocalStorage(intelligences: chatIntelligenceSettingsRecord[]) {
    localStorage.setItem('defaultChatIntelligences', JSON.stringify(intelligences))
}
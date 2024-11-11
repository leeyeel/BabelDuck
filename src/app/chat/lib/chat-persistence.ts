export type ChatSettingsStoreRecord = {
    rawInputHandlers: string[],
    ChatISettings: {
        id: string
        settings: object
    }
}

export function loadChatSettingsData(settingsID: string): ChatSettingsStoreRecord | undefined {
    const payloadJSON = localStorage.getItem(settingsID);
    if (!payloadJSON) {
        return undefined;
    }
    const record: ChatSettingsStoreRecord = JSON.parse(payloadJSON);
    return record;
}

export function setChatSettingsData(settingsID: string, payload: ChatSettingsStoreRecord): void {
    localStorage.setItem(settingsID, JSON.stringify(payload));
}


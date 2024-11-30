import { configureStore } from '@reduxjs/toolkit'
import { chatSelectionListReducer } from './chat/components/chatList'
import { currentChatSettingsReducer } from './chat/components/chat'
import { tutorialStateReducer } from './chat/components/tutorial-input'

const store = configureStore({
  reducer: {
    chatSelectionList: chatSelectionListReducer,
    currentChatSettings: currentChatSettingsReducer,
    tutorialState: tutorialStateReducer,
  },
})

export default store
// Infer the `RootState`,  `AppDispatch`, and `AppStore` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store

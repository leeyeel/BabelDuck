import { useTranslation } from "react-i18next"
import { Message, OpenAILikeMessage } from "../lib/message"
import { messageAddedCallbackOptions } from "./chat"
import { ChatSettingsContext } from "./chat-settings"
import { MsgListSwitchSignal } from "./input"
import { useContext, useEffect, useRef, useState } from "react"
import { SpecialRoles, TextMessage } from "./message"
import { LuUserCog2 } from "react-icons/lu"
import { FaBackspace, FaMicrophone } from "react-icons/fa"
import Switch from "react-switch"
import { Tooltip } from "react-tooltip"
import { PayloadAction } from "@reduxjs/toolkit"
import { createSlice } from "@reduxjs/toolkit"
import { useAppDispatch, useAppSelector } from "@/app/hooks"
import { NonInteractiveTutorialMessage, IdentifiedTextMessage, QueClickOnTranslationMsg as IndicateUsersToClickTranslationMsg, NextStepTutorialMessage } from "./tutorial-message"
import { diffChars } from "diff"
import { TmpFilledButton, TmpTransparentButton } from "@/app/ui-utils/components/button"
import { LiaComments } from "react-icons/lia"
import { TransparentOverlay } from "@/app/ui-utils/components/overlay"
import { PiKeyReturnBold } from "react-icons/pi"

export function TutorialInput(
    { msgListSwitchSignal, addMessage, updateMessage, updateInputSettingsPayload, revisionMessage }: {
        allowEdit: boolean
        msgListSwitchSignal: MsgListSwitchSignal
        updateMessage: (message: Message) => void
        addMessage: (message: Message, opts: messageAddedCallbackOptions) => void
        updateInputSettingsPayload: (payload: object) => void
        revisionMessage: [Message, boolean] | undefined // Updated when a revision is provided, initialized as undefined
        rejectionSignal: number, // Signal to indicate rejection of a revision
    }
) {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();

    // TODO bug: Occasional issue - ReferenceError: Cannot access 'ChatSettingsContext' before initialization
    // Steps to reproduce: After updating the code, it seems to trigger when switching conversations and then switching back to the tutorial
    // Sometimes by simply clicking "Confirm" in the initializaiton panel, the issue will show up
    const chatSettings = useContext(ChatSettingsContext)
    const storedTutorialStateID = (chatSettings?.inputComponent.payload as { stateID: TutorialStateIDs | undefined }).stateID

    const currentTutorialState = useAppSelector(state => state.tutorialState);

    const defaultRole = SpecialRoles.USER
    const [msg, setMsg] = useState<TextMessage>(new TextMessage(defaultRole, ''))
    // Sync msg changes to the parent component
    useEffect(() => {
        updateMessage(msg)
    }, [msg, updateMessage])

    // update msg when a generated/modified message is provided
    useEffect(() => {
        if (revisionMessage && revisionMessage[0] instanceof TextMessage && revisionMessage[1]) {
            setMsg(revisionMessage[0]);
            textAreaRef.current?.focus() // After the revision is applied, for convenience, focus the text area for the user to continue typing
        }
    }, [msg.content, revisionMessage])

    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const inputDivRef = useRef<HTMLDivElement>(null);

    function handleSend(msg: TextMessage, callbackOpts: messageAddedCallbackOptions = { generateAssistantMsg: true }) {
        if (currentTutorialState.stateID !== TutorialStateIDs.indicateToSendMsg) {
            return;
        }
        if (msg.content.trim() === "") return;
        addMessage(new IdentifiedTextMessage('users-translated-msg', msg.role, msg.content), callbackOpts);
        setMsg(prev => new TextMessage(prev.role, ''));
        textAreaRef.current?.focus();
        dispatch(setTutorialState({ stateID: TutorialStateIDs.clickNextToIllustrateGrammarCheck }))
    }

    useEffect(() => {
        dispatch(setTutorialState({ stateID: storedTutorialStateID }))
        return () => {
            dispatch(setTutorialState({ stateID: undefined }))
        }
    }, [dispatch])

    useEffect(() => {
        if (currentTutorialState.stateID === TutorialStateIDs.introduceQuickTranslationInstructions) {
            if ((chatSettings?.inputComponent.payload as { stateID: TutorialStateIDs | undefined }).stateID !== TutorialStateIDs.introduceQuickTranslationInstructions) {
                // 与 chatSettings 不同里的阶段不同，说明是刚刚由上一个阶段切换过来的，只有这种情况需要触发这些增量副作用，并更新 chatSettings 里的 stateID
                updateInputSettingsPayload({ stateID: TutorialStateIDs.introduceQuickTranslationInstructions })
                addMessage(
                    new NextStepTutorialMessage(TutorialStateIDs.introduceQuickTranslationInstructions, TutorialStateIDs.indicateUsersToClickTranslation),
                    { generateAssistantMsg: false }
                )
            }
        }
        if (currentTutorialState.stateID === TutorialStateIDs.indicateUsersToClickTranslation) {
            if ((chatSettings?.inputComponent.payload as { stateID: TutorialStateIDs | undefined }).stateID !== TutorialStateIDs.indicateUsersToClickTranslation) {
                updateInputSettingsPayload({ stateID: TutorialStateIDs.indicateUsersToClickTranslation })
                addMessage(
                    new IndicateUsersToClickTranslationMsg(),
                    { generateAssistantMsg: false }
                )
            }
            // setMsg 属于幂等操作，且 msg 未持久化，需固定触发
            setMsg(new IdentifiedTextMessage('tutorial-input-msg', defaultRole, '东西有点多，我晚点提炼一下'))
        }
        if (currentTutorialState.stateID === TutorialStateIDs.indicateUsersToGoBack) {
            addMessage(new TextMessage(SpecialRoles.USER, '这里可以用 extract 吗?'), { generateAssistantMsg: false })
            addMessage(new TextMessage(SpecialRoles.ASSISTANT, 'extract 虽然也有"提取"的意思，但在这个会议场景下不是最佳选择。让我解释一下原因：\n……（略）'), { generateAssistantMsg: false })
            addMessage(new NonInteractiveTutorialMessage('就像上面这样，并且在子对话中的讨论不会影响上一层对话。\n\n现在我们要结束子对话，点击下左侧的 ">" 按钮，即可返回上一层对话。'), { generateAssistantMsg: false })
        }
        if (currentTutorialState.stateID === TutorialStateIDs.clickNextToIllustrateGrammarCheck) {
            if ((chatSettings?.inputComponent.payload as { stateID: TutorialStateIDs | undefined }).stateID !== TutorialStateIDs.clickNextToIllustrateGrammarCheck) {
                updateInputSettingsPayload({ stateID: TutorialStateIDs.clickNextToIllustrateGrammarCheck })
            }
        }
        if (currentTutorialState.stateID === TutorialStateIDs.illustrateGrammarCheck) {
            if ((chatSettings?.inputComponent.payload as { stateID: TutorialStateIDs | undefined }).stateID !== TutorialStateIDs.illustrateGrammarCheck) {
                updateInputSettingsPayload({ stateID: TutorialStateIDs.illustrateGrammarCheck })
                addMessage(new NextStepTutorialMessage(TutorialStateIDs.illustrateGrammarCheck, TutorialStateIDs.illustrateCustomInstructions), { generateAssistantMsg: false })
            }
        }
        if (currentTutorialState.stateID === TutorialStateIDs.illustrateCustomInstructions) {
            if ((chatSettings?.inputComponent.payload as { stateID: TutorialStateIDs | undefined }).stateID !== TutorialStateIDs.illustrateCustomInstructions) {
                updateInputSettingsPayload({ stateID: TutorialStateIDs.illustrateCustomInstructions })
                addMessage(new NextStepTutorialMessage(TutorialStateIDs.illustrateCustomInstructions, TutorialStateIDs.endingSummary), { generateAssistantMsg: false })
            }
        }
        if (currentTutorialState.stateID === TutorialStateIDs.endingSummary) {
            if ((chatSettings?.inputComponent.payload as { stateID: TutorialStateIDs | undefined }).stateID !== TutorialStateIDs.endingSummary) {
                updateInputSettingsPayload({ stateID: TutorialStateIDs.endingSummary })
                addMessage(new NonInteractiveTutorialMessage('有了自定义快捷指令，你便可以根据自身需求，打造一套属于自己的工具链：\n\n'
                    + '- 比如在模拟面试中让 AI 协助回答不会的问题，无需切换到其他窗口查询资料；\n'
                    + '- 或者让 AI 提炼句子中的短语，并提供一些同义词，扩充自己的词汇量；\n'
                    + '- 甚至在未来的更新中，你还将能够通过快捷指令与外部系统进行联动，例如自动将词汇添加到生词本，等等。\n\n'
                    + '至此，我们便完成了对快捷指令功能的基本介绍，另外为了简化教程，我们在教程中还省略了语音输入、消息编辑、对话配置等功能的介绍，你现在可以尝试新建一个普通的对话，来体验这些功能了。\n\n'
                    + '本教程到此便结束了，希望你能有所收获，并期待你的反馈！'
                ), { generateAssistantMsg: false })
            }
        }
    }, [defaultRole, currentTutorialState.stateID])

    useEffect(() => {
        if (msgListSwitchSignal.type === 'switchChat' || msgListSwitchSignal.type === 'followUpDiscussion') {
            setMsg(new TextMessage(defaultRole, ''))
            setTimeout(() => {
                textAreaRef.current?.focus()
            }, 100);
        }
        if (msgListSwitchSignal.type === 'followUpDiscussion' &&
            currentTutorialState.stateID === TutorialStateIDs.startFollowUpDiscussion) {
            addMessage(
                new NextStepTutorialMessage(TutorialStateIDs.startFollowUpDiscussion, TutorialStateIDs.indicateUsersToGoBack),
                { generateAssistantMsg: false }
            )
        }
    }, [defaultRole, msgListSwitchSignal])

    return <div ref={inputDivRef} tabIndex={0} className="flex flex-col focus:outline-none"
        onKeyUp={
            (e) => {
                if (e.key === 'Enter') { handleSend(msg) }
            }
        }
    >
        {/* Text input and preview area */}
        <textarea
            id='tutorial-input-textarea'
            className={`flex-1 p-4 resize-none focus:outline-none cursor-default`}
            ref={textAreaRef}
            placeholder={t('Free input is temporarily not supported in this tutorial')}
            value={msg.content}
            readOnly={true} rows={2} />
        <Tooltip anchorSelect="#tutorial-input-textarea" isOpen={currentTutorialState.stateID === TutorialStateIDs.indicateToSendMsg} delayShow={100} delayHide={0} place="left" style={{ borderRadius: '0.75rem' }}>
            {t('Press Enter to send your message')}
        </Tooltip>
        {/* Bottom Bar */}
        <div className="flex flex-row items-center justify-between">
            {/* current message role */}
            <div className="relative flex flex-row rounded-full hover:bg-gray-300 invisible">
                <div className="flex flex-row p-1 px-3 cursor-default">
                    <LuUserCog2 className="mr-2" size={25} /> <span className="font-bold">{msg.role}</span>
                </div>
            </div>
            {/* voice control buttons */}
            <div className="flex flex-row items-center">
                <label id="voice-mode-label" className="flex items-center mr-2 cursor-not-allowed">
                    <span className="mr-1">{t('Voice Mode')}</span>
                    <Switch checked={false} onChange={() => { }} className="mr-2" width={28} height={17} uncheckedIcon={false} checkedIcon={false} onColor="#000000" />
                </label>
                <Tooltip
                    anchorSelect="#voice-mode-label"
                    delayShow={100}
                    delayHide={0}
                    place="top"
                    style={{ borderRadius: '0.75rem' }}
                >{t('voiceModeNotSupportedInTutorial')}</Tooltip>
                <button
                    id="recording-button"
                    className="rounded-full bg-black hover:bg-gray-700 focus:outline-none cursor-not-allowed"
                    onClick={() => { }}
                >
                    <div className="flex items-center justify-center w-16 h-8">
                        <FaMicrophone size={17} color="white" />
                    </div>
                </button>
                <Tooltip
                    anchorSelect="#recording-button" delayShow={100} delayHide={0} place="top" style={{ borderRadius: '0.75rem' }}
                >{t('recordingNotSupportedInTutorial')}</Tooltip>
            </div>
        </div>
    </div>
}

// ==================== redux ====================

export enum TutorialStateIDs {
    introduction = 'introduction', // init
    introduceQuickTranslationInstructions = 'introduceQuickTranslationInstructions', // introduce quick instruction
    indicateUsersToClickTranslation = 'indicateUsersToClickTranslation', // cueing users to click on Translation icon
    startFollowUpDiscussion = 'startFollowUpDiscussion', // start follow up discussion
    indicateUsersToGoBack = 'indicateUsersToGoBack', // indicate users to go back
    indicateToSendMsg = 'indicateToSendMsg', // indicate users to press Enter to send msg
    clickNextToIllustrateGrammarCheck = 'clickNextToIllustrateGrammarCheck', // click next to illustrate grammar check
    illustrateGrammarCheck = 'illustrateGrammarCheck',
    illustrateCustomInstructions = 'illustrateCustomInstructions',
    endingSummary = 'endingSummary',
}

const initTutorialState: {
    stateID: TutorialStateIDs | undefined
} = {
    stateID: undefined
}
const tutorialStateSlice = createSlice({
    name: 'tutorialState',
    initialState: initTutorialState,
    reducers: {
        setTutorialState: (state, newState: PayloadAction<{ stateID: TutorialStateIDs | undefined }>) => {
            state.stateID = newState.payload.stateID
        }
    }
})

export const { setTutorialState } = tutorialStateSlice.actions
export const tutorialStateReducer = tutorialStateSlice.reducer

export function TutorialDiffView(
    { originalMsg, revisedMsg, approveRevisionCallback, rejectRevisionCallback, allowFollowUpDiscussion, startFollowUpDiscussion, style, className = "" }: {
        originalMsg: Message;
        revisedMsg: Message;
        allowFollowUpDiscussion: boolean;
        approveRevisionCallback: (revisedText: string) => void;
        rejectRevisionCallback: () => void;
        startFollowUpDiscussion: (messageToRevise: Message, revisedText: Message) => void;
        className?: string;
        style: object;
    }
) {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();

    const newText = (revisedMsg as unknown as OpenAILikeMessage).toOpenAIMessage().content
    const originalText = (originalMsg as unknown as OpenAILikeMessage).toOpenAIMessage().content

    const changes = diffChars(originalText, newText);
    const hasOnlyAdditions = changes.every(change => !change.removed);
    const [showDiff, setShowDiff] = useState(!hasOnlyAdditions);

    const [blurText, setBlurText] = useState(false);

    const [tutorialPhase, setTutorialPhase] = useState<
        'text-introduction'
        | 'approve-reject-introduction'
        | 'edit-introduction'
        | 'follow-up-discussion-introduction'
        | 'approve-introduction'
    >('text-introduction')

    const tutorialState = useAppSelector(state => state.tutorialState);
    useEffect(() => {
        if (tutorialState.stateID === TutorialStateIDs.indicateUsersToGoBack) {
            setTutorialPhase('approve-introduction')
        }
    }, [tutorialState.stateID])

    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.focus();
        }
    }, []);

    return (
        <>
            <div className={`p-4 pb-2 rounded-lg border-2 shadow-md focus:outline-none ${className}`} style={style}
                tabIndex={0} ref={containerRef}>
                {changes.length > 0 && (
                    <div className="flex flex-col relative">
                        <TransparentOverlay onClick={() => { }} />
                        {/* 文本显示区域 */}
                        <div className="mb-4" id="tutorial-diff-view-text">
                            <div className={`${blurText ? 'blur-sm' : ''}`}>
                                {showDiff ? (
                                    changes.map((change, index) => (
                                        <span key={index} className={`${change.added ? 'bg-green-200' : change.removed ? 'bg-red-200 line-through text-gray-500' : ''}`}>
                                            {change.value}
                                        </span>
                                    ))
                                ) : (
                                    <div className="whitespace-pre-wrap break-words">
                                        {newText}
                                    </div>
                                )}
                            </div>
                        </div>
                        <Tooltip className="z-50" anchorSelect="#tutorial-diff-view-text" isOpen={tutorialPhase === 'text-introduction'} clickable delayShow={500} delayHide={0} place="top" style={{ borderRadius: '0.75rem' }}>
                            <div className="flex flex-col items-start">
                                <span>{'弹窗中即 AI 提供的翻译结果，与普通网页翻译工具不同的是，快捷指令会结合对话上下文，给出更符合当前语境的建议。'}</span>
                                <span className="mb-2">{'例如在这个场景下，你不需要担心 AI 会以为你说的是什么化学物质的提炼，而是根据“会议”这个上下文来翻译。'}</span>
                                <TmpFilledButton className="self-end py-0 px-2 mr-2 rounded-md text-[13px] border border-white"
                                    onClick={() => setTutorialPhase('approve-reject-introduction')}
                                >{t('Next Step')}</TmpFilledButton>
                            </div>
                        </Tooltip>
                        {/* 按钮和其他控件 */}
                        <div className="flex flex-row justify-between items-center">
                            {/* 左侧控制项 */}
                            <div className="flex flex-row items-center">
                                {/* show diff */}
                                <span className="mr-1 text-sm text-gray-600">{t('Show Diff')}</span>
                                <Switch
                                    checked={showDiff}
                                    onChange={setShowDiff}
                                    width={28}
                                    height={17}
                                    uncheckedIcon={false}
                                    checkedIcon={false}
                                    disabled={false}
                                    className="mr-2"
                                    onColor="#000000"
                                />
                                {/* blur text */}
                                <>
                                    <span className="mr-1 text-sm text-gray-600">{t('Blur Text')}</span>
                                    <Switch
                                        checked={blurText}
                                        onChange={setBlurText}
                                        width={28}
                                        height={17}
                                        uncheckedIcon={false}
                                        checkedIcon={false}
                                        className="mr-2"
                                        onColor="#000000"
                                    />
                                </>
                            </div>
                            {/* 右侧操作按钮 */}
                            <div className="flex flex-row">
                                <div className={`flex flex-row p-1 rounded-lg ${tutorialPhase === 'approve-reject-introduction' && 'border border-gray-200'}`} id='approve-and-reject-buttons'>
                                    {/* 采纳按钮 */}
                                    <div id='approve-button' className={`${tutorialPhase === 'approve-introduction' && 'z-50'}`}>
                                        <TmpFilledButton
                                            className={`py-0 px-2 mr-2 rounded-md text-[13px]`}
                                            onClick={() => {
                                                approveRevisionCallback(newText);
                                                dispatch(setTutorialState({ stateID: TutorialStateIDs.indicateToSendMsg }));
                                            }}
                                        >
                                            <PiKeyReturnBold className="inline-block mr-1" size={20} color="white" /> {t('Approve')}
                                        </TmpFilledButton>
                                    </div>
                                    <Tooltip className="z-50" anchorSelect="#approve-button" isOpen={tutorialPhase === 'approve-introduction'} clickable delayShow={100} delayHide={0} place="bottom" style={{ borderRadius: '0.75rem' }}>
                                        <div className="flex flex-col items-start">
                                            <span>{'现在，点击 「采纳」 按钮，采纳 AI 提供的结果。'}</span>
                                        </div>
                                    </Tooltip>
                                    <TmpTransparentButton
                                        className="py-0 px-1 mr-2 rounded-lg text-gray-500 text-[15px]"
                                        onClick={() => { return; rejectRevisionCallback(); }}
                                    >
                                        <FaBackspace className="inline-block mr-1" color="6b7280" /> {t('Reject')}
                                    </TmpTransparentButton>
                                </div>
                                <Tooltip className="z-50" anchorSelect="#approve-and-reject-buttons" isOpen={tutorialPhase === 'approve-reject-introduction'} clickable delayShow={100} delayHide={0} place="bottom" style={{ borderRadius: '0.75rem' }}>
                                    <div className="flex flex-col items-start">
                                        <span>{'如果你对快捷指令返回的结果满意，可以点击“采纳”按钮，或按 Enter 键，将结果填入到输入框中。'}</span>
                                        <span className="mb-2">{'如果不想采纳，则点击“取消”按钮，或按 Backspace 键，取消本次修改。（当前在教程模式中，暂时不可操作）'}</span>
                                        <TmpFilledButton className="self-end py-0 px-2 mr-2 rounded-md text-[13px] border border-white"
                                            onClick={() => setTutorialPhase('follow-up-discussion-introduction')}
                                        >{t('Next Step')}</TmpFilledButton>
                                    </div>
                                </Tooltip>
                                {allowFollowUpDiscussion &&
                                    <>
                                        <button id='follow-up-discussion-button'
                                            className={`mr-2 py-0 px-1 rounded-lg text-[15px] text-gray-500 ${tutorialPhase === 'follow-up-discussion-introduction' && 'z-50'}`}
                                            onClick={() => {
                                                dispatch(setTutorialState({ stateID: TutorialStateIDs.startFollowUpDiscussion }));
                                                startFollowUpDiscussion(originalMsg, new TextMessage(revisedMsg.role, newText));
                                            }}
                                        >
                                            <LiaComments className="inline-block mr-1" color="6b7280" /> {t('Follow-up discussions')}
                                        </button>
                                        <Tooltip className="z-50" anchorSelect="#follow-up-discussion-button" isOpen={tutorialPhase === 'follow-up-discussion-introduction'} clickable delayShow={100} delayHide={0} place="bottom" style={{ borderRadius: '0.75rem' }}>
                                            <div className="flex flex-col items-start">
                                                <span>{'如果你对 AI 返回的结果不满意或者有其他疑问，可以进一步追问或讨论。现在点击一下看看效果。'}</span>
                                            </div>
                                        </Tooltip>
                                    </>
                                }
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

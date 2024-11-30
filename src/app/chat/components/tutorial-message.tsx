import { useTranslation } from "react-i18next";
import { Message } from "../lib/message";
import { RoleV2, SpecialRoles, TextMessage } from "./message";
// import { PiStudentFill } from "react-icons/pi";
import { FaGraduationCap } from "react-icons/fa6";
import { Tooltip } from "react-tooltip";
import { TmpFilledButton } from "@/app/ui-utils/components/button";
import { useAppSelector } from "@/app/hooks";
import { useAppDispatch } from "@/app/hooks";
import { TutorialStateIDs } from "./tutorial-input";
import { setTutorialState } from "./tutorial-input";
import { GoDependabot } from "react-icons/go";
import { GrSystem } from "react-icons/gr";
import { useContext } from "react";
import { ChatSettingsContext } from "./chat";
import Image from "next/image";

// // export function RoleV2({ name, className }: { name: string, className?: string }) {
//     const tooltipId = `role-tooltip-${Math.random().toString(36).substring(2, 11)}`;

//     return (
//         <>
//             <div
//                 id={tooltipId}
//                 className={`rounded-full w-8 h-8 mt-1 border-gray-200 flex items-center justify-center text-gray-600 transition-colors ${className}`}
//             >
//                 {name === SpecialRoles.TUTORIAL ? (
//                     <FaGraduationCap size={20} />
//                 ) : name === SpecialRoles.ASSISTANT ? (
//                     <GoDependabot size={20} />
//                 ) : name === SpecialRoles.SYSTEM ? (
//                     <GrSystem size={17} />
//                 ) : (
//                     <span className="text-sm">{name.charAt(0).toUpperCase()}</span>
//                 )}
//             </div>
//             {name !== SpecialRoles.TUTORIAL && <Tooltip
//                 anchorSelect={`#${tooltipId}`} content={name} delayShow={100} delayHide={0} place="top" style={{ borderRadius: '0.75rem' }}
//             />}
//         </>
//     );
// // }

abstract class TutorialMessageBase extends Message {

    abstract component(): ({ }: { message: Message; messageID: number; updateMessage: (messageID: number, message: Message) => void; className?: string; }) => JSX.Element

    constructor(type: string) {
        super(type, SpecialRoles.TUTORIAL, true, false)
    }

    serialize(): string {
        return JSON.stringify({
            type: this.type,
        })
    }

    isEmpty(): boolean {
        return false
    }
}

export class NonInteractiveTutorialMessage extends TutorialMessageBase {
    content: string
    static _type = 'non-interactive-tutorial'

    constructor(content: string) {
        super(NonInteractiveTutorialMessage._type)
        this.content = content
    }
    component(): ({ }: { message: Message; messageID: number; updateMessage: (messageID: number, message: Message) => void; className?: string; }) => JSX.Element {
        return NonInteractiveTutorialMessageComponent
    }
    serialize(): string {
        return JSON.stringify({
            type: this.type,
            content: this.content
        })
    }
    static deserialize(serialized: string): NonInteractiveTutorialMessage {
        const { content } = JSON.parse(serialized);
        return new NonInteractiveTutorialMessage(content);
    }
}

function NonInteractiveTutorialMessageComponent({ message: unTypedMsg, className }: { message: Message, messageID: number, updateMessage: (messageID: number, message: Message) => void, className?: string }) {
    const { t } = useTranslation()
    const message = unTypedMsg as NonInteractiveTutorialMessage
    // const dispatch = useAppDispatch();
    // const tutorialState = useAppSelector(state => state.tutorialState);
    // const chatSettings = useContext(ChatSettingsContext)

    // TODO i18n
    return <div className={`flex flex-row ${className}`}>
        <RoleV2 className="mr-3" name={message.role} />
        <div className={`bg-[#F6F5F5] rounded-xl w-fit max-w-[80%] p-4 flex flex-col ${className}`}>
            <div className="mb-2" dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, '<br />') }} />
        </div>
    </div>
}

export class NextStepTutorialMessage extends TutorialMessageBase {
    static _type = 'next-step-tutorial'
    currentStateID: TutorialStateIDs
    nextStateID: TutorialStateIDs
    constructor(currentStateID: TutorialStateIDs, nextStateID: TutorialStateIDs) {
        super(NextStepTutorialMessage._type)
        this.currentStateID = currentStateID
        this.nextStateID = nextStateID
    }
    component(): ({ }: { message: Message; messageID: number; updateMessage: (messageID: number, message: Message) => void; className?: string; }) => JSX.Element {
        return NextStepTutorialMessageComponent
    }
    contentNode(): React.ReactNode {
        if (this.currentStateID === TutorialStateIDs.introduction) {
            const content = "BabelDuck 是一个 XX ，旨在降低语言练习门槛的 AI 对话应用。除了普通的 AI 对话聊天能力外，我们还提供了一系列为口语练习场景而设计的工具，本教程将为你简单介绍如何使用它们。若你更倾向于自行摸索，可以点击左下角「新建对话」，即可开始体验，之后你依然随时可以回来继续该教程。"
            return <div className="mb-2" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
        }
        if (this.currentStateID === TutorialStateIDs.introduceQuickTranslationInstructions) {
            const content = "BabelDuck 提供了一系列快捷指令，协助用户在口语表达上遇到困难时更流畅地推进对话。\n"
                + "比如有些人练习初期很容易遇到“卡壳”的情况，完全不知道某句话该如何表达时，不得不切出去寻求其他工具的帮助。为此系统内置了一个快捷指令，作为初期过渡工具用，允许你先用母语表达一遍，然后帮你转换为对应语言。\n\n接下来我们简单演示下使用方法"
            return <div className="mb-2" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
        }
        if (this.currentStateID === TutorialStateIDs.startFollowUpDiscussion) {
            const content = "在子对话中，你可以在当前对话的基础上，向 AI 追问更多问题。"
            return <div className="mb-2" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
        }
        if (this.currentStateID === TutorialStateIDs.clickNextToIllustrateGrammarCheck) {
            const paragraph1 = "以上便是 BabelDuck 中对于其中一个快捷指令的基本使用流程，除此之外，我们还提供了其他一系列快捷指令。"
            return <div className="mb-2" dangerouslySetInnerHTML={{ __html: paragraph1.replace(/\n/g, '<br />') }} />
        }
        if (this.currentStateID === TutorialStateIDs.illustrateGrammarCheck) {
            const paragraph1 = "比如常见的语法纠正需求，我们也内置了快捷指令，效果如下。\n\n"
            const paragraph2 = "更重要的是，我们还支持你根据自身需求自定义快捷指令。"
            return <div className="mb-2" dangerouslySetInnerHTML={{ __html: (paragraph1 + paragraph2).replace(/\n/g, '<br />') }} />
        }
        if (this.currentStateID === TutorialStateIDs.illustrateCustomInstructions) {
            const paragraph1 = "比如当你的口语已经达到了一定的流畅度，但偶尔你会遇到一些\n\n"
            const paragraph2 = "更重要的是，我们还支持你根据自身需求自定义快捷指令。"
            return <div className="mb-2" dangerouslySetInnerHTML={{ __html: (paragraph1 + paragraph2).replace(/\n/g, '<br />') }} />
        }
        return <div></div>
    }
    serialize(): string {
        return JSON.stringify({
            type: this.type,
            currentStateID: this.currentStateID,
            nextStateID: this.nextStateID
        })
    }
    static deserialize(serialized: string): NextStepTutorialMessage {
        const { currentStateID, nextStateID } = JSON.parse(serialized);
        return new NextStepTutorialMessage(currentStateID, nextStateID);
    }
}

function NextStepTutorialMessageComponent({ message: unTypedMsg, className }: { message: Message, messageID: number, updateMessage: (messageID: number, message: Message) => void, className?: string }) {
    const { t } = useTranslation()
    const dispatch = useAppDispatch();
    const tutorialState = useAppSelector(state => state.tutorialState);

    const message = unTypedMsg as NextStepTutorialMessage

    function handleNextStep() {
        // dispatch(setTutorialState({ stateID: TutorialStateIDs.cueingClickTranslation }))
        dispatch(setTutorialState({ stateID: message.nextStateID }))
    }

    return <div className={`flex flex-row ${className}`}>
        <RoleV2 className="mr-3" name={message.role} />
        <div className={`bg-[#F6F5F5] rounded-xl w-fit max-w-[80%] p-4 flex flex-col ${className}`}>
            {message.contentNode()}
            {tutorialState.stateID === message.currentStateID &&
                <TmpFilledButton className="px-2 py-1 mr-2 rounded-lg self-end" onClick={handleNextStep}>
                    <span className="text-sm">{t('Next Step')}</span>
                </TmpFilledButton>
            }
        </div>
    </div>
}

// ==== tutorial step 1 ====

/** @deprecated */
function TutorialMessageComponent1({ message, className }: { message: Message, messageID: number, updateMessage: (messageID: number, message: Message) => void, className?: string }) {
    const { t } = useTranslation()
    const dispatch = useAppDispatch();
    const tutorialState = useAppSelector(state => state.tutorialState);
    const chatSettings = useContext(ChatSettingsContext)

    // TODO i18n
    const content = "BabelDuck 是一个 XX ，旨在降低语言练习门槛的 AI 对话应用。除了普通的 AI 对话聊天能力外，我们还提供了一系列为口语练习场景而设计的工具，本教程将为你简单介绍如何使用它们。若你更倾向于自行摸索，可以点击左下角「新建对话」，即可开始体验，之后依然随时可以回来继续该教程。"

    function handleNextStep() {
        dispatch(setTutorialState({ stateID: TutorialStateIDs.indicateUsersToClickTranslation }))
    }

    return <div className={`flex flex-row ${className}`}>
        <RoleV2 className="mr-3" name={message.role} />
        <div className={`bg-[#F6F5F5] rounded-xl w-fit max-w-[80%] p-4 flex flex-col ${className}`}>
            <div className="mb-2" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
            {tutorialState.stateID === TutorialStateIDs.introduction &&
                <TmpFilledButton className="px-2 py-1 mr-2 rounded-lg self-end" onClick={handleNextStep}>
                    {/* TODO i18n */}
                    <span className="text-sm">{t('Next Step')}</span>
                </TmpFilledButton>
            }
        </div>
    </div>
}

/** @deprecated Use NextStepTutorialMessage instead */
export class TutorialMessage1 extends TutorialMessageBase {
    static _type = 'tutorial-1'
    constructor() {
        super(TutorialMessage1._type)
    }
    component(): ({ }: { message: Message; messageID: number; updateMessage: (messageID: number, message: Message) => void; className?: string; }) => JSX.Element {
        return TutorialMessageComponent1
    }
    static deserialize(): TutorialMessage1 {
        return new TutorialMessage1()
    }

}

// message for cueing users to click on Translation icon
function QueClickOnTranslationMsgComponent({ className }: { className?: string }) {
    // const { t } = useTranslation()
    // const dispatch = useAppDispatch();
    // const tutorialState = useAppSelector(state => state.tutorialState);
    // TODO i18n
    const tutorialMsg1 = "假设你现在正在模拟一场线上会议，对方问了你一个问题："
    const aiMsg = "XXX"
    const content3 = "假设你现在想回复 \"东西有点多，我晚点提炼一下\"，但不知道如何表达，那么就可以通过快捷指令求助 AI\n"
    const content3_2 = "现在点一下这个图标试试" // 后面附上截图

    return <div className="flex flex-col">
        {/* tutorial message 2-1*/}
        <div className={`flex flex-row ${className}`}>
            <RoleV2 className="mr-3" name={SpecialRoles.TUTORIAL} />
            <div className={`bg-[#F6F5F5] rounded-xl w-fit max-w-[80%] p-4 flex flex-col ${className}`}>
                <div className="mb-2" dangerouslySetInnerHTML={{ __html: tutorialMsg1.replace(/\n/g, '<br />') }} />
            </div>
        </div>
        {/* assistant message */}
        <div className="flex flex-row">
            <RoleV2 className="mr-3" name={SpecialRoles.ASSISTANT} />
            <div className={`bg-[#F6F5F5] rounded-xl w-fit max-w-[80%] p-4 flex flex-col ${className}`}>
                <div className="mb-2" dangerouslySetInnerHTML={{ __html: aiMsg.replace(/\n/g, '<br />') }} />
            </div>
        </div>
        {/* tutorial message 2-2 */}
        <div className="flex flex-row">
            <RoleV2 className="mr-3" name={SpecialRoles.TUTORIAL} />
            <div className={`bg-[#F6F5F5] rounded-xl w-fit max-w-[80%] p-4 flex flex-col ${className}`}>
                <div className="mb-2" dangerouslySetInnerHTML={{ __html: content3.replace(/\n/g, '<br />') }} />
                <div className="flex flex-row items-end">
                    <div className="mb-2 mr-2" dangerouslySetInnerHTML={{ __html: content3_2.replace(/\n/g, '<br />') }} />
                    <Image src="/images/tutorial-state2.png" alt="tutorial-2-2" width={200} height={300} />
                </div>
            </div>
        </div>
    </div>
}

export class QueClickOnTranslationMsg extends TutorialMessageBase {
    static _type = 'que-click-on-translation'

    constructor() {
        super(QueClickOnTranslationMsg._type)
    }

    component() {
        return QueClickOnTranslationMsgComponent
    }

    static deserialize(): QueClickOnTranslationMsg {
        return new QueClickOnTranslationMsg()
    }

}

// text message with id, can be identified for chat intelligence or input handlers
export class IdentifiedTextMessage extends TextMessage {
    static _type = 'identified-text'
    id: string
    constructor(id: string, role: string, content: string) {
        super(role, content)
        this.id = id
    }
    serialize(): string {
        return JSON.stringify({
            type: this.type,
            id: this.id,
            role: this.role,
            content: this.content
        })
    }
    static deserialize(serialized: string): IdentifiedTextMessage {
        const { id, role, content } = JSON.parse(serialized);
        return new IdentifiedTextMessage(id, role, content);
    }
}

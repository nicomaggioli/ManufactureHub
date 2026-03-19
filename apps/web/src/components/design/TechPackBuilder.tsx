import { useReducer, useCallback, useRef } from 'react';
import { RotateCcw, Upload, Sparkles, MessageSquare, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TechPackImageUpload } from './TechPackImageUpload';
import { TechPackChat, type ChatMessage } from './TechPackChat';
import { TechPackPreview } from './TechPackPreview';
import {
  analyzeDesignImage,
  buildQuestionFlow,
  buildTechPack,
  type DesignAnalysis,
  type QuestionStep,
  type CollectedResponses,
  type BuiltTechPack,
} from '@/lib/techpack-ai';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

type Phase = 'upload' | 'analyzing' | 'chat' | 'complete';

interface State {
  phase: Phase;
  uploadedImage: string | null;
  fileName: string;
  analysis: DesignAnalysis | null;
  questions: QuestionStep[];
  currentQuestionIndex: number;
  messages: ChatMessage[];
  isTyping: boolean;
  responses: CollectedResponses;
  techPack: BuiltTechPack | null;
}

type Action =
  | { type: 'SET_IMAGE'; image: string; fileName: string }
  | { type: 'START_ANALYSIS' }
  | { type: 'ANALYSIS_COMPLETE'; analysis: DesignAnalysis; questions: QuestionStep[]; introMessage: ChatMessage }
  | { type: 'ADD_USER_MESSAGE'; message: ChatMessage }
  | { type: 'SET_TYPING'; value: boolean }
  | { type: 'ADD_ASSISTANT_MESSAGE'; message: ChatMessage; field: string; value: string }
  | { type: 'COMPLETE'; techPack: BuiltTechPack; message: ChatMessage }
  | { type: 'RESET' };

const initialState: State = {
  phase: 'upload',
  uploadedImage: null,
  fileName: '',
  analysis: null,
  questions: [],
  currentQuestionIndex: 0,
  messages: [],
  isTyping: false,
  responses: {},
  techPack: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_IMAGE':
      return { ...state, uploadedImage: action.image, fileName: action.fileName };
    case 'START_ANALYSIS':
      return { ...state, phase: 'analyzing' };
    case 'ANALYSIS_COMPLETE':
      return {
        ...state,
        phase: 'chat',
        analysis: action.analysis,
        questions: action.questions,
        messages: [action.introMessage],
        currentQuestionIndex: 0,
      };
    case 'ADD_USER_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] };
    case 'SET_TYPING':
      return { ...state, isTyping: action.value };
    case 'ADD_ASSISTANT_MESSAGE':
      return {
        ...state,
        isTyping: false,
        messages: [...state.messages, action.message],
        currentQuestionIndex: state.currentQuestionIndex + 1,
        responses: { ...state.responses, [action.field]: action.value },
      };
    case 'COMPLETE':
      return {
        ...state,
        phase: 'complete',
        isTyping: false,
        techPack: action.techPack,
        messages: [...state.messages, action.message],
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let msgId = 0;
function createMessage(role: 'assistant' | 'user', content: string, options?: string[]): ChatMessage {
  return { id: `msg-${++msgId}`, role, content, timestamp: new Date(), options };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TechPackBuilder() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Phase steps for indicator
  const steps = [
    { key: 'upload', label: 'Upload', icon: Upload },
    { key: 'analyzing', label: 'Analysis', icon: Sparkles },
    { key: 'chat', label: 'Details', icon: MessageSquare },
    { key: 'complete', label: 'Tech Pack', icon: FileCheck },
  ];

  const phaseOrder = ['upload', 'analyzing', 'chat', 'complete'];
  const currentPhaseIdx = phaseOrder.indexOf(state.phase);

  // --- Upload handler ---
  const handleImageSelected = useCallback((dataUrl: string, fileName: string) => {
    dispatch({ type: 'SET_IMAGE', image: dataUrl, fileName });
    dispatch({ type: 'START_ANALYSIS' });

    // Simulate analysis delay
    setTimeout(() => {
      const analysis = analyzeDesignImage(fileName);
      const questions = buildQuestionFlow(analysis);
      const firstQ = questions[0];

      const introMessage = createMessage(
        'assistant',
        `I've analyzed your design! Here's what I found:\n\n` +
          `**Type:** ${analysis.garmentType}\n` +
          `**Silhouette:** ${analysis.silhouette}\n` +
          `**Colors detected:** ${analysis.detectedColors.map((c) => c.name).join(', ')}\n` +
          `**Construction notes:** ${analysis.constructionNotes.join(', ')}\n\n` +
          `Let's build your tech pack. ${firstQ.question}`,
        firstQ.options
      );

      dispatch({ type: 'ANALYSIS_COMPLETE', analysis, questions, introMessage });
    }, 2200);
  }, []);

  // --- Chat message handler ---
  const handleSendMessage = useCallback(
    (text: string) => {
      const userMsg = createMessage('user', text);
      dispatch({ type: 'ADD_USER_MESSAGE', message: userMsg });
      dispatch({ type: 'SET_TYPING', value: true });

      const currentQ = state.questions[state.currentQuestionIndex];
      const nextIdx = state.currentQuestionIndex + 1;
      const isLast = nextIdx >= state.questions.length;

      // Simulate AI thinking
      const delay = 600 + Math.random() * 800;
      typingTimeout.current = setTimeout(() => {
        if (isLast) {
          // Build the final tech pack
          const finalResponses = { ...state.responses, [currentQ.field]: text };
          const techPack = buildTechPack(finalResponses, state.analysis!);

          const doneMsg = createMessage(
            'assistant',
            `Your tech pack for **${techPack.productName}** is complete! 🎉\n\n` +
              `I've generated all sections including materials (BOM), measurements, construction details, colorways, and label specs.\n\n` +
              `You can now **export it as a PDF** or **send it directly to a manufacturer** using the buttons on the right.`
          );

          dispatch({ type: 'COMPLETE', techPack, message: doneMsg });
        } else {
          const nextQ = state.questions[nextIdx];

          // Build acknowledgment + next question
          const ack = getAcknowledgment(currentQ.section, text);
          const assistantMsg = createMessage(
            'assistant',
            `${ack}\n\n${nextQ.question}`,
            nextQ.options
          );

          dispatch({
            type: 'ADD_ASSISTANT_MESSAGE',
            message: assistantMsg,
            field: currentQ.field,
            value: text,
          });
        }
      }, delay);
    },
    [state.questions, state.currentQuestionIndex, state.responses, state.analysis]
  );

  // Build intermediate tech pack for preview
  const previewTechPack =
    state.techPack ||
    (state.analysis && Object.keys(state.responses).length > 0
      ? buildTechPack(state.responses, state.analysis)
      : null);

  return (
    <div className="space-y-4">
      {/* Step indicator + reset */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {steps.map((step, i) => {
            const StepIcon = step.icon;
            const isActive = step.key === state.phase;
            const isDone = i < currentPhaseIdx;

            return (
              <div key={step.key} className="flex items-center gap-1">
                {i > 0 && (
                  <div
                    className={cn(
                      'w-6 h-px mx-0.5',
                      isDone ? 'bg-gray-900' : 'bg-gray-200'
                    )}
                  />
                )}
                <div
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-gray-900 text-white'
                      : isDone
                        ? 'bg-gray-100 text-gray-700'
                        : 'text-gray-300'
                  )}
                >
                  <StepIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {state.phase !== 'upload' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (typingTimeout.current) clearTimeout(typingTimeout.current);
              dispatch({ type: 'RESET' });
            }}
            className="text-xs text-gray-400 hover:text-gray-700 gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Start Over
          </Button>
        )}
      </div>

      {/* Main content */}
      {state.phase === 'upload' && (
        <TechPackImageUpload onImageSelected={handleImageSelected} />
      )}

      {state.phase === 'analyzing' && (
        <div className="flex flex-col items-center justify-center py-16 gap-6">
          {state.uploadedImage && (
            <div className="w-48 h-48 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
              <img src={state.uploadedImage} alt="Design" className="w-full h-full object-contain" />
            </div>
          )}
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-2 border-gray-200" />
              <div className="absolute inset-0 rounded-full border-2 border-gray-900 border-t-transparent animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">Analyzing your design...</p>
              <p className="text-xs text-gray-400 mt-1">
                Identifying garment type, construction details, and color palette
              </p>
            </div>
          </div>
        </div>
      )}

      {(state.phase === 'chat' || state.phase === 'complete') && (
        <div className="grid lg:grid-cols-2 gap-4" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
          {/* Chat panel */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white flex flex-col min-h-0">
            <TechPackChat
              messages={state.messages}
              isTyping={state.isTyping}
              onSendMessage={handleSendMessage}
              disabled={state.phase === 'complete'}
            />
          </div>

          {/* Preview panel */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white flex flex-col min-h-0">
            <TechPackPreview
              techPack={previewTechPack}
              responses={state.responses}
              designImage={state.uploadedImage}
              isComplete={state.phase === 'complete'}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Acknowledgment text generator
// ---------------------------------------------------------------------------

function getAcknowledgment(section: string, answer: string): string {
  const acks: Record<string, string[]> = {
    overview: [
      `Got it — **${answer}**.`,
      `Nice choice!`,
      `Perfect, noted.`,
    ],
    materials: [
      `**${answer}** — great choice for this garment.`,
      `Noted! That'll work well.`,
      `Good pick. I've added that to the BOM.`,
    ],
    construction: [
      `**${answer}** — added to the construction spec.`,
      `I'll note that in the tech pack.`,
    ],
    measurements: [
      `**${answer}** — I'll generate the size chart for that range.`,
      `Got it, sizing set.`,
    ],
    colorways: [
      `Colors confirmed!`,
      `I've added those to the colorway spec.`,
    ],
    labels: [
      `**${answer}** — added to label requirements.`,
      `Noted for the care label.`,
      `Got it!`,
    ],
  };

  const options = acks[section] || [`Got it — **${answer}**.`];
  return options[Math.floor(Math.random() * options.length)];
}

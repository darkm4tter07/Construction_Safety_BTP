import { useState, useEffect, useRef } from "react";
import { Brain, CheckCircle, AlertTriangle, XCircle, Clock, ChevronRight, Loader2, RotateCcw } from "lucide-react";
import axios from "axios";
import { AUTH_URL as API_URL } from "../../Constant";
import toast from "react-hot-toast";

// ------------------------------------------------------------------
// QUESTIONS — swap these out after professor consultation
// ------------------------------------------------------------------
const QUESTIONS = [
  {
    id: 1,
    type: "reaction",
    question: "Reaction Time Test",
    instruction: "Click the button as soon as it turns green",
  },
  {
    id: 2,
    type: "mcq",
    question: "What is the correct PPE for working at heights above 2 meters?",
    options: ["Safety helmet only", "Full body harness and helmet", "Safety vest only", "Gloves and boots"],
    correct: 1,
    category: "knowledge",
  },
  {
    id: 3,
    type: "mcq",
    question: "What does a red safety sign indicate?",
    options: ["Mandatory action", "Warning", "Prohibition or danger", "Safe condition"],
    correct: 2,
    category: "knowledge",
  },
  {
    id: 4,
    type: "memory",
    question: "Memory Test",
    instruction: "Remember the sequence shown and repeat it",
    sequence: [3, 7, 1, 9, 4],
  },
  {
    id: 5,
    type: "mcq",
    question: "If you notice a colleague showing signs of heat stroke, what should you do first?",
    options: [
      "Give them water and continue work",
      "Move them to a cool area and call for help",
      "Ask them to rest for 5 minutes",
      "Ignore it and report later",
    ],
    correct: 1,
    category: "situational",
  },
  {
    id: 6,
    type: "mcq",
    question: "Which of these is NOT a safe practice when operating heavy machinery?",
    options: [
      "Checking blind spots before reversing",
      "Wearing seatbelt",
      "Using mobile phone while operating",
      "Doing pre-operation checks",
    ],
    correct: 2,
    category: "knowledge",
  },
  {
    id: 7,
    type: "attention",
    question: "Attention Test",
    instruction: "Count the number of triangles in the pattern below",
    answer: 6,
    display: "▲ ▲ □ ▲ ○ ▲ □ ▲ ○ ▲",
  },
  {
    id: 8,
    type: "mcq",
    question: "When should a worker refuse to perform a task?",
    options: [
      "When they feel tired",
      "When proper safety equipment is not available",
      "When the supervisor is not watching",
      "When the task takes too long",
    ],
    correct: 1,
    category: "situational",
  },
  {
    id: 9,
    type: "mcq",
    question: "What is the first step when you discover a fire on site?",
    options: [
      "Try to extinguish it immediately",
      "Alert others and activate fire alarm",
      "Gather your belongings and leave",
      "Call your supervisor first",
    ],
    correct: 1,
    category: "knowledge",
  },
  {
    id: 10,
    type: "mcq",
    question: "How often should safety equipment be inspected?",
    options: [
      "Once a year",
      "Only when it looks damaged",
      "Before each use",
      "Every month",
    ],
    correct: 2,
    category: "knowledge",
  },
];

const RESULT_CONFIG = {
  FIT: { label: "Fit for Work", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", icon: CheckCircle },
  SUPERVISION_REQUIRED: { label: "Supervision Required", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", icon: AlertTriangle },
  UNFIT: { label: "Unfit — Reassessment Needed", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: XCircle },
};

// ------------------------------------------------------------------
// REACTION TIME COMPONENT
// ------------------------------------------------------------------
function ReactionTest({ onComplete }) {
  const [phase, setPhase] = useState("waiting"); // waiting | ready | go | done
  const [reactionTime, setReactionTime] = useState(null);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const delay = 2000 + Math.random() * 3000;
    timerRef.current = setTimeout(() => {
      setPhase("go");
      startTimeRef.current = Date.now();
    }, delay);
    return () => clearTimeout(timerRef.current);
  }, []);

  const handleClick = () => {
    if (phase === "go") {
      const time = Date.now() - startTimeRef.current;
      setReactionTime(time);
      setPhase("done");
      setTimeout(() => onComplete(time), 1500);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <p className="text-xs text-zinc-400 text-center">
        Click the circle as soon as it turns green
      </p>
      <button
        onClick={handleClick}
        className={`w-32 h-32 rounded-full transition-all duration-200 flex items-center justify-center text-sm font-semibold ${
          phase === "go"
            ? "bg-green-500 text-white scale-110 shadow-lg shadow-green-500/30"
            : phase === "done"
            ? "bg-blue-500 text-white"
            : "bg-zinc-700 text-zinc-500 cursor-wait"
        }`}
      >
        {phase === "waiting" && "Wait..."}
        {phase === "go" && "NOW!"}
        {phase === "done" && `${reactionTime}ms`}
      </button>
      {phase === "done" && (
        <p className={`text-sm font-semibold ${
          reactionTime < 300 ? "text-green-400" :
          reactionTime < 500 ? "text-yellow-400" : "text-red-400"
        }`}>
          {reactionTime < 300 ? "Excellent!" : reactionTime < 500 ? "Good" : "Slow response"}
        </p>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// MEMORY TEST COMPONENT
// ------------------------------------------------------------------
function MemoryTest({ sequence, onComplete }) {
  const [phase, setPhase] = useState("show"); // show | input | done
  const [input, setInput] = useState("");
  const [showTimer, setShowTimer] = useState(3);

  useEffect(() => {
    if (phase !== "show") return;
    const interval = setInterval(() => {
      setShowTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setPhase("input");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const handleSubmit = () => {
    const userSeq = input.trim().split(/\s+/).map(Number);
    const correct = sequence.every((n, i) => n === userSeq[i]) && userSeq.length === sequence.length;
    onComplete(correct ? 20 : 0);
  };

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      {phase === "show" && (
        <>
          <p className="text-xs text-zinc-400">Memorize this sequence ({showTimer}s)</p>
          <div className="flex gap-3">
            {sequence.map((n, i) => (
              <div key={i} className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-lg font-bold text-white">
                {n}
              </div>
            ))}
          </div>
        </>
      )}
      {phase === "input" && (
        <>
          <p className="text-xs text-zinc-400 text-center">
            Enter the numbers you saw, separated by spaces
          </p>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="e.g. 3 7 1 9 4"
            className="w-48 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-center text-zinc-100 focus:outline-none focus:border-zinc-500"
            autoFocus
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-xs font-semibold text-white transition"
          >
            Submit
          </button>
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// ATTENTION TEST COMPONENT
// ------------------------------------------------------------------
function AttentionTest({ display, answer, onComplete }) {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    const correct = parseInt(input) === answer;
    onComplete(correct ? 20 : 0);
  };

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <p className="text-xs text-zinc-400 text-center">
        Count the number of triangles (▲) in the pattern
      </p>
      <p className="text-2xl tracking-widest text-zinc-200 text-center leading-relaxed">
        {display}
      </p>
      <div className="flex items-center gap-3">
        <input
          type="number"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Count"
          className="w-24 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-center text-zinc-100 focus:outline-none focus:border-zinc-500"
          autoFocus
        />
        <button
          onClick={handleSubmit}
          disabled={!input}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-xs font-semibold text-white transition"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------------------
export default function ProfileCognitive({ userId, isAdminView }) {
  const [view, setView] = useState("status"); // status | test | result
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [scores, setScores] = useState({});
  const [reactionTime, setReactionTime] = useState(null);
  const [latestAssessment, setLatestAssessment] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssessments();
  }, [userId]);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const [latestRes, historyRes] = await Promise.all([
        axios.get(`${API_URL}/profile/${userId}/cognitive/latest`),
        axios.get(`${API_URL}/profile/${userId}/cognitive`),
      ]);
      setLatestAssessment(latestRes.data.assessment);
      setHistory(historyRes.data.assessments || []);
    } catch (err) {
      console.error("Failed to fetch assessments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = () => {
    setCurrentQ(0);
    setAnswers({});
    setScores({});
    setReactionTime(null);
    setView("test");
  };

  const handleMCQAnswer = (questionId, selectedIndex, correct) => {
    const isCorrect = selectedIndex === correct;
    setAnswers(prev => ({ ...prev, [questionId]: selectedIndex }));
    setScores(prev => ({ ...prev, [questionId]: isCorrect ? 20 : 0 }));
    setTimeout(() => nextQuestion(), 600);
  };

  const handleReactionComplete = (time) => {
    setReactionTime(time);
    // Score based on reaction time
    const score = time < 300 ? 20 : time < 500 ? 14 : time < 700 ? 8 : 4;
    setScores(prev => ({ ...prev, [QUESTIONS[currentQ].id]: score }));
    nextQuestion();
  };

  const handleMemoryComplete = (score) => {
    setScores(prev => ({ ...prev, [QUESTIONS[currentQ].id]: score }));
    nextQuestion();
  };

  const handleAttentionComplete = (score) => {
    setScores(prev => ({ ...prev, [QUESTIONS[currentQ].id]: score }));
    nextQuestion();
  };

  const nextQuestion = () => {
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(prev => prev + 1);
    } else {
      submitTest();
    }
  };

  const submitTest = async () => {
    setSubmitting(true);
    setView("result");

    // Calculate scores
    const totalScore = Math.round(
      Object.values(scores).reduce((a, b) => a + b, 0) /
      (QUESTIONS.length * 20) * 100
    );

    const mcqScores = QUESTIONS.filter(q => q.type === "mcq");
    const knowledgeScore = mcqScores
      .filter(q => q.category === "knowledge")
      .reduce((sum, q) => sum + (scores[q.id] || 0), 0);
    const situationalScore = mcqScores
      .filter(q => q.category === "situational")
      .reduce((sum, q) => sum + (scores[q.id] || 0), 0);
    const memoryScore = scores[4] || 0;
    const attentionScore = scores[7] || 0;

    try {
      const res = await axios.post(`${API_URL}/profile/${userId}/cognitive`, {
        score: totalScore,
        reaction_time_ms: reactionTime,
        memory_score: memoryScore,
        attention_score: attentionScore,
        spatial_score: 0,
        knowledge_score: knowledgeScore + situationalScore,
        answers: answers,
      });
      setLatestAssessment(res.data);
      await fetchAssessments();
    } catch (err) {
      toast.error("Failed to save assessment");
    } finally {
      setSubmitting(false);
    }
  };

  const question = QUESTIONS[currentQ];

  // ------------------------------------------------------------------
  // LOADING
  // ------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  // ------------------------------------------------------------------
  // TEST IN PROGRESS
  // ------------------------------------------------------------------
  if (view === "test") {
    const progress = ((currentQ) / QUESTIONS.length) * 100;

    return (
      <div className="max-w-xl mx-auto pb-8">
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">

          {/* Progress */}
          <div className="px-5 py-4 border-b border-zinc-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-400">
                Question {currentQ + 1} of {QUESTIONS.length}
              </span>
              <span className="text-xs text-zinc-500">
                {Math.round(progress)}% complete
              </span>
            </div>
            <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="px-5 py-5">
            <h3 className="text-sm font-semibold text-zinc-100 mb-1">
              {question.question}
            </h3>
            {question.instruction && (
              <p className="text-xs text-zinc-400 mb-4">{question.instruction}</p>
            )}

            {/* MCQ */}
            {question.type === "mcq" && (
              <div className="flex flex-col gap-2 mt-4">
                {question.options.map((opt, i) => {
                  const isAnswered = answers[question.id] !== undefined;
                  const isSelected = answers[question.id] === i;
                  const isCorrect = i === question.correct;
                  return (
                    <button
                      key={i}
                      onClick={() => !isAnswered && handleMCQAnswer(question.id, i, question.correct)}
                      disabled={isAnswered}
                      className={`w-full text-left px-4 py-2.5 rounded-lg border text-xs transition ${
                        isAnswered
                          ? isCorrect
                            ? "bg-green-500/10 border-green-500/30 text-green-300"
                            : isSelected
                            ? "bg-red-500/10 border-red-500/30 text-red-300"
                            : "bg-zinc-700/30 border-zinc-700 text-zinc-500"
                          : "bg-zinc-700/40 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:border-zinc-600 cursor-pointer"
                      }`}
                    >
                      <span className="font-medium mr-2 text-zinc-500">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Reaction */}
            {question.type === "reaction" && (
              <ReactionTest onComplete={handleReactionComplete} />
            )}

            {/* Memory */}
            {question.type === "memory" && (
              <MemoryTest
                sequence={question.sequence}
                onComplete={handleMemoryComplete}
              />
            )}

            {/* Attention */}
            {question.type === "attention" && (
              <AttentionTest
                display={question.display}
                answer={question.answer}
                onComplete={handleAttentionComplete}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // RESULT VIEW
  // ------------------------------------------------------------------
  if (view === "result") {
    const totalScore = latestAssessment?.score ?? Math.round(
      Object.values(scores).reduce((a, b) => a + b, 0) /
      (QUESTIONS.length * 20) * 100
    );
    const result = totalScore >= 70 ? "FIT" : totalScore >= 50 ? "SUPERVISION_REQUIRED" : "UNFIT";
    const config = RESULT_CONFIG[result];
    const Icon = config.icon;

    return (
      <div className="max-w-xl mx-auto pb-8 flex flex-col gap-4">
        <div className={`rounded-xl border px-5 py-6 flex flex-col items-center gap-3 text-center ${config.bg}`}>
          <Icon className={`w-10 h-10 ${config.color}`} />
          <div>
            <p className={`text-lg font-bold ${config.color}`}>{totalScore}/100</p>
            <p className={`text-sm font-semibold ${config.color} mt-1`}>{config.label}</p>
          </div>
          {latestAssessment?.valid_until && (
            <p className="text-[11px] text-zinc-500">
              Valid until {new Date(latestAssessment.valid_until).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'long', year: 'numeric'
              })}
            </p>
          )}
        </div>

        {/* Score breakdown */}
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-4">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Score Breakdown</p>
          {reactionTime && (
            <div className="flex justify-between py-1.5 border-b border-zinc-700/50">
              <span className="text-xs text-zinc-400">Reaction Time</span>
              <span className="text-xs text-zinc-200">{reactionTime}ms</span>
            </div>
          )}
          {latestAssessment?.memory_score !== null && (
            <div className="flex justify-between py-1.5 border-b border-zinc-700/50">
              <span className="text-xs text-zinc-400">Memory</span>
              <span className="text-xs text-zinc-200">{latestAssessment?.memory_score}/20</span>
            </div>
          )}
          {latestAssessment?.attention_score !== null && (
            <div className="flex justify-between py-1.5 border-b border-zinc-700/50">
              <span className="text-xs text-zinc-400">Attention</span>
              <span className="text-xs text-zinc-200">{latestAssessment?.attention_score}/20</span>
            </div>
          )}
          {latestAssessment?.knowledge_score !== null && (
            <div className="flex justify-between py-1.5">
              <span className="text-xs text-zinc-400">Safety Knowledge</span>
              <span className="text-xs text-zinc-200">{latestAssessment?.knowledge_score}/20</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setView("status")}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-medium text-zinc-300 transition"
        >
          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
          Back to Overview
        </button>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // STATUS VIEW (default)
  // ------------------------------------------------------------------
  const isValid = latestAssessment && new Date(latestAssessment.valid_until) > new Date();
  const result = latestAssessment?.result;
  const config = result ? RESULT_CONFIG[result] : null;

  return (
    <div className="max-w-xl mx-auto pb-8 flex flex-col gap-4">

      {/* Current status */}
      {latestAssessment && config ? (
        <div className={`rounded-xl border px-5 py-5 ${config.bg}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <config.icon className={`w-5 h-5 ${config.color} shrink-0`} />
              <div>
                <p className={`text-sm font-semibold ${config.color}`}>
                  {config.label}
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Score: {latestAssessment.score}/100
                </p>
              </div>
            </div>
            <div className="text-right">
              {isValid ? (
                <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                  Valid
                </span>
              ) : (
                <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                  Expired
                </span>
              )}
              <p className="text-[10px] text-zinc-500 mt-1">
                {isValid
                  ? `Until ${new Date(latestAssessment.valid_until).toLocaleDateString('en-IN')}`
                  : `Expired ${new Date(latestAssessment.valid_until).toLocaleDateString('en-IN')}`
                }
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-5 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-400">Test Required</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              You have not taken the cognitive assessment yet
            </p>
          </div>
        </div>
      )}

      {/* Take / retake test — hide for admin */}
      {!isAdminView && (
        <button
          onClick={handleStartTest}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold text-white transition"
        >
          <Brain className="w-4 h-4" />
          {latestAssessment ? (isValid ? "Retake Test" : "Retake Test (Expired)") : "Take Cognitive Test"}
        </button>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-700">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Assessment History</p>
          </div>
          <div className="divide-y divide-zinc-700/50">
            {history.map((item) => {
              const cfg = RESULT_CONFIG[item.result];
              return (
                <div key={item.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <cfg.icon className={`w-4 h-4 ${cfg.color} shrink-0`} />
                    <div>
                      <p className={`text-xs font-medium ${cfg.color}`}>
                        {item.score}/100 — {cfg.label}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {new Date(item.taken_at).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    new Date(item.valid_until) > new Date()
                      ? "text-green-400 bg-green-500/10 border-green-500/20"
                      : "text-zinc-500 bg-zinc-700/30 border-zinc-700"
                  }`}>
                    {new Date(item.valid_until) > new Date() ? "Valid" : "Expired"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
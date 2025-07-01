import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { cn } from "../lib/utils";
import { HelpCircle, CheckCircle, XCircle, Clock, Trophy, ArrowRight, RotateCcw } from "lucide-react";

interface QuizPageContext {
  isDarkMode: boolean;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
}

const mockQuestions: Question[] = [
  {
    id: "1",
    question: "What is React?",
    options: [
      "A programming language",
      "A JavaScript library for building user interfaces",
      "A database management system",
      "An operating system"
    ],
    correctAnswer: 1,
    explanation: "React is a JavaScript library developed by Facebook for building user interfaces, particularly single-page applications.",
    category: "React"
  },
  {
    id: "2",
    question: "Which hook is used to manage state in functional components?",
    options: [
      "useEffect",
      "useState",
      "useContext",
      "useReducer"
    ],
    correctAnswer: 1,
    explanation: "useState is the hook used to add state to functional components in React.",
    category: "React Hooks"
  },
  {
    id: "3",
    question: "What does JSX stand for?",
    options: [
      "JavaScript XML",
      "JavaScript Extension",
      "Java Syntax XML",
      "JavaScript Syntax"
    ],
    correctAnswer: 0,
    explanation: "JSX stands for JavaScript XML, which allows you to write HTML-like code in JavaScript.",
    category: "React"
  },
  {
    id: "4",
    question: "What is the purpose of useEffect hook?",
    options: [
      "To manage component state",
      "To perform side effects in functional components",
      "To create custom hooks",
      "To optimize performance"
    ],
    correctAnswer: 1,
    explanation: "useEffect is used to perform side effects in functional components, such as data fetching, subscriptions, or manually changing the DOM.",
    category: "React Hooks"
  }
];

export default function QuizPage() {
  const { isDarkMode } = useOutletContext<QuizPageContext>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [questions] = useState<Question[]>(mockQuestions);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = (answerIndex: number) => {
    if (selectedAnswer !== null) return; // Prevent multiple selections
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    
    if (answerIndex === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setTimeLeft(30);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setQuizCompleted(false);
    setTimeLeft(30);
  };

  const getScorePercentage = () => {
    return Math.round((score / questions.length) * 100);
  };

  const getScoreMessage = () => {
    const percentage = getScorePercentage();
    if (percentage >= 90) return "Excellent!";
    if (percentage >= 75) return "Great job!";
    if (percentage >= 60) return "Good work!";
    if (percentage >= 40) return "Not bad!";
    return "Keep practicing!";
  };

  return (
    <div className={cn(
      "flex flex-col h-full transition-colors duration-200",
      isDarkMode ? "bg-gray-900" : "bg-white"
    )}>
      {/* Header */}
      <header className={cn(
        "flex items-center justify-between p-4 border-b",
        isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
      )}>
        <h1 className={cn(
          "text-lg font-semibold",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          Quiz Challenge
        </h1>
        <HelpCircle className={cn(
          "w-6 h-6",
          isDarkMode ? "text-gray-400" : "text-gray-600"
        )} />
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {!quizCompleted ? (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Progress Bar */}
            <div className={cn(
              "bg-white rounded-lg border border-gray-200 p-4",
              isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
            )}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                  <span className={cn(
                    "text-sm font-medium",
                    isDarkMode ? "text-gray-400" : "text-gray-700"
                  )}>
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className={cn(
                    "text-sm font-medium",
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    {timeLeft}s
                  </span>
                </div>
              </div>
              <div className={cn(
                "w-full bg-gray-200 rounded-full h-2",
                isDarkMode ? "bg-gray-700" : "bg-gray-200"
              )}>
                <div 
                  className={cn(
                    "bg-blue-600 h-2 rounded-full transition-all duration-300",
                    isDarkMode ? "bg-gray-700" : "bg-gray-200"
                  )}
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className={cn(
              "bg-white rounded-lg border border-gray-200 p-6",
              isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
            )}>
              <div className="mb-4">
                <span className={cn(
                  "inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mb-3",
                  isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-800"
                )}>
                  {currentQuestion.category}
                </span>
                <h2 className={cn(
                  "text-lg font-semibold",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Answer Options */}
              <div className="space-y-3 mb-6">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={selectedAnswer !== null}
                    className={cn(
                      "w-full text-left p-4 rounded-lg border transition-all",
                      selectedAnswer === null
                        ? "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                        : selectedAnswer === index
                        ? index === currentQuestion.correctAnswer
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-red-500 bg-red-50 text-red-700"
                        : index === currentQuestion.correctAnswer
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-300 text-gray-500"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {selectedAnswer !== null && (
                        <div className="flex-shrink-0">
                          {index === currentQuestion.correctAnswer ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : selectedAnswer === index ? (
                            <XCircle className="w-5 h-5 text-red-600" />
                          ) : null}
                        </div>
                      )}
                      <span className="font-medium text-sm">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span className="text-sm">{option}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Explanation */}
              {showExplanation && (
                <div className={cn(
                  "bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6",
                  isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
                )}>
                  <h3 className={cn(
                    "font-semibold",
                    isDarkMode ? "text-white" : "text-gray-900"
                  )}>Explanation:</h3>
                  <p className={cn(
                    "text-sm",
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}

              {/* Next Button */}
              {showExplanation && (
                <div className="flex justify-end">
                  <button
                    onClick={handleNextQuestion}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors",
                      isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-blue-500 hover:bg-blue-600"
                    )}
                  >
                    {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Quiz Results */
          <div className="max-w-md mx-auto">
            <div className={cn(
              "bg-white rounded-lg border border-gray-200 p-8 text-center",
              isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
            )}>
              <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
              <h2 className={cn(
                "text-2xl font-bold",
                isDarkMode ? "text-white" : "text-gray-900"
              )}>
                Quiz Completed!
              </h2>
              <p className={cn(
                "text-lg text-gray-600 mb-6",
                isDarkMode ? "text-gray-400" : "text-gray-700"
              )}>
                Your score: {score} out of {questions.length}
              </p>
              
              <div className="mb-6">
                <div className={cn(
                  "text-4xl font-bold",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>
                  {getScorePercentage()}%
                </div>
                <div className={cn(
                  "text-lg font-medium",
                  isDarkMode ? "text-gray-400" : "text-gray-700"
                )}>
                  {getScoreMessage()}
                </div>
              </div>

              <button
                onClick={handleRestartQuiz}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors mx-auto",
                  isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-blue-500 hover:bg-blue-600"
                )}
              >
                <RotateCcw className="w-4 h-4" />
                Take Quiz Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
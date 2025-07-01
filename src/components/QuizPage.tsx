import { useState, useCallback } from "react";
import { cn } from "../lib/utils";
import { HelpCircle, CheckCircle, XCircle, Clock, Trophy, ArrowRight, RotateCcw } from "lucide-react";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
}

interface QuizPageProps {}

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

export default function QuizPage({}: QuizPageProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [questions] = useState<Question[]>(mockQuestions);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = useCallback((answerIndex: number) => {
    if (selectedAnswer !== null) return; // Prevent multiple selections
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    
    if (answerIndex === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
  }, [selectedAnswer, currentQuestion.correctAnswer]);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setTimeLeft(30);
    } else {
      setQuizCompleted(true);
    }
  }, [currentQuestionIndex, questions.length]);

  const handleRestartQuiz = useCallback(() => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setQuizCompleted(false);
    setTimeLeft(30);
  }, []);

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
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Quiz Challenge</h1>
        <p className="text-sm text-gray-600">Test your knowledge with interactive quizzes</p>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {!quizCompleted ? (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Progress Bar */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {timeLeft}s
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="mb-4">
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mb-3">
                  {currentQuestion.category}
                </span>
                <h2 className="text-lg font-semibold text-gray-900">
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2">Explanation:</h3>
                  <p className="text-sm text-blue-800">
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}

              {/* Next Button */}
              {showExplanation && (
                <div className="flex justify-end">
                  <button
                    onClick={handleNextQuestion}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
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
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Quiz Completed!
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Your score: {score} out of {questions.length}
              </p>
              
              <div className="mb-6">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {getScorePercentage()}%
                </div>
                <div className="text-lg font-medium text-gray-700">
                  {getScoreMessage()}
                </div>
              </div>

              <button
                onClick={handleRestartQuiz}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors mx-auto"
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
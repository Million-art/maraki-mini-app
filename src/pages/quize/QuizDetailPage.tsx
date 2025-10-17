import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store";
import { fetchQuizzes, submitQuizAttempt } from "../../store/slices/quizzesSlice";
import { showConfetti, hideConfetti, addNotification } from "../../store/slices/uiSlice";
import { cn } from "../../lib/utils";
import { HelpCircle, CheckCircle, XCircle, Clock, Trophy, ArrowRight, RotateCcw, ArrowLeft } from "lucide-react";
import Confetti from "../../components/Confetti";
import { Button, Skeleton, SkeletonLoader } from "../../components/ui";

// Mock Telegram ID - in real implementation, this would come from Telegram WebApp
const MOCK_TELEGRAM_ID = 123456789;

interface QuizDetailPageContext {
  isDarkMode: boolean;
}

interface QuizAnswer {
  questionId: string;
  selectedAnswer: string | boolean;
  isCorrect: boolean;
  points: number;
}

export default function QuizDetailPage() {
  const { isDarkMode } = useOutletContext<QuizDetailPageContext>();
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { quizzes, isLoading } = useAppSelector((state: any) => state.quizzes);
  const { showConfetti: showConfettiState } = useAppSelector((state: any) => state.ui);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find the current quiz by ID
  const currentQuiz = quizzes.find((quiz: any) => quiz.id === quizId);

  useEffect(() => {
    if (quizzes.length === 0) {
      dispatch(fetchQuizzes());
    }
  }, [dispatch, quizzes.length]);

  const currentQuestion = currentQuiz?.questions?.[currentQuestionIndex];
  

  // Show loading state if quiz is not ready
  if (isLoading || !currentQuiz) {
    return (
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8">
            <Skeleton height="32px" width="60%" className="mb-2" />
            <Skeleton height="20px" width="40%" />
          </div>

          {/* Progress Skeleton */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Skeleton height="24px" width="120px" />
              <Skeleton height="20px" width="80px" />
            </div>
            <Skeleton height="8px" width="100%" className="rounded-full" />
          </div>

          {/* Question Card Skeleton */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            {/* Question Type Badge */}
            <div className="flex items-center justify-between mb-4">
              <Skeleton height="24px" width="100px" className="rounded-full" />
              <Skeleton height="20px" width="60px" />
            </div>

            {/* Question Text */}
            <div className="mb-6">
              <Skeleton height="24px" width="100%" className="mb-2" />
              <Skeleton height="24px" width="80%" className="mb-2" />
              <Skeleton height="24px" width="60%" />
            </div>

            {/* Answer Options */}
            <SkeletonLoader variant="list" count={4} />
          </div>

          {/* Timer and Next Button Skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton height="20px" width="20px" variant="circular" />
              <Skeleton height="20px" width="80px" />
            </div>
            <Skeleton height="40px" width="120px" />
          </div>
        </div>
      </div>
    );
  }

  // Show error if quiz not found
  if (!currentQuiz) {
    return (
      <div className="flex flex-col h-full">
        <header className={cn(
          "flex items-center justify-between p-4 border-b",
          isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
        )}>
          <div className="flex items-center gap-3">
            <Button 
              size="sm"
              variant="outline"
              onClick={() => navigate('/quiz')}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Quizzes
            </Button>
            <h1 className={cn(
              "text-lg font-semibold",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              Quiz Not Found
            </h1>
          </div>
        </header>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Quiz Not Found
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              The quiz you're looking for doesn't exist or has been removed.
            </p>
            <Button
              onClick={() => navigate('/quiz')}
              variant="primary"
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Quiz List
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show message if quiz has no questions
  if (!currentQuiz.questions || currentQuiz.questions.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <header className={cn(
          "flex items-center justify-between p-4 border-b",
          isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
        )}>
          <div className="flex items-center gap-3">
            <Button 
              size="sm"
              variant="outline"
              onClick={() => navigate('/quiz')}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Quizzes
            </Button>
            <h1 className={cn(
              "text-lg font-semibold",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              {currentQuiz.title}
            </h1>
          </div>
        </header>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No Questions Available
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              This quiz doesn't have any questions yet. Please try another quiz.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show message if current question is not available
  if (!currentQuestion) {
    return (
      <div className="flex flex-col h-full">
        <header className={cn(
          "flex items-center justify-between p-4 border-b",
          isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
        )}>
          <div className="flex items-center gap-3">
            <Button 
              size="sm"
              variant="outline"
              onClick={() => navigate('/quiz')}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Quizzes
            </Button>
            <h1 className={cn(
              "text-lg font-semibold",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              {currentQuiz.title}
            </h1>
          </div>
        </header>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Question Not Found
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              The requested question could not be found.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleAnswerSelect = (optionId: string) => {
    if (selectedAnswer !== null || !currentQuestion) return; // Prevent multiple selections
    setSelectedAnswer(optionId);
    setShowExplanation(true);
    
    // Find the selected option
    const selectedOption = currentQuestion.options.find((opt: any) => opt.id === optionId);
    if (!selectedOption) return;
    
    // Check if the selected option is correct
    const isCorrect = selectedOption.isCorrect || false;
    const points = isCorrect ? currentQuestion.points : 0;
    
    const newAnswer: QuizAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer: selectedOption?.optionText || '',
      isCorrect,
      points,
    };
    
    setAnswers(prev => [...prev, newAnswer]);
    
    if (isCorrect) {
      setScore(prev => prev + points);
    }
  };

  const handleNextQuestion = async () => {
    if (!currentQuiz) return;
    
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setTimeLeft(30);
    } else {
      // Submit quiz
      setIsSubmitting(true);
      try {
        await dispatch(submitQuizAttempt({
          quizId: currentQuiz.id,
          telegramId: MOCK_TELEGRAM_ID,
          answers: answers
        })).unwrap();
        
        setQuizCompleted(true);
        dispatch(showConfetti());
        
        dispatch(addNotification({
          type: 'success',
          title: 'Quiz Completed!',
          message: `You scored ${score} points!`
        }));
      } catch (error: any) {
        dispatch(addNotification({
          type: 'error',
          title: 'Submission Failed',
          message: error || 'Failed to submit quiz'
        }));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setQuizCompleted(false);
    setTimeLeft(30);
    setAnswers([]);
    setIsSubmitting(false);
    dispatch(hideConfetti());
  };

  const getScorePercentage = () => {
    if (!currentQuiz) return 0;
    const totalPoints = currentQuiz.questions.reduce((sum: any, q: any) => sum + q.points, 0);
    return Math.round((score / totalPoints) * 100);
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
    <div className="flex flex-col h-full">
      <Confetti show={showConfettiState} onComplete={() => dispatch(hideConfetti())} />
      
      {/* Header */}
      <header className={cn(
        "flex items-center justify-between p-4 border-b",
        isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
      )}>
        <div className="flex items-center gap-3">
          <Button 
            size="sm"
            variant="outline"
            onClick={() => navigate('/quiz')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          <h1 className={cn(
            "text-lg font-semibold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            {currentQuiz.title}
          </h1>
        </div>
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold",
                    isDarkMode ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700"
                  )}>
                    {currentQuestionIndex + 1}
                  </div>
                  <div>
                    <span className={cn(
                      "text-sm font-medium",
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    )}>
                      Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}
                    </span>
                    <div className={cn(
                      "text-xs",
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    )}>
                      {Math.round(((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100)}% Complete
                    </div>
                  </div>
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
                "w-full bg-gray-200 rounded-full h-3",
                isDarkMode ? "bg-gray-700" : "bg-gray-200"
              )}>
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className={cn(
              "bg-white rounded-lg border border-gray-200 p-6",
              isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
            )}>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className={cn(
                    "inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full",
                    isDarkMode ? "bg-blue-900 text-blue-300" : "bg-blue-100 text-blue-700"
                  )}>
                    {currentQuestion.questionType}
                  </span>
                  <span className={cn(
                    "text-sm font-medium",
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  )}>
                    {currentQuestionIndex + 1}/{currentQuiz.questions.length}
                  </span>
                </div>
                <h2 className={cn(
                  "text-lg font-semibold leading-relaxed",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>
                  {currentQuestion.questionText}
                </h2>
              </div>

              {/* Answer Options */}
              <div className="space-y-3 mb-6">
                {currentQuestion.options.map((option: any, index: number) => {
                  const isSelected = selectedAnswer === option.id;
                  const isCorrect = option.isCorrect || false;
                  const showResults = selectedAnswer !== null;
                  
                  let buttonClasses = "w-full text-left p-4 h-auto justify-start transition-all duration-200";
                  
                  if (!showResults) {
                    // No answer selected yet - normal hover state
                    buttonClasses += " hover:border-gray-400 hover:bg-gray-50";
                  } else {
                    // Answer selected - show results
                    if (isCorrect) {
                      // Correct answer - always green
                      buttonClasses += " border-green-500 bg-green-50 text-green-700";
                    } else if (isSelected) {
                      // Selected but incorrect - red
                      buttonClasses += " border-red-500 bg-red-50 text-red-700";
                    } else {
                      // Not selected and not correct - gray
                      buttonClasses += " border-gray-300 text-gray-500";
                    }
                  }
                  
                  return (
                    <Button
                      key={option.id}
                      onClick={() => handleAnswerSelect(option.id)}
                      disabled={selectedAnswer !== null}
                      variant="outline"
                      className={cn(buttonClasses)}
                    >
                      <div className="flex items-center gap-3">
                        {showResults && (
                          <div className="flex-shrink-0">
                            {isCorrect ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : isSelected ? (
                              <XCircle className="w-5 h-5 text-red-600" />
                            ) : null}
                          </div>
                        )}
                        <span className="font-medium text-sm">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span className="text-sm">{option.optionText}</span>
                      </div>
                    </Button>
                  );
                })}
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
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "text-sm",
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  )}>
                    {currentQuestionIndex + 1} of {currentQuiz.questions.length} questions
                  </div>
                  <Button
                    onClick={handleNextQuestion}
                    variant="primary"
                    icon={<ArrowRight className="w-4 h-4" />}
                    iconPosition="right"
                    disabled={isSubmitting}
                  >
                    {isSubmitting 
                      ? "Submitting..." 
                      : currentQuestionIndex < currentQuiz.questions.length - 1 
                        ? "Next Question" 
                        : "Finish Quiz"
                    }
                  </Button>
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
                Your score: {score} out of {currentQuiz.totalPoints} points
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

              <div className="space-y-3">
                <Button
                  onClick={handleRestartQuiz}
                  variant="primary"
                  icon={<RotateCcw className="w-4 h-4" />}
                  className="w-full"
                >
                  Take Quiz Again
                </Button>
                <Button
                  onClick={() => navigate('/quiz')}
                  variant="outline"
                  icon={<ArrowLeft className="w-4 h-4" />}
                  className="w-full"
                >
                  Back to Quiz List
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

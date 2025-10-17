import {  useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store";
import { fetchQuizzes } from "../../store/slices/quizzesSlice";
import { cn } from "../../lib/utils";
import { HelpCircle, ArrowRight, Clock, Users, Target } from "lucide-react";
import { Button, Skeleton, SkeletonLoader } from "../../components/ui";

interface QuizListPageContext {
  isDarkMode: boolean;
}

export default function QuizListPage() {
  const { isDarkMode } = useOutletContext<QuizListPageContext>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { quizzes, isLoading, error } = useAppSelector((state: any) => state.quizzes);

  useEffect(() => {
    dispatch(fetchQuizzes());
  }, [dispatch]);

  const handleQuizClick = (quizId: string) => {
    navigate(`/quiz/${quizId}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        {/* Header Skeleton */}
        <header className={cn(
          "flex items-center justify-between p-4 border-b",
          isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
        )}>
          <Skeleton height="24px" width="200px" />
          <Skeleton height="24px" width="24px" variant="circular" />
        </header>

        {/* Content Skeleton */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <SkeletonLoader variant="card" count={3} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center h-full">
          <p className={cn(
            "text-red-600",
            isDarkMode ? "text-red-400" : "text-red-600"
          )}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className={cn(
        "flex items-center justify-between p-4 border-b",
        isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
      )}>
        <h1 className={cn(
          "text-lg font-semibold",
          isDarkMode ? "text-white" : "text-gray-900"
        )}>
          Available Quizzes
        </h1>
        <HelpCircle className={cn(
          "w-6 h-6",
          isDarkMode ? "text-gray-400" : "text-gray-600"
        )} />
      </header>

      {/* Quiz List */}
      <div className="flex-1 overflow-y-auto p-4">
        {quizzes.length === 0 ? (
          <div className="text-center py-8">
            <HelpCircle className={cn(
              "w-12 h-12 mx-auto mb-4",
              isDarkMode ? "text-gray-600" : "text-gray-400"
            )} />
            <p className={cn(
              "text-gray-600",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}>
              No quizzes available
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz: any) => (
              <div
                key={quiz.id}
                className={cn(
                  "rounded-lg border p-4 transition-colors cursor-pointer hover:shadow-md",
                  isDarkMode 
                    ? "bg-gray-800 border-gray-700 hover:bg-gray-750" 
                    : "bg-white border-gray-200 hover:bg-gray-50"
                )}
                onClick={() => handleQuizClick(quiz.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={cn(
                      "font-semibold text-lg mb-2",
                      isDarkMode ? "text-white" : "text-gray-900"
                    )}>
                      {quiz.title}
                    </h3>
                    {quiz.description && (
                      <p className={cn(
                        "text-sm mb-3",
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      )}>
                        {quiz.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs">
                      <span className={cn(
                        "px-2 py-1 rounded-full flex items-center gap-1",
                        quiz.difficulty === 'easy' ? "bg-green-100 text-green-700" :
                        quiz.difficulty === 'medium' ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      )}>
                        <Target className="w-3 h-3" />
                        {quiz.difficulty}
                      </span>
                      <span className={cn(
                        "px-2 py-1 rounded-full flex items-center gap-1",
                        isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                      )}>
                        <Users className="w-3 h-3" />
                        {quiz.totalQuestions} questions
                      </span>
                      <span className={cn(
                        "px-2 py-1 rounded-full flex items-center gap-1",
                        isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                      )}>
                        <Clock className="w-3 h-3" />
                        {quiz.durationMinutes} min
                      </span>
                      <span className={cn(
                        "px-2 py-1 rounded-full",
                        isDarkMode ? "bg-blue-900 text-blue-300" : "bg-blue-100 text-blue-700"
                      )}>
                        {quiz.passingScorePercentage}% to pass
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm"
                      variant="primary"
                      icon={<ArrowRight className="w-4 h-4" />}
                    >
                      Start Quiz
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

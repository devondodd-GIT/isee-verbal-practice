// practice.js - Online quiz functionality with timer and profile support

let currentQuiz = [];
let currentQuestionIndex = 0;
let score = 0;
let missedQuestions = [];

// Timer state
let timerEnabled = false;
let timerSeconds = 0;
let timerInterval = null;
let totalTimeUsed = 0;
let questionStartTime = 0;

// Review mode state
let isReviewMode = false;

// DOM Elements
const setupScreen = document.getElementById('setup-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultsScreen = document.getElementById('results-screen');
const setupForm = document.getElementById('setup-form');
const profileBar = document.getElementById('profile-bar');
const timerContainer = document.getElementById('timer-container');
const timerDisplay = document.getElementById('timer-display');
const reviewModeNotice = document.getElementById('review-mode-notice');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await loadData();
    synonymsData = data.synonyms;
    sentencesData = data.sentences;
    console.log('Data loaded successfully');
  } catch (error) {
    console.error('Failed to load data:', error);
    alert('Failed to load question data. Please refresh the page.');
  }
  
  // Check for active profile
  const profile = getActiveProfile();
  if (profile) {
    profileBar.classList.remove('hidden');
    profileBar.style.display = 'flex';
    document.getElementById('practice-profile-name').textContent = profile.name;
  }
  
  // Check for review mode
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('mode') === 'review') {
    isReviewMode = true;
    reviewModeNotice.classList.remove('hidden');
    document.getElementById('setup-title').textContent = 'Practice Review Words';
  }
  
  setupForm.addEventListener('submit', startQuiz);
  document.getElementById('next-btn').addEventListener('click', nextQuestion);
  document.getElementById('retry-btn').addEventListener('click', retryQuiz);
  document.getElementById('new-quiz-btn').addEventListener('click', newQuiz);
});

function startQuiz(e) {
  e.preventDefault();
  
  const config = {
    level: document.getElementById('level-select').value,
    questionType: document.getElementById('type-select').value,
    questionCount: parseInt(document.getElementById('count-select').value)
  };
  
  // Timer config
  const timerValue = document.getElementById('timer-select').value;
  timerEnabled = timerValue !== 'none';
  timerSeconds = timerEnabled ? parseInt(timerValue) : 0;
  
  // Generate quiz based on mode
  if (isReviewMode) {
    currentQuiz = generateReviewQuiz(config);
  } else {
    currentQuiz = generateQuiz(config, synonymsData, sentencesData);
  }
  
  if (currentQuiz.length === 0) {
    if (isReviewMode) {
      alert('No review words available. Complete some practice quizzes first!');
    } else {
      alert('Not enough questions available for the selected options. Try a different level or type.');
    }
    return;
  }
  
  // Reset state
  currentQuestionIndex = 0;
  score = 0;
  missedQuestions = [];
  totalTimeUsed = 0;
  
  // Update UI
  document.getElementById('total-num').textContent = currentQuiz.length;
  
  // Show/hide timer
  if (timerEnabled) {
    timerContainer.classList.remove('hidden');
  } else {
    timerContainer.classList.add('hidden');
  }
  
  // Show quiz screen
  setupScreen.classList.add('hidden');
  resultsScreen.classList.add('hidden');
  quizScreen.classList.remove('hidden');
  
  showQuestion();
}

function generateReviewQuiz(config) {
  const { level, questionType, questionCount } = config;
  const reviewWords = getReviewWords(level, questionType === 'mixed' ? 'all' : questionType);
  
  if (reviewWords.length === 0) return [];
  
  const questions = [];
  
  // Create questions from review words
  for (const reviewWord of reviewWords) {
    if (reviewWord.type === 'synonym') {
      // Find the word in synonyms data
      const wordData = synonymsData.find(w => w.word === reviewWord.word);
      if (wordData) {
        questions.push(createSynonymQuestion(wordData, synonymsData));
      }
    } else {
      // Find the word in sentences data
      const wordData = sentencesData.find(w => w.word === reviewWord.word);
      if (wordData) {
        questions.push(createSentenceQuestion(wordData, sentencesData));
      }
    }
    
    if (questions.length >= questionCount) break;
  }
  
  return shuffle(questions);
}

function showQuestion() {
  const question = currentQuiz[currentQuestionIndex];
  
  // Update progress
  document.getElementById('current-num').textContent = currentQuestionIndex + 1;
  const progress = ((currentQuestionIndex) / currentQuiz.length) * 100;
  document.getElementById('progress-fill').style.width = `${progress}%`;
  
  // Update question type badge
  const badge = document.getElementById('question-type-badge');
  badge.textContent = question.type === 'synonym' ? 'Synonym' : 'Sentence Completion';
  badge.className = `question-type-badge ${question.type}`;
  
  // Update prompt
  const promptEl = document.getElementById('question-prompt');
  if (question.type === 'synonym') {
    promptEl.innerHTML = `<strong>${capitalize(question.prompt)}</strong>`;
  } else {
    // Replace blank placeholder with styled blank (handles various formats: ___, -------, etc.)
    const sentenceHtml = question.prompt.replace(/[-_]{3,}/g, '<span class="blank"></span>');
    promptEl.innerHTML = sentenceHtml;
  }
  
  // Create option buttons
  const optionsContainer = document.getElementById('options-container');
  optionsContainer.innerHTML = '';
  
  question.options.forEach((option, index) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
    btn.dataset.answer = option;
    btn.addEventListener('click', () => selectAnswer(btn, option));
    optionsContainer.appendChild(btn);
  });
  
  // Hide feedback
  document.getElementById('feedback-container').classList.add('hidden');
  
  // Start timer if enabled
  if (timerEnabled) {
    startTimer();
  }
  questionStartTime = Date.now();
}

function startTimer() {
  let remaining = timerSeconds;
  updateTimerDisplay(remaining);
  
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    remaining--;
    updateTimerDisplay(remaining);
    
    if (remaining <= 0) {
      clearInterval(timerInterval);
      timeOut();
    }
  }, 1000);
}

function updateTimerDisplay(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  timerDisplay.textContent = mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `0:${secs.toString().padStart(2, '0')}`;
  
  // Update color based on time remaining
  timerDisplay.classList.remove('warning', 'danger');
  if (seconds <= 5) {
    timerDisplay.classList.add('danger');
  } else if (seconds <= 10) {
    timerDisplay.classList.add('warning');
  }
}

function stopTimer() {
  clearInterval(timerInterval);
  const timeUsed = Math.round((Date.now() - questionStartTime) / 1000);
  totalTimeUsed += timeUsed;
}

function timeOut() {
  // Auto-select wrong answer (null)
  const question = currentQuiz[currentQuestionIndex];
  
  // Disable all buttons and show correct
  const buttons = document.querySelectorAll('.option-btn');
  buttons.forEach(b => {
    b.disabled = true;
    if (b.dataset.answer === question.correctAnswer) {
      b.classList.add('correct');
    }
  });
  
  // Track as missed
  missedQuestions.push({
    ...question,
    selectedAnswer: '(time expired)'
  });
  
  // Save to review words if profile active
  saveToReviewWords(question);
  
  // Show feedback
  const feedbackContainer = document.getElementById('feedback-container');
  const feedback = document.getElementById('feedback');
  feedback.className = 'feedback incorrect';
  feedback.innerHTML = `⏱️ Time's up! The correct answer is <strong>${question.correctAnswer}</strong>`;
  feedbackContainer.classList.remove('hidden');
  
  // Update next button
  updateNextButton();
}

function selectAnswer(btn, selectedAnswer) {
  stopTimer();
  
  const question = currentQuiz[currentQuestionIndex];
  const isCorrect = selectedAnswer === question.correctAnswer;
  
  // Disable all buttons
  const buttons = document.querySelectorAll('.option-btn');
  buttons.forEach(b => {
    b.disabled = true;
    if (b.dataset.answer === question.correctAnswer) {
      b.classList.add('correct');
    } else if (b === btn && !isCorrect) {
      b.classList.add('incorrect');
    }
  });
  
  // Update score
  if (isCorrect) {
    score++;
    // Remove from review words if in review mode and answered correctly
    if (isReviewMode) {
      removeWordFromReview(question.correctAnswer, question.type);
    }
  } else {
    missedQuestions.push({
      ...question,
      selectedAnswer
    });
    // Save to review words if profile active
    saveToReviewWords(question);
  }
  
  // Show feedback
  const feedbackContainer = document.getElementById('feedback-container');
  const feedback = document.getElementById('feedback');
  
  if (isCorrect) {
    feedback.className = 'feedback correct';
    feedback.innerHTML = '✓ Correct!';
  } else {
    feedback.className = 'feedback incorrect';
    feedback.innerHTML = `✗ The correct answer is <strong>${question.correctAnswer}</strong>`;
  }
  
  feedbackContainer.classList.remove('hidden');
  updateNextButton();
}

function saveToReviewWords(question) {
  const profile = getActiveProfile();
  if (!profile) return;
  
  const word = question.correctAnswer;
  const type = question.type;
  const level = question.level;
  const sentence = question.type === 'sentence' ? question.prompt : null;
  
  addWordToReview(word, type, level, sentence);
}

function updateNextButton() {
  const nextBtn = document.getElementById('next-btn');
  if (currentQuestionIndex === currentQuiz.length - 1) {
    nextBtn.textContent = 'See Results';
  } else {
    nextBtn.textContent = 'Next Question';
  }
}

function nextQuestion() {
  currentQuestionIndex++;
  
  if (currentQuestionIndex >= currentQuiz.length) {
    showResults();
  } else {
    showQuestion();
  }
}

function showResults() {
  clearInterval(timerInterval);
  quizScreen.classList.add('hidden');
  resultsScreen.classList.remove('hidden');
  
  // Calculate percentage
  const percentage = Math.round((score / currentQuiz.length) * 100);
  
  document.getElementById('final-score').textContent = `${percentage}%`;
  document.getElementById('correct-count').textContent = score;
  document.getElementById('total-count').textContent = currentQuiz.length;
  
  // Show time if timer was used
  const timeResult = document.getElementById('time-result');
  if (timerEnabled && totalTimeUsed > 0) {
    timeResult.textContent = `Total time: ${formatTime(totalTimeUsed)}`;
  } else {
    timeResult.textContent = '';
  }
  
  // Save results to profile
  const profile = getActiveProfile();
  if (profile) {
    const level = document.getElementById('level-select').value;
    const type = document.getElementById('type-select').value;
    recordQuizResult(score, currentQuiz.length, level, type, timerEnabled ? totalTimeUsed : null);
  }
  
  // Show missed questions
  const missedContainer = document.getElementById('missed-questions');
  
  if (missedQuestions.length === 0) {
    missedContainer.innerHTML = '<p class="text-light">Perfect score! No questions to review.</p>';
  } else {
    missedContainer.innerHTML = missedQuestions.map((q, i) => `
      <div class="card" style="padding: var(--space-md); margin-bottom: var(--space-sm);">
        <span class="question-type-badge ${q.type}" style="margin-bottom: var(--space-xs);">
          ${q.type === 'synonym' ? 'Synonym' : 'Sentence'}
        </span>
        <p style="margin-bottom: var(--space-sm);">
          ${q.type === 'synonym' 
            ? `<strong>${capitalize(q.prompt)}</strong>` 
            : q.prompt.replace(/[-_]{3,}/g, '<span style="border-bottom: 2px solid var(--color-primary); display: inline-block; min-width: 80px;">&nbsp;</span>')}
        </p>
        <p class="text-light" style="font-size: 0.9rem;">
          Your answer: <span style="color: var(--color-error);">${q.selectedAnswer}</span> · 
          Correct: <span style="color: var(--color-success); font-weight: 600;">${q.correctAnswer}</span>
        </p>
      </div>
    `).join('');
  }
}

function retryQuiz() {
  // Reset and retry same quiz
  currentQuestionIndex = 0;
  score = 0;
  missedQuestions = [];
  totalTimeUsed = 0;
  currentQuiz = shuffle(currentQuiz); // Reshuffle questions
  
  // Re-shuffle options for each question
  currentQuiz.forEach(q => {
    q.options = shuffle(q.options);
  });
  
  document.getElementById('total-num').textContent = currentQuiz.length;
  
  resultsScreen.classList.add('hidden');
  quizScreen.classList.remove('hidden');
  
  showQuestion();
}

function newQuiz() {
  clearInterval(timerInterval);
  resultsScreen.classList.add('hidden');
  quizScreen.classList.add('hidden');
  setupScreen.classList.remove('hidden');
}

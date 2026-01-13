// flashcards.js - Flashcard study functionality

let currentCards = [];
let currentCardIndex = 0;
let sessionKnown = 0;
let sessionLearning = 0;

// DOM Elements
const setupScreen = document.getElementById('setup-screen');
const studyScreen = document.getElementById('study-screen');
const resultsScreen = document.getElementById('results-screen');
const flashcardForm = document.getElementById('flashcard-form');
const flashcard = document.getElementById('flashcard');
const fcWord = document.getElementById('fc-word');
const fcSynonym = document.getElementById('fc-synonym');
const fcStats = document.getElementById('fc-stats');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await loadData();
    synonymsData = data.synonyms;
    console.log('Data loaded successfully');
    
    // Show stats if profile exists
    updateSetupStats();
  } catch (error) {
    console.error('Failed to load data:', error);
    alert('Failed to load flashcard data. Please refresh the page.');
  }
  
  // Event listeners
  flashcardForm.addEventListener('submit', startStudying);
  flashcard.addEventListener('click', flipCard);
  document.getElementById('btn-prev').addEventListener('click', prevCard);
  document.getElementById('btn-next').addEventListener('click', nextCard);
  document.getElementById('btn-know-it').addEventListener('click', markAsKnown);
  document.getElementById('btn-still-learning').addEventListener('click', markAsLearning);
  document.getElementById('btn-end-session').addEventListener('click', endSession);
  document.getElementById('btn-study-again').addEventListener('click', studyAgain);
  
  // Keyboard navigation
  document.addEventListener('keydown', handleKeyboard);
});

function updateSetupStats() {
  const profile = getActiveProfile();
  if (!profile) {
    fcStats.classList.add('hidden');
    return;
  }
  
  fcStats.classList.remove('hidden');
  
  const knownCount = profile.flashcardProgress.known.length;
  const totalWords = synonymsData.length;
  const learningCount = totalWords - knownCount;
  
  document.getElementById('fc-stat-known').textContent = knownCount;
  document.getElementById('fc-stat-learning').textContent = learningCount;
  document.getElementById('fc-stat-total').textContent = totalWords;
}

function startStudying(e) {
  e.preventDefault();
  
  const level = document.getElementById('fc-level').value;
  const mode = document.getElementById('fc-mode').value;
  const countValue = document.getElementById('fc-count').value;
  const shouldShuffle = document.getElementById('fc-shuffle').checked;
  
  // Get words based on filters
  let words = filterByLevel(synonymsData, level);
  
  // Filter by mode
  const profile = getActiveProfile();
  if (mode === 'review' && profile) {
    const reviewWords = getReviewWords(level, 'synonym');
    const reviewWordSet = new Set(reviewWords.map(w => w.word));
    words = words.filter(w => reviewWordSet.has(w.word));
  } else if (mode === 'learning' && profile) {
    const knownWords = new Set(profile.flashcardProgress.known);
    words = words.filter(w => !knownWords.has(w.word));
  }
  
  if (words.length === 0) {
    if (mode === 'review') {
      alert('No review words available for flashcards. Complete some quizzes first!');
    } else if (mode === 'learning') {
      alert('You\'ve marked all words as known! Try "All Words" mode.');
    } else {
      alert('No words available for the selected level.');
    }
    return;
  }
  
  // Shuffle if requested
  if (shouldShuffle) {
    words = shuffle(words);
  }
  
  // Limit count
  const count = countValue === 'all' ? words.length : Math.min(parseInt(countValue), words.length);
  currentCards = words.slice(0, count);
  
  // Reset session
  currentCardIndex = 0;
  sessionKnown = 0;
  sessionLearning = 0;
  
  // Update UI
  document.getElementById('card-total').textContent = currentCards.length;
  
  // Show study screen
  setupScreen.classList.add('hidden');
  resultsScreen.classList.add('hidden');
  studyScreen.classList.remove('hidden');
  
  showCard();
}

function showCard() {
  const card = currentCards[currentCardIndex];
  
  // Reset flip state
  flashcard.classList.remove('flipped');
  
  // Update content
  fcWord.textContent = capitalize(card.word);
  fcSynonym.textContent = card.synonym;
  
  // Update progress
  document.getElementById('card-current').textContent = currentCardIndex + 1;
  const progress = ((currentCardIndex) / currentCards.length) * 100;
  document.getElementById('fc-progress-fill').style.width = `${progress}%`;
  
  // Update known indicator
  const knownIndicator = document.getElementById('card-known-indicator');
  if (isWordKnown(card.word)) {
    knownIndicator.classList.remove('hidden');
  } else {
    knownIndicator.classList.add('hidden');
  }
  
  // Update navigation buttons
  document.getElementById('btn-prev').disabled = currentCardIndex === 0;
  
  const nextBtn = document.getElementById('btn-next');
  if (currentCardIndex === currentCards.length - 1) {
    nextBtn.textContent = 'Finish';
  } else {
    nextBtn.textContent = 'Next →';
  }
}

function flipCard() {
  flashcard.classList.toggle('flipped');
}

function prevCard() {
  if (currentCardIndex > 0) {
    currentCardIndex--;
    showCard();
  }
}

function nextCard() {
  if (currentCardIndex < currentCards.length - 1) {
    currentCardIndex++;
    showCard();
  } else {
    endSession();
  }
}

function markAsKnown() {
  const card = currentCards[currentCardIndex];
  
  if (!isWordKnown(card.word)) {
    markWordAsKnown(card.word);
    sessionKnown++;
    
    // Update indicator
    document.getElementById('card-known-indicator').classList.remove('hidden');
  }
  
  // Auto-advance after short delay
  setTimeout(() => {
    if (currentCardIndex < currentCards.length - 1) {
      nextCard();
    }
  }, 300);
}

function markAsLearning() {
  const card = currentCards[currentCardIndex];
  
  if (isWordKnown(card.word)) {
    unmarkWordAsKnown(card.word);
    sessionKnown = Math.max(0, sessionKnown - 1);
  }
  sessionLearning++;
  
  // Update indicator
  document.getElementById('card-known-indicator').classList.add('hidden');
  
  // Auto-advance
  setTimeout(() => {
    if (currentCardIndex < currentCards.length - 1) {
      nextCard();
    }
  }, 300);
}

function endSession() {
  studyScreen.classList.add('hidden');
  resultsScreen.classList.remove('hidden');
  
  document.getElementById('session-known').textContent = sessionKnown;
  document.getElementById('result-reviewed').textContent = currentCards.length;
  document.getElementById('result-learning').textContent = currentCards.length - sessionKnown;
}

function studyAgain() {
  resultsScreen.classList.add('hidden');
  setupScreen.classList.remove('hidden');
  updateSetupStats();
}

function handleKeyboard(e) {
  // Only handle if study screen is visible
  if (studyScreen.classList.contains('hidden')) return;
  
  switch (e.key) {
    case ' ':
    case 'Enter':
      e.preventDefault();
      flipCard();
      break;
    case 'ArrowLeft':
      prevCard();
      break;
    case 'ArrowRight':
      nextCard();
      break;
    case '1':
    case 'l':
      markAsLearning();
      break;
    case '2':
    case 'k':
      markAsKnown();
      break;
  }
}

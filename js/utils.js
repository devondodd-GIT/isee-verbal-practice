// utils.js - Shared utility functions

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Get random items from an array
 */
function getRandomItems(array, count) {
  const shuffled = shuffle(array);
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * Filter data by level
 */
function filterByLevel(data, level) {
  if (level === 'all') return data;
  return data.filter(item => item.level === level);
}

/**
 * Generate distractors for a synonym question
 * Returns 3 wrong answers from the same level
 */
function generateSynonymDistractors(correctWord, allSynonyms, level) {
  const sameLevel = filterByLevel(allSynonyms, level);
  const otherWords = sameLevel.filter(item => 
    item.word !== correctWord && item.synonym !== correctWord
  );
  
  // Get random synonyms as distractors (using the synonym field, not the word)
  const distractors = getRandomItems(otherWords, 3).map(item => item.synonym);
  return distractors;
}

/**
 * Generate distractors for a sentence completion question
 * Returns 3 wrong answers from the same level
 */
function generateSentenceDistractors(correctWord, allSentences, level) {
  const sameLevel = filterByLevel(allSentences, level);
  const otherWords = sameLevel.filter(item => item.word !== correctWord);
  
  const distractors = getRandomItems(otherWords, 3).map(item => item.word);
  return distractors;
}

/**
 * Create a synonym question object
 */
function createSynonymQuestion(wordData, allSynonyms) {
  const distractors = generateSynonymDistractors(wordData.word, allSynonyms, wordData.level);
  const options = shuffle([wordData.synonym, ...distractors]);
  
  return {
    type: 'synonym',
    prompt: wordData.word,
    correctAnswer: wordData.synonym,
    options: options,
    level: wordData.level
  };
}

/**
 * Create a sentence completion question object
 */
function createSentenceQuestion(wordData, allSentences) {
  const distractors = generateSentenceDistractors(wordData.word, allSentences, wordData.level);
  const options = shuffle([wordData.word, ...distractors]);
  
  // Pick a random sentence from the three available
  const sentence = wordData.sentences[Math.floor(Math.random() * wordData.sentences.length)];
  
  return {
    type: 'sentence',
    prompt: sentence,
    correctAnswer: wordData.word,
    options: options,
    level: wordData.level
  };
}

/**
 * Generate a quiz with specified parameters
 */
function generateQuiz(config, synonymsData, sentencesData) {
  const { level, questionType, questionCount } = config;
  
  const questions = [];
  
  if (questionType === 'synonyms' || questionType === 'mixed') {
    const filteredSynonyms = filterByLevel(synonymsData, level);
    const synonymQuestions = getRandomItems(filteredSynonyms, 
      questionType === 'mixed' ? Math.ceil(questionCount / 2) : questionCount
    ).map(data => createSynonymQuestion(data, synonymsData));
    questions.push(...synonymQuestions);
  }
  
  if (questionType === 'sentences' || questionType === 'mixed') {
    const filteredSentences = filterByLevel(sentencesData, level);
    const sentenceQuestions = getRandomItems(filteredSentences,
      questionType === 'mixed' ? Math.floor(questionCount / 2) : questionCount
    ).map(data => createSentenceQuestion(data, sentencesData));
    questions.push(...sentenceQuestions);
  }
  
  return shuffle(questions).slice(0, questionCount);
}

/**
 * Format level for display
 */
function formatLevel(level) {
  const levels = {
    'lower': 'Lower Level',
    'middle': 'Middle Level',
    'upper': 'Upper Level',
    'all': 'All Levels'
  };
  return levels[level] || level;
}

/**
 * Capitalize first letter
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

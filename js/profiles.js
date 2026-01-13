// profiles.js - Student profile management with localStorage

const STORAGE_KEY = 'isee_verbal_profiles';
const ACTIVE_PROFILE_KEY = 'isee_verbal_active_profile';

/**
 * Profile data structure:
 * {
 *   id: string,
 *   name: string,
 *   createdAt: number (timestamp),
 *   stats: {
 *     totalQuizzes: number,
 *     totalQuestions: number,
 *     totalCorrect: number,
 *     quizHistory: [{ date, level, type, score, total, timeUsed }]
 *   },
 *   reviewWords: [{ word, type, level, missedCount, lastMissed, sentence? }],
 *   flashcardProgress: {
 *     known: [word strings],
 *     lastStudied: timestamp
 *   }
 * }
 */

// Generate simple unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Get all profiles
function getAllProfiles() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

// Save all profiles
function saveAllProfiles(profiles) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

// Get active profile ID
function getActiveProfileId() {
  return localStorage.getItem(ACTIVE_PROFILE_KEY);
}

// Set active profile
function setActiveProfile(profileId) {
  localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
}

// Clear active profile
function clearActiveProfile() {
  localStorage.removeItem(ACTIVE_PROFILE_KEY);
}

// Get active profile data
function getActiveProfile() {
  const profileId = getActiveProfileId();
  if (!profileId) return null;
  
  const profiles = getAllProfiles();
  return profiles.find(p => p.id === profileId) || null;
}

// Create new profile
function createProfile(name) {
  const profiles = getAllProfiles();
  
  // Check for duplicate name
  if (profiles.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    throw new Error('A profile with this name already exists');
  }
  
  const newProfile = {
    id: generateId(),
    name: name.trim(),
    createdAt: Date.now(),
    stats: {
      totalQuizzes: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      quizHistory: []
    },
    reviewWords: [],
    flashcardProgress: {
      known: [],
      lastStudied: null
    }
  };
  
  profiles.push(newProfile);
  saveAllProfiles(profiles);
  setActiveProfile(newProfile.id);
  
  return newProfile;
}

// Update profile
function updateProfile(profileId, updates) {
  const profiles = getAllProfiles();
  const index = profiles.findIndex(p => p.id === profileId);
  
  if (index === -1) {
    throw new Error('Profile not found');
  }
  
  profiles[index] = { ...profiles[index], ...updates };
  saveAllProfiles(profiles);
  
  return profiles[index];
}

// Delete profile
function deleteProfile(profileId) {
  let profiles = getAllProfiles();
  profiles = profiles.filter(p => p.id !== profileId);
  saveAllProfiles(profiles);
  
  // Clear active if deleted
  if (getActiveProfileId() === profileId) {
    clearActiveProfile();
  }
}

// Record quiz results
function recordQuizResult(score, total, level, type, timeUsed = null) {
  const profile = getActiveProfile();
  if (!profile) return null;
  
  const historyEntry = {
    date: Date.now(),
    level,
    type,
    score,
    total,
    timeUsed
  };
  
  // Keep last 50 quizzes
  const history = [historyEntry, ...profile.stats.quizHistory].slice(0, 50);
  
  const updates = {
    stats: {
      ...profile.stats,
      totalQuizzes: profile.stats.totalQuizzes + 1,
      totalQuestions: profile.stats.totalQuestions + total,
      totalCorrect: profile.stats.totalCorrect + score,
      quizHistory: history
    }
  };
  
  return updateProfile(profile.id, updates);
}

// Add word to review list
function addWordToReview(word, type, level, sentence = null) {
  const profile = getActiveProfile();
  if (!profile) return null;
  
  const reviewWords = [...profile.reviewWords];
  const existingIndex = reviewWords.findIndex(w => w.word === word && w.type === type);
  
  if (existingIndex >= 0) {
    // Increment miss count
    reviewWords[existingIndex].missedCount++;
    reviewWords[existingIndex].lastMissed = Date.now();
  } else {
    // Add new word
    reviewWords.push({
      word,
      type,
      level,
      sentence,
      missedCount: 1,
      lastMissed: Date.now()
    });
  }
  
  return updateProfile(profile.id, { reviewWords });
}

// Remove word from review list (mastered)
function removeWordFromReview(word, type) {
  const profile = getActiveProfile();
  if (!profile) return null;
  
  const reviewWords = profile.reviewWords.filter(
    w => !(w.word === word && w.type === type)
  );
  
  return updateProfile(profile.id, { reviewWords });
}

// Get review words (optionally filtered by level or type)
function getReviewWords(level = 'all', type = 'all') {
  const profile = getActiveProfile();
  if (!profile) return [];
  
  let words = [...profile.reviewWords];
  
  if (level !== 'all') {
    words = words.filter(w => w.level === level);
  }
  
  if (type !== 'all') {
    words = words.filter(w => w.type === type);
  }
  
  // Sort by most missed
  return words.sort((a, b) => b.missedCount - a.missedCount);
}

// Mark word as known in flashcards
function markWordAsKnown(word) {
  const profile = getActiveProfile();
  if (!profile) return null;
  
  const known = [...profile.flashcardProgress.known];
  if (!known.includes(word)) {
    known.push(word);
  }
  
  return updateProfile(profile.id, {
    flashcardProgress: {
      ...profile.flashcardProgress,
      known,
      lastStudied: Date.now()
    }
  });
}

// Unmark word as known
function unmarkWordAsKnown(word) {
  const profile = getActiveProfile();
  if (!profile) return null;
  
  const known = profile.flashcardProgress.known.filter(w => w !== word);
  
  return updateProfile(profile.id, {
    flashcardProgress: {
      ...profile.flashcardProgress,
      known
    }
  });
}

// Check if word is known
function isWordKnown(word) {
  const profile = getActiveProfile();
  if (!profile) return false;
  
  return profile.flashcardProgress.known.includes(word);
}

// Get profile statistics
function getProfileStats() {
  const profile = getActiveProfile();
  if (!profile) return null;
  
  const { stats, reviewWords } = profile;
  
  // Calculate accuracy
  const accuracy = stats.totalQuestions > 0 
    ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) 
    : 0;
  
  // Recent performance (last 5 quizzes)
  const recentQuizzes = stats.quizHistory.slice(0, 5);
  const recentAccuracy = recentQuizzes.length > 0
    ? Math.round(
        (recentQuizzes.reduce((sum, q) => sum + q.score, 0) / 
         recentQuizzes.reduce((sum, q) => sum + q.total, 0)) * 100
      )
    : 0;
  
  return {
    totalQuizzes: stats.totalQuizzes,
    totalQuestions: stats.totalQuestions,
    totalCorrect: stats.totalCorrect,
    accuracy,
    recentAccuracy,
    wordsToReview: reviewWords.length,
    quizHistory: stats.quizHistory,
    memberSince: profile.createdAt
  };
}

// Format date for display
function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Format time duration
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

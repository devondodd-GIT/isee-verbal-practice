// worksheet.js - Worksheet generation functionality

let currentWorksheet = [];

// DOM Elements
const worksheetForm = document.getElementById('worksheet-form');
const worksheetContainer = document.getElementById('worksheet-container');
const worksheetPreview = document.getElementById('worksheet-preview');
const printBtn = document.getElementById('print-btn');

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
  
  worksheetForm.addEventListener('submit', generateWorksheet);
  printBtn.addEventListener('click', () => window.print());
});

function generateWorksheet(e) {
  e.preventDefault();
  
  const config = {
    level: document.getElementById('ws-level').value,
    questionType: document.getElementById('ws-type').value,
    questionCount: parseInt(document.getElementById('ws-count').value)
  };
  
  const customTitle = document.getElementById('ws-title').value.trim();
  const includeAnswerKey = document.getElementById('ws-answer-key').checked;
  
  // Generate questions
  currentWorksheet = generateQuiz(config, synonymsData, sentencesData);
  
  if (currentWorksheet.length === 0) {
    alert('Not enough questions available for the selected options. Try a different level or type.');
    return;
  }
  
  // Build worksheet HTML
  const worksheetHtml = buildWorksheetHtml(currentWorksheet, {
    level: config.level,
    type: config.questionType,
    customTitle,
    includeAnswerKey
  });
  
  worksheetPreview.innerHTML = worksheetHtml;
  
  // Show preview and print button
  worksheetContainer.classList.remove('hidden');
  printBtn.classList.remove('hidden');
  
  // Scroll to preview
  worksheetContainer.scrollIntoView({ behavior: 'smooth' });
}

function buildWorksheetHtml(questions, options) {
  const { level, type, customTitle, includeAnswerKey } = options;
  
  // Title
  const mainTitle = customTitle || 'ISEE Verbal Reasoning Practice';
  const subtitle = `${formatLevel(level)} · ${formatQuestionType(type)} · ${questions.length} Questions`;
  
  // Separate by type if mixed
  let synonymQuestions = questions.filter(q => q.type === 'synonym');
  let sentenceQuestions = questions.filter(q => q.type === 'sentence');
  
  let questionsHtml = '';
  let questionNumber = 1;
  
  // If mixed, show synonyms first, then sentences
  if (synonymQuestions.length > 0 && sentenceQuestions.length > 0) {
    questionsHtml += '<div class="print-section-header">Part 1: Synonyms</div>';
    questionsHtml += '<p style="font-style: italic; margin-bottom: 1rem; font-size: 0.9em;">Select the word that is closest in meaning to the word in capital letters.</p>';
    
    synonymQuestions.forEach(q => {
      questionsHtml += buildQuestionHtml(q, questionNumber++);
    });
    
    questionsHtml += '<div class="print-section-header">Part 2: Sentence Completions</div>';
    questionsHtml += '<p style="font-style: italic; margin-bottom: 1rem; font-size: 0.9em;">Select the word that best completes the sentence.</p>';
    
    sentenceQuestions.forEach(q => {
      questionsHtml += buildQuestionHtml(q, questionNumber++);
    });
  } else {
    // Single type - add instructions
    if (synonymQuestions.length > 0) {
      questionsHtml += '<p style="font-style: italic; margin-bottom: 1.5rem;">Select the word that is closest in meaning to the word in capital letters.</p>';
      synonymQuestions.forEach(q => {
        questionsHtml += buildQuestionHtml(q, questionNumber++);
      });
    } else {
      questionsHtml += '<p style="font-style: italic; margin-bottom: 1.5rem;">Select the word that best completes the sentence.</p>';
      sentenceQuestions.forEach(q => {
        questionsHtml += buildQuestionHtml(q, questionNumber++);
      });
    }
  }
  
  // Answer key
  let answerKeyHtml = '';
  if (includeAnswerKey) {
    answerKeyHtml = buildAnswerKeyHtml(questions);
  }
  
  return `
    <div class="worksheet-header">
      <h1>${mainTitle}</h1>
      <div class="subtitle">${subtitle}</div>
      <div class="student-info">
        <div>Name: <span></span></div>
        <div>Date: <span></span></div>
        <div>Score: <span></span></div>
      </div>
    </div>
    
    <div class="worksheet-questions">
      ${questionsHtml}
    </div>
    
    ${answerKeyHtml}
  `;
}

function buildQuestionHtml(question, number) {
  const optionLetters = ['A', 'B', 'C', 'D'];
  
  let promptHtml;
  if (question.type === 'synonym') {
    promptHtml = question.prompt.toUpperCase();
  } else {
    promptHtml = question.prompt.replace(/[-_]{3,}/g, '<span class="blank"></span>');
  }
  
  const optionsHtml = question.options.map((opt, i) => `
    <div class="print-option">
      <span class="print-option-letter">${optionLetters[i]}.</span>
      <span>${opt}</span>
    </div>
  `).join('');
  
  return `
    <div class="print-question ${question.type}">
      <div class="print-question-prompt">
        <span class="print-question-number">${number}.</span>
        ${promptHtml}
      </div>
      <div class="print-options">
        ${optionsHtml}
      </div>
    </div>
  `;
}

function buildAnswerKeyHtml(questions) {
  const optionLetters = ['A', 'B', 'C', 'D'];
  
  const answersHtml = questions.map((q, i) => {
    const correctIndex = q.options.indexOf(q.correctAnswer);
    const letter = optionLetters[correctIndex];
    return `<div class="answer-key-item"><strong>${i + 1}.</strong> ${letter}</div>`;
  }).join('');
  
  return `
    <div class="answer-key">
      <h2>Answer Key</h2>
      <div class="answer-key-grid">
        ${answersHtml}
      </div>
    </div>
  `;
}

function formatQuestionType(type) {
  const types = {
    'synonyms': 'Synonyms',
    'sentences': 'Sentence Completions',
    'mixed': 'Mixed'
  };
  return types[type] || type;
}

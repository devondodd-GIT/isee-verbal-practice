// data.js - Data loading and management

let synonymsData = [];
let sentencesData = [];
let dataLoaded = false;

/**
 * Load all data files
 */
async function loadData() {
  if (dataLoaded) return { synonyms: synonymsData, sentences: sentencesData };
  
  try {
    const [synonymsResponse, sentencesResponse] = await Promise.all([
      fetch('data/synonyms.json'),
      fetch('data/sentences.json')
    ]);
    
    synonymsData = await synonymsResponse.json();
    sentencesData = await sentencesResponse.json();
    dataLoaded = true;
    
    console.log(`Loaded ${synonymsData.length} synonym entries`);
    console.log(`Loaded ${sentencesData.length} sentence entries`);
    
    return { synonyms: synonymsData, sentences: sentencesData };
  } catch (error) {
    console.error('Error loading data:', error);
    throw error;
  }
}

/**
 * Get available levels from the data
 */
function getAvailableLevels() {
  const synonymLevels = [...new Set(synonymsData.map(item => item.level))];
  const sentenceLevels = [...new Set(sentencesData.map(item => item.level))];
  return [...new Set([...synonymLevels, ...sentenceLevels])].sort();
}

/**
 * Get word count by level
 */
function getWordCountByLevel(level) {
  const synonymCount = filterByLevel(synonymsData, level).length;
  const sentenceCount = filterByLevel(sentencesData, level).length;
  return { synonyms: synonymCount, sentences: sentenceCount };
}

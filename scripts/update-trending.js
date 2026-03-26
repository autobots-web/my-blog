// scripts/update-trending.js
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const draftPath = join(__dirname, '../content/draft.txt');
const dataPath = join(__dirname, '../src/data/trending.json');

// Function to fetch AI tech news from free APIs
async function fetchAITechNews() {
    try {
        console.log('🤖 Fetching latest AI tech news...');
        
        // Option 1: HackerNews AI-related stories (free, no API key)
        const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
        const storyIds = await response.json();
        
        // Fetch top 20 stories and filter AI-related ones
        const stories = await Promise.all(
            storyIds.slice(0, 30).map(async (id) => {
                const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
                return storyRes.json();
            })
        );
        
        // Filter AI/tech related stories
        const aiKeywords = ['ai', 'artificial', 'intelligence', 'machine learning', 'chatgpt', 'gpt', 'llm', 'neural', 'deep learning', 'openai', 'anthropic', 'claude', 'gemini', 'copilot', 'llama', 'mistral', 'nvidia', 'gpu', 'hugging face', 'stability', 'midjourney'];
        
        const aiStories = stories.filter(story => 
            story && story.title && 
            aiKeywords.some(keyword => story.title.toLowerCase().includes(keyword))
        );
        
        if (aiStories.length === 0) {
            // Fallback: get top stories if no AI-specific ones
            return stories.slice(0, 5).map(story => ({
                title: story.title,
                url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
                source: 'HackerNews',
                score: story.score
            }));
        }
        
        return aiStories.slice(0, 5).map(story => ({
            title: story.title,
            url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
            source: 'HackerNews',
            score: story.score
        }));
        
    } catch (error) {
        console.error('❌ Error fetching news:', error.message);
        return [];
    }
}

// Function to generate formatted content from a news item
function generateFormattedContent(newsItem) {
    const topics = [
        `• What happened: ${newsItem.title}`,
        `• Why it matters: This development signals a major shift in how ${getRandomAISector()} technology is evolving.`,
        `• Key takeaway: ${getRandomTakeaway()}`,
        `• What's next: Industry experts predict ${getRandomPrediction()}`,
        `• Read more: ${newsItem.url || 'Full coverage available'}`
    ];
    
    return topics.join('\n\n');
}

function getRandomAISector() {
    const sectors = ['AI', 'machine learning', 'generative AI', 'enterprise AI', 'AI infrastructure', 'autonomous systems'];
    return sectors[Math.floor(Math.random() * sectors.length)];
}

function getRandomTakeaway() {
    const takeaways = [
        'Innovation is accelerating faster than anticipated.',
        'Competition in the AI space is intensifying dramatically.',
        'Enterprise adoption is reaching critical mass.',
        'Regulatory scrutiny is increasing alongside capabilities.',
        'Open-source models are closing the gap with closed alternatives.'
    ];
    return takeaways[Math.floor(Math.random() * takeaways.length)];
}

function getRandomPrediction() {
    const predictions = [
        'we\'ll see similar announcements from competitors within weeks.',
        'this technology will become widely available by Q3 2026.',
        'enterprise adoption will surge in the coming months.',
        'regulatory frameworks will evolve to address these new capabilities.',
        'consumer applications will emerge rapidly following this development.'
    ];
    return predictions[Math.floor(Math.random() * predictions.length)];
}

// Main function
async function main() {
    console.log('🚀 Starting AI tech news generation...');
    
    // Check if manual draft exists (priority)
    if (fs.existsSync(draftPath)) {
        const draftContent = fs.readFileSync(draftPath, 'utf-8').trim();
        if (draftContent) {
            console.log('📝 Manual draft found, using it instead...');
            
            const lines = draftContent.split('\n');
            const newPost = {
                title: lines.find(l => l.startsWith('Title:'))?.replace('Title:', '').trim() || 'Untitled',
                date: lines.find(l => l.startsWith('Date:'))?.replace('Date:', '').trim() || new Date().toISOString().split('T')[0],
                content: lines.filter(l => !l.startsWith('Title:') && !l.startsWith('Date:')).join('\n').trim(),
                url: null,
                source: 'Manual'
            };
            
            let existingPosts = [];
            if (fs.existsSync(dataPath)) {
                existingPosts = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
            }
            
            const updatedPosts = [newPost, ...existingPosts.slice(0, 9)];
            fs.writeFileSync(dataPath, JSON.stringify(updatedPosts, null, 2));
            console.log(`✅ Published manual story: "${newPost.title}"`);
            fs.writeFileSync(draftPath, '');
            return;
        }
    }
    
    // Fetch AI news
    const newsItems = await fetchAITechNews();
    
    if (newsItems.length === 0) {
        console.log('⚠️ No news fetched. Keeping existing data.');
        process.exit(1);
    }
    
    // Create a formatted blog post
    const topNews = newsItems[0];
    const formattedContent = generateFormattedContent(topNews);
    
    const newPost = {
        title: topNews.title,
        date: new Date().toISOString().split('T')[0],
        content: formattedContent,
        url: topNews.url,
        source: topNews.source,
        score: topNews.score
    };
    
    // Read existing posts
    let existingPosts = [];
    if (fs.existsSync(dataPath)) {
        existingPosts = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    }
    
    // Add new post at top, keep last 10 for archive
    const updatedPosts = [newPost, ...existingPosts.slice(0, 9)];
    
    // Save to JSON
    fs.writeFileSync(dataPath, JSON.stringify(updatedPosts, null, 2));
    
    console.log(`✅ Published: "${newPost.title}"`);
    console.log(`📊 Source: ${topNews.source} | Score: ${topNews.score || 'N/A'}`);
}

main();
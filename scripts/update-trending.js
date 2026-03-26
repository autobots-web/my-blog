// scripts/update-trending.js
import fs from 'fs';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current file's directory (for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the trending.json file
const dataPath = join(__dirname, '../src/data/trending.json');

// Function to fetch trending data
async function fetchTrending() {
    try {
        // Using HackerNews API as our source (free, no API key needed)
        console.log('📡 Fetching trending stories from HackerNews...');
        
        // Get top story IDs
        const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
        const storyIds = await response.json();
        
        // Fetch top 5 stories
        const topStories = await Promise.all(
            storyIds.slice(0, 5).map(async (id) => {
                const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
                return storyRes.json();
            })
        );
        
        // Format the data for our blog
        const posts = topStories.map(story => ({
            title: story.title,
            url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
            content: story.text || "No description available.",
            score: story.score,
            date: new Date().toISOString().split('T')[0]
        }));
        
        console.log(`✅ Fetched ${posts.length} trending stories`);
        return posts;
        
    } catch (error) {
        console.error('❌ Error fetching trending data:', error.message);
        // Return empty array if error occurs
        return [];
    }
}

// Main function
async function main() {
    console.log('🚀 Starting daily content update...');
    
    // Fetch trending content
    const trendingPosts = await fetchTrending();
    
    if (trendingPosts.length === 0) {
        console.log('⚠️ No content fetched. Keeping existing data.');
        process.exit(1);
    }
    
    // Write to JSON file
    fs.writeFileSync(dataPath, JSON.stringify(trendingPosts, null, 2));
    console.log(`💾 Saved ${trendingPosts.length} posts to ${dataPath}`);
    
    console.log('✅ Daily update complete!');
}

// Run the script
main();
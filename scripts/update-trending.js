// scripts/update-trending.js
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const draftPath = join(__dirname, '../content/draft.txt');
const dataPath = join(__dirname, '../src/data/trending.json');

// Function to parse the draft file
function parseDraft(content) {
    const lines = content.trim().split('\n');
    const post = {};
    
    for (let line of lines) {
        if (line.startsWith('Title:')) {
            post.title = line.replace('Title:', '').trim();
        } else if (line.startsWith('Date:')) {
            post.date = line.replace('Date:', '').trim();
        } else if (line.startsWith('Content:')) {
            post.content = line.replace('Content:', '').trim();
        }
    }
    
    return post;
}

// Main function
async function main() {
    console.log('📝 Reading draft from content/draft.txt...');
    
    // Check if draft exists
    if (!fs.existsSync(draftPath)) {
        console.log('❌ No draft found at content/draft.txt');
        console.log('💡 Create one with format:');
        console.log('   Title: Your Title');
        console.log('   Date: 2026-03-26');
        console.log('   Content: Your content here');
        process.exit(1);
    }
    
    // Read draft file
    const draftContent = fs.readFileSync(draftPath, 'utf-8');
    const newPost = parseDraft(draftContent);
    
    if (!newPost.title || !newPost.content) {
        console.log('❌ Invalid draft format. Make sure you have Title: and Content: fields');
        process.exit(1);
    }
    
    // Read existing posts
    let existingPosts = [];
    if (fs.existsSync(dataPath)) {
        existingPosts = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    }
    
    // Add new post at the beginning
    const updatedPosts = [newPost, ...existingPosts];
    
    // Save to JSON
    fs.writeFileSync(dataPath, JSON.stringify(updatedPosts, null, 2));
    console.log(`✅ Published: "${newPost.title}"`);
    
    // Clear the draft file
    fs.writeFileSync(draftPath, '');
    console.log('🗑️  Draft cleared');
}

main();
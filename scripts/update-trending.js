// scripts/update-trending.js
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const draftPath = join(__dirname, '../content/draft.txt');
const dataPath = join(__dirname, '../src/data/trending.json');

// Main function
async function main() {
    console.log('📝 Reading draft from content/draft.txt...');
    
    // Check if draft exists
    if (!fs.existsSync(draftPath)) {
        console.log('❌ No draft found at content/draft.txt');
        console.log('');
        console.log('💡 CREATE YOUR DRAFT with this format:');
        console.log('   Title: Your Article Title Here');
        console.log('   Date: 2026-03-26');
        console.log('   Content: Your article content here.');
        console.log('');
        console.log('   For better formatting, use bullet points:');
        console.log('   • Point one');
        console.log('   • Point two');
        console.log('   • Point three');
        process.exit(1);
    }
    
    // Read draft file
    const draftContent = fs.readFileSync(draftPath, 'utf-8').trim();
    
    if (!draftContent) {
        console.log('❌ Draft file is empty. Add content first.');
        process.exit(1);
    }
    
    // Parse the draft
    const lines = draftContent.split('\n');
    let title = '';
    let date = new Date().toISOString().split('T')[0];
    let contentLines = [];
    
    for (const line of lines) {
        if (line.startsWith('Title:')) {
            title = line.replace('Title:', '').trim();
        } else if (line.startsWith('Date:')) {
            date = line.replace('Date:', '').trim();
        } else {
            contentLines.push(line);
        }
    }
    
    if (!title) {
        console.log('❌ Missing Title: field in your draft');
        console.log('   Add: Title: Your Article Title');
        process.exit(1);
    }
    
    const content = contentLines.join('\n').trim();
    
    if (!content) {
        console.log('❌ No content found in draft');
        process.exit(1);
    }
    
    // Create new post object
    const newPost = {
        title: title,
        date: date,
        content: content,
        url: null,
        source: 'Manual'
    };
    
    // Read existing posts
    let existingPosts = [];
    if (fs.existsSync(dataPath)) {
        existingPosts = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    }
    
    // Add new post at top, keep last 20 for archive
    const updatedPosts = [newPost, ...existingPosts.slice(0, 19)];
    
    // Save to JSON
    fs.writeFileSync(dataPath, JSON.stringify(updatedPosts, null, 2));
    
    console.log('');
    console.log(`✅ PUBLISHED: "${title}"`);
    console.log(`📅 Date: ${date}`);
    console.log(`📝 Content length: ${content.length} characters`);
    console.log('');
    console.log('📊 Archive now has', updatedPosts.length, 'stories');
    
    // Clear the draft file
    fs.writeFileSync(draftPath, '');
    console.log('');
    console.log('🗑️  Draft cleared. Ready for next story.');
}

main();
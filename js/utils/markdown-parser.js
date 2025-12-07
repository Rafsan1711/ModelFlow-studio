/**
 * ============================================
 * MARKDOWN PARSER - SIMPLE WORKING VERSION
 * ============================================
 */

/**
 * Parse markdown to HTML
 */
export function parseMarkdown(text) {
    let html = escapeHtml(text);

    // Headings
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Code blocks (with language)
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        const language = lang || 'code';
        const blockId = `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return `
            <div class="code-block">
                <div class="code-block-header">
                    <span class="code-language">${language}</span>
                    <button class="copy-code-btn" onclick="copyCodeBlock('${blockId}')">Copy</button>
                </div>
                <pre><code id="${blockId}">${code.trim()}</code></pre>
            </div>
        `;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Unordered lists
    html = html.replace(/^\- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Blockquotes
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr>');

    // Tables
    html = parseTable(html);

    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');

    // Wrap in paragraphs
    html = `<p>${html}</p>`;

    // Clean up
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p><br><\/p>/g, '');
    html = html.replace(/<p>(<h[1-3]>.*?<\/h[1-3]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>.*?<\/ul>)<\/p>/gs, '$1');
    html = html.replace(/<p>(<ol>.*?<\/ol>)<\/p>/gs, '$1');
    html = html.replace(/<p>(<blockquote>.*?<\/blockquote>)<\/p>/gs, '$1');
    html = html.replace(/<p>(<hr>)<\/p>/g, '$1');
    html = html.replace(/<p>(<table>.*?<\/table>)<\/p>/gs, '$1');
    html = html.replace(/<p>(<div class="code-block">.*?<\/div>)<\/p>/gs, '$1');

    return html;
}

/**
 * Parse table
 */
function parseTable(text) {
    const lines = text.split('\n');
    let result = [];
    let inTable = false;
    let tableRows = [];

    lines.forEach(line => {
        if (line.trim().startsWith('|')) {
            if (line.match(/^\|[\s-:|]+\|$/)) {
                return; // Skip separator
            }

            if (!inTable) {
                inTable = true;
                tableRows = ['<table><thead>'];
            }

            const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
            
            if (tableRows.length === 1) {
                tableRows.push(`<tr>${cells.map(c => `<th>${c}</th>`).join('')}</tr>`);
                tableRows.push('</thead><tbody>');
            } else {
                tableRows.push(`<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`);
            }
        } else {
            if (inTable) {
                tableRows.push('</tbody></table>');
                result.push(tableRows.join(''));
                inTable = false;
                tableRows = [];
            }
            result.push(line);
        }
    });

    if (inTable) {
        tableRows.push('</tbody></table>');
        result.push(tableRows.join(''));
    }

    return result.join('\n');
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Copy code block (global function)
 */
window.copyCodeBlock = function(blockId) {
    const codeEl = document.getElementById(blockId);
    if (!codeEl) return;
    
    navigator.clipboard.writeText(codeEl.textContent).then(() => {
        const btn = codeEl.closest('.code-block').querySelector('.copy-code-btn');
        btn.textContent = 'Copied!';
        btn.style.background = 'rgba(16, 185, 129, 0.2)';
        btn.style.color = '#10b981';
        
        setTimeout(() => {
            btn.textContent = 'Copy';
            btn.style.background = '';
            btn.style.color = '';
        }, 2000);
    }).catch(err => {
        console.error('Copy failed:', err);
    });
};

console.log('📦 Markdown Parser loaded');

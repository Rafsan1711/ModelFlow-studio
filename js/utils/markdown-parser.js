/**
 * ============================================
 * FIXED PROFESSIONAL MARKDOWN PARSER
 * Properly renders code blocks and tables
 * ============================================
 */

/**
 * Parse markdown to beautiful HTML (FIXED)
 */
export function parseMarkdown(text) {
    if (!text) return '';

    let html = text;

    // Code blocks FIRST (preserve them) - FIXED
    const codeBlocks = [];
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
        const placeholder = `___CODE_BLOCK_${codeBlocks.length}___`;
        codeBlocks.push({ language: language || 'plaintext', code: code.trim() });
        return placeholder;
    });

    // Inline code (preserve)
    const inlineCodes = [];
    html = html.replace(/`([^`]+)`/g, (match, code) => {
        const placeholder = `___INLINE_CODE_${inlineCodes.length}___`;
        inlineCodes.push(code);
        return placeholder;
    });

    // Escape HTML
    html = escapeHtml(html);

    // Headings
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Bold (must come before italic)
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*([^\*]+?)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+?)_/g, '<em>$1</em>');

    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Blockquotes
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

    // Unordered lists
    html = parseUnorderedLists(html);

    // Ordered lists
    html = parseOrderedLists(html);

    // Tables (FIXED)
    html = parseTables(html);

    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr>');
    html = html.replace(/^\*\*\*$/gm, '<hr>');

    // Restore inline code
    inlineCodes.forEach((code, index) => {
        html = html.replace(
            `___INLINE_CODE_${index}___`,
            `<code class="inline-code">${code}</code>`
        );
    });

    // Paragraphs
    html = html.split('\n\n').map(para => {
        para = para.trim();
        if (!para) return '';
        
        if (para.startsWith('<h') || 
            para.startsWith('<ul') || 
            para.startsWith('<ol') || 
            para.startsWith('<pre') || 
            para.startsWith('<blockquote') ||
            para.startsWith('<table') ||
            para.startsWith('<hr') ||
            para.startsWith('<div') ||
            para.includes('___CODE_BLOCK_')) {
            return para;
        }
        
        return `<p>${para}</p>`;
    }).join('\n');

    // Single line breaks
    html = html.replace(/\n/g, '<br>');

    // Restore code blocks with syntax highlighting (FIXED)
    codeBlocks.forEach((block, index) => {
        html = html.replace(
            `___CODE_BLOCK_${index}___`,
            createCodeBlock(block.language, block.code)
        );
    });

    return html;
}

/**
 * Create code block with syntax highlighting (FIXED)
 */
function createCodeBlock(language, code) {
    const escapedCode = escapeHtml(code);
    const languageDisplay = getLanguageDisplay(language);
    
    // Generate unique ID for this code block
    const blockId = `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // FIXED: Proper code block structure
    return `<div class="code-block-wrapper">
        <div class="code-header">
            <div class="code-language-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="16 18 22 12 16 6"></polyline>
                    <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
                <span>${languageDisplay}</span>
            </div>
            <button class="copy-btn" onclick="window.copyCode('${blockId}')" data-copied="false">
                <svg class="copy-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <svg class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span class="copy-text">Copy</span>
            </button>
        </div>
        <pre><code id="${blockId}" class="language-${language}" data-raw-code="${escapedCode.replace(/"/g, '&quot;')}">${escapedCode}</code></pre>
    </div>`;
}

/**
 * Get language display name
 */
function getLanguageDisplay(lang) {
    const languages = {
        'javascript': 'JavaScript',
        'typescript': 'TypeScript',
        'python': 'Python',
        'java': 'Java',
        'cpp': 'C++',
        'c': 'C',
        'csharp': 'C#',
        'ruby': 'Ruby',
        'go': 'Go',
        'rust': 'Rust',
        'php': 'PHP',
        'swift': 'Swift',
        'kotlin': 'Kotlin',
        'html': 'HTML',
        'css': 'CSS',
        'scss': 'SCSS',
        'json': 'JSON',
        'xml': 'XML',
        'yaml': 'YAML',
        'markdown': 'Markdown',
        'bash': 'Bash',
        'shell': 'Shell',
        'sql': 'SQL',
        'plaintext': 'Text'
    };
    return languages[lang] || lang.toUpperCase();
}

/**
 * Parse unordered lists
 */
function parseUnorderedLists(text) {
    const lines = text.split('\n');
    let result = [];
    let inList = false;
    let listItems = [];

    lines.forEach((line) => {
        const match = line.match(/^[-*+] (.+)$/);
        
        if (match) {
            if (!inList) {
                inList = true;
                listItems = [];
            }
            listItems.push(`<li>${match[1]}</li>`);
        } else {
            if (inList) {
                result.push(`<ul>${listItems.join('')}</ul>`);
                inList = false;
                listItems = [];
            }
            result.push(line);
        }
    });

    if (inList) {
        result.push(`<ul>${listItems.join('')}</ul>`);
    }

    return result.join('\n');
}

/**
 * Parse ordered lists
 */
function parseOrderedLists(text) {
    const lines = text.split('\n');
    let result = [];
    let inList = false;
    let listItems = [];

    lines.forEach((line) => {
        const match = line.match(/^(\d+)\. (.+)$/);
        
        if (match) {
            if (!inList) {
                inList = true;
                listItems = [];
            }
            listItems.push(`<li>${match[2]}</li>`);
        } else {
            if (inList) {
                result.push(`<ol>${listItems.join('')}</ol>`);
                inList = false;
                listItems = [];
            }
            result.push(line);
        }
    });

    if (inList) {
        result.push(`<ol>${listItems.join('')}</ol>`);
    }

    return result.join('\n');
}

/**
 * Parse tables (FIXED)
 */
function parseTables(text) {
    const lines = text.split('\n');
    let result = [];
    let inTable = false;
    let tableRows = [];
    let isHeaderRow = true;

    lines.forEach((line, index) => {
        // Check if line is a table row
        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
            // Skip separator line
            if (line.match(/^\|[\s-:|]+\|$/)) {
                return;
            }

            if (!inTable) {
                inTable = true;
                tableRows = [];
                isHeaderRow = true;
            }

            const cells = line.split('|')
                .filter(cell => cell.trim())
                .map(cell => cell.trim());
            
            if (isHeaderRow) {
                tableRows.push(`<thead><tr>${cells.map(cell => `<th>${cell}</th>`).join('')}</tr></thead><tbody>`);
                isHeaderRow = false;
            } else {
                tableRows.push(`<tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr>`);
            }
        } else {
            if (inTable) {
                tableRows.push('</tbody>');
                result.push(`<table class="markdown-table">${tableRows.join('')}</table>`);
                inTable = false;
                tableRows = [];
                isHeaderRow = true;
            }
            result.push(line);
        }
    });

    if (inTable) {
        tableRows.push('</tbody>');
        result.push(`<table class="markdown-table">${tableRows.join('')}</table>`);
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
 * Copy code to clipboard (global function)
 */
window.copyCode = function(blockId) {
    const codeElement = document.getElementById(blockId);
    if (!codeElement) return;
    
    const rawCode = codeElement.getAttribute('data-raw-code');
    const textToCopy = rawCode
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        const button = codeElement.closest('.code-block-wrapper').querySelector('.copy-btn');
        if (!button) return;
        
        const copyIcon = button.querySelector('.copy-icon');
        const checkIcon = button.querySelector('.check-icon');
        const copyText = button.querySelector('.copy-text');
        
        copyIcon.style.display = 'none';
        checkIcon.style.display = 'block';
        copyText.textContent = 'Copied!';
        button.classList.add('copied');
        
        setTimeout(() => {
            copyIcon.style.display = 'block';
            checkIcon.style.display = 'none';
            copyText.textContent = 'Copy';
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
};

/**
 * Initialize Highlight.js when code blocks are rendered
 */
export function initializeSyntaxHighlighting() {
    if (window.hljs) {
        document.querySelectorAll('pre code').forEach((block) => {
            if (!block.dataset.highlighted) {
                window.hljs.highlightElement(block);
                block.dataset.highlighted = 'yes';
            }
        });
    }
}

// Auto-initialize highlighting
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeSyntaxHighlighting, 100);
    });
} else {
    setTimeout(initializeSyntaxHighlighting, 100);
}

console.log('📦 Fixed Markdown Parser loaded');

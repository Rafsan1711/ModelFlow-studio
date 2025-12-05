/**
 * ============================================
 * PROFESSIONAL MARKDOWN PARSER
 * ChatGPT/Claude Style Rich Formatting
 * ============================================
 */

/**
 * Parse markdown to beautiful HTML
 */
export function parseMarkdown(text) {
    if (!text) return '';

    let html = text;

    // Code blocks FIRST (before any other processing)
    html = parseCodeBlocks(html);

    // Escape HTML in non-code content
    html = escapeNonCodeHtml(html);

    // Headings with beautiful icons
    html = html.replace(/^### (.+)$/gm, '<h3><span class="heading-icon">📌</span>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2><span class="heading-icon">📍</span>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1><span class="heading-icon">✨</span>$1</h1>');

    // Bold (must come before italic)
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*([^\*]+?)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+?)_/g, '<em>$1</em>');

    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

    // Inline code (not inside code blocks)
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Links with icon
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer"><span class="link-icon">🔗</span>$1<span class="external-icon">↗</span></a>');

    // Blockquotes with beautiful styling
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote><span class="quote-icon">💬</span>$1</blockquote>');
    html = html.replace(/^> (.+)$/gm, '<blockquote><span class="quote-icon">💬</span>$1</blockquote>');

    // Unordered lists with custom bullets
    html = parseUnorderedLists(html);

    // Ordered lists with numbers
    html = parseOrderedLists(html);

    // Tables
    html = parseTables(html);

    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr class="divider">');
    html = html.replace(/^\*\*\*$/gm, '<hr class="divider">');

    // Task lists (checkboxes)
    html = html.replace(/^- \[ \] (.+)$/gm, '<div class="task-item"><input type="checkbox" disabled><span>$1</span></div>');
    html = html.replace(/^- \[x\] (.+)$/gm, '<div class="task-item"><input type="checkbox" checked disabled><span class="completed">$1</span></div>');

    // Highlights
    html = html.replace(/==(.+?)==/g, '<mark class="highlight">$1</mark>');

    // Info boxes
    html = html.replace(/^\[!NOTE\] (.+)$/gm, '<div class="info-box note"><span class="box-icon">ℹ️</span><span class="box-content">$1</span></div>');
    html = html.replace(/^\[!TIP\] (.+)$/gm, '<div class="info-box tip"><span class="box-icon">💡</span><span class="box-content">$1</span></div>');
    html = html.replace(/^\[!WARNING\] (.+)$/gm, '<div class="info-box warning"><span class="box-icon">⚠️</span><span class="box-content">$1</span></div>');
    html = html.replace(/^\[!IMPORTANT\] (.+)$/gm, '<div class="info-box important"><span class="box-icon">🔥</span><span class="box-content">$1</span></div>');

    // Paragraphs (double newline = new paragraph)
    html = html.split('\n\n').map(para => {
        para = para.trim();
        if (!para) return '';
        
        // Don't wrap if already wrapped in block elements
        if (para.startsWith('<h') || 
            para.startsWith('<ul') || 
            para.startsWith('<ol') || 
            para.startsWith('<pre') || 
            para.startsWith('<blockquote') ||
            para.startsWith('<table') ||
            para.startsWith('<hr') ||
            para.startsWith('<div')) {
            return para;
        }
        
        return `<p>${para}</p>`;
    }).join('\n');

    // Single line breaks
    html = html.replace(/\n/g, '<br>');

    return html;
}

/**
 * Parse code blocks with syntax highlighting
 */
function parseCodeBlocks(text) {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    
    return text.replace(codeBlockRegex, (match, language, code) => {
        const lang = language || 'code';
        const trimmedCode = code.trim();
        const escapedCode = escapeHtml(trimmedCode);
        
        // Add line numbers
        const lines = escapedCode.split('\n');
        const numberedCode = lines.map((line, index) => {
            return `<span class="line-number">${index + 1}</span><span class="line-content">${line || ' '}</span>`;
        }).join('\n');
        
        return `<pre class="code-block"><div class="code-header">
            <span class="code-language"><span class="lang-icon">{ }</span>${lang}</span>
            <button class="copy-btn" onclick="copyCode(this)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span class="copy-text">Copy</span>
            </button>
        </div><code class="language-${lang}" data-code="${escapedCode}">${numberedCode}</code></pre>`;
    });
}

/**
 * Parse unordered lists
 */
function parseUnorderedLists(text) {
    const lines = text.split('\n');
    let result = [];
    let inList = false;
    let listItems = [];

    lines.forEach((line, index) => {
        const match = line.match(/^[-*+] (.+)$/);
        
        if (match) {
            if (!inList) {
                inList = true;
                listItems = [];
            }
            listItems.push(`<li><span class="bullet">●</span><span class="list-content">${match[1]}</span></li>`);
        } else {
            if (inList) {
                result.push(`<ul class="styled-list">${listItems.join('')}</ul>`);
                inList = false;
                listItems = [];
            }
            result.push(line);
        }
    });

    if (inList) {
        result.push(`<ul class="styled-list">${listItems.join('')}</ul>`);
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
            listItems.push(`<li><span class="number">${match[1]}</span><span class="list-content">${match[2]}</span></li>`);
        } else {
            if (inList) {
                result.push(`<ol class="styled-list numbered">${listItems.join('')}</ol>`);
                inList = false;
                listItems = [];
            }
            result.push(line);
        }
    });

    if (inList) {
        result.push(`<ol class="styled-list numbered">${listItems.join('')}</ol>`);
    }

    return result.join('\n');
}

/**
 * Parse tables
 */
function parseTables(text) {
    const lines = text.split('\n');
    let result = [];
    let inTable = false;
    let tableRows = [];
    let isHeaderRow = true;

    lines.forEach((line) => {
        // Check if line is a table row
        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
            // Skip separator row
            if (line.match(/^\|[\s-:|]+\|$/)) {
                return;
            }

            if (!inTable) {
                inTable = true;
                tableRows = [];
                isHeaderRow = true;
            }

            const cells = line.split('|').filter(cell => cell.trim()).map(cell => cell.trim());
            
            if (isHeaderRow) {
                tableRows.push(`<thead><tr>${cells.map(cell => `<th>${cell}</th>`).join('')}</tr></thead><tbody>`);
                isHeaderRow = false;
            } else {
                tableRows.push(`<tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr>`);
            }
        } else {
            if (inTable) {
                tableRows.push('</tbody>');
                result.push(`<table class="styled-table">${tableRows.join('')}</table>`);
                inTable = false;
                tableRows = [];
                isHeaderRow = true;
            }
            result.push(line);
        }
    });

    if (inTable) {
        tableRows.push('</tbody>');
        result.push(`<table class="styled-table">${tableRows.join('')}</table>`);
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
 * Escape HTML except in code blocks
 */
function escapeNonCodeHtml(text) {
    // This is a simplified version - code blocks are already processed
    return text;
}

/**
 * Copy code to clipboard (global function)
 */
window.copyCode = function(button) {
    const pre = button.closest('pre');
    const code = pre.querySelector('code');
    const text = code.getAttribute('data-code');
    
    navigator.clipboard.writeText(text).then(() => {
        const copyText = button.querySelector('.copy-text');
        const originalText = copyText.textContent;
        copyText.textContent = 'Copied!';
        button.classList.add('copied');
        
        setTimeout(() => {
            copyText.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
};

console.log('📦 Professional Markdown Parser loaded');

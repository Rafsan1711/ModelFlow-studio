/**
 * ============================================
 * MARKDOWN PARSER - FIXED CODE BLOCKS
 * Works like old prototype
 * ============================================
 */

/**
 * Parse markdown to HTML
 */
export function parseMarkdown(text) {
    if (!text) return '';

    let html = text;

    // Store code blocks first
    const codeBlocks = [];
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        const placeholder = `___CODE_BLOCK_${codeBlocks.length}___`;
        codeBlocks.push({ lang: lang || 'code', code: code.trim() });
        return placeholder;
    });

    // Store inline code
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

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*([^\*]+?)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+?)_/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Lists
    html = parseUnorderedLists(html);
    html = parseOrderedLists(html);

    // Blockquotes
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

    // Tables
    html = parseTables(html);

    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr>');

    // Restore inline code
    inlineCodes.forEach((code, i) => {
        html = html.replace(`___INLINE_CODE_${i}___`, `<code>${code}</code>`);
    });

    // Paragraphs
    html = html.split('\n\n').map(para => {
        para = para.trim();
        if (!para) return '';
        
        if (para.startsWith('<h') || 
            para.startsWith('<ul') || 
            para.startsWith('<ol') || 
            para.startsWith('<blockquote') ||
            para.startsWith('<table') ||
            para.startsWith('<hr') ||
            para.startsWith('___CODE_BLOCK_')) {
            return para;
        }
        
        return `<p>${para}</p>`;
    }).join('\n');

    // Line breaks
    html = html.replace(/\n/g, '<br>');

    // Restore code blocks with proper structure
    codeBlocks.forEach((block, i) => {
        html = html.replace(`___CODE_BLOCK_${i}___`, createCodeBlock(block.lang, block.code));
    });

    return html;
}

/**
 * Create code block with header and copy button
 */
function createCodeBlock(lang, code) {
    const escapedCode = escapeHtml(code);
    const blockId = `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return `<div class="code-block">
        <div class="code-block-header">
            <span class="code-language">${lang}</span>
            <button class="copy-code-btn" onclick="window.copyCode('${blockId}')">Copy</button>
        </div>
        <pre><code id="${blockId}" data-code="${escapedCode.replace(/"/g, '&quot;')}">${escapedCode}</code></pre>
    </div>`;
}

/**
 * Copy code function (global)
 */
window.copyCode = function(blockId) {
    const codeEl = document.getElementById(blockId);
    if (!codeEl) return;
    
    const code = codeEl.getAttribute('data-code')
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
    
    navigator.clipboard.writeText(code).then(() => {
        const btn = codeEl.closest('.code-block').querySelector('.copy-code-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.style.background = 'rgba(16, 185, 129, 0.2)';
        btn.style.color = '#10b981';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
            btn.style.color = '';
        }, 2000);
    }).catch(err => {
        console.error('Copy failed:', err);
    });
};

/**
 * Parse unordered lists
 */
function parseUnorderedLists(text) {
    const lines = text.split('\n');
    let result = [];
    let inList = false;
    let items = [];

    lines.forEach(line => {
        if (line.match(/^[-*+] (.+)$/)) {
            if (!inList) {
                inList = true;
                items = [];
            }
            items.push(`<li>${line.replace(/^[-*+] /, '')}</li>`);
        } else {
            if (inList) {
                result.push(`<ul>${items.join('')}</ul>`);
                inList = false;
                items = [];
            }
            result.push(line);
        }
    });

    if (inList) {
        result.push(`<ul>${items.join('')}</ul>`);
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
    let items = [];

    lines.forEach(line => {
        if (line.match(/^\d+\. (.+)$/)) {
            if (!inList) {
                inList = true;
                items = [];
            }
            items.push(`<li>${line.replace(/^\d+\. /, '')}</li>`);
        } else {
            if (inList) {
                result.push(`<ol>${items.join('')}</ol>`);
                inList = false;
                items = [];
            }
            result.push(line);
        }
    });

    if (inList) {
        result.push(`<ol>${items.join('')}</ol>`);
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
    let rows = [];
    let isHeader = true;

    lines.forEach(line => {
        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
            // Skip separator line
            if (line.match(/^\|[\s-:|]+\|$/)) return;

            if (!inTable) {
                inTable = true;
                rows = [];
                isHeader = true;
            }

            const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
            
            if (isHeader) {
                rows.push(`<thead><tr>${cells.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>`);
                isHeader = false;
            } else {
                rows.push(`<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`);
            }
        } else {
            if (inTable) {
                rows.push('</tbody>');
                result.push(`<table>${rows.join('')}</table>`);
                inTable = false;
                isHeader = true;
            }
            result.push(line);
        }
    });

    if (inTable) {
        rows.push('</tbody>');
        result.push(`<table>${rows.join('')}</table>`);
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

console.log('📦 Markdown Parser (Fixed) loaded');

// src/components/HtmlUploader.tsx
import React, { useState, useRef } from 'react';
import { Upload, FileText, Eye, Edit } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import slugify from 'slugify';
import TurndownService from 'turndown';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

// Disable the warnings without needing the plugins
marked.setOptions({
  mangle: false,
  headerIds: false
});

// HTML Preview Component
const HtmlPreview = ({ htmlContent }) => {
  return (
    <div className="border rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">HTML Preview</h3>
        <div className="text-sm text-gray-500">
          Raw HTML content before conversion
        </div>
      </div>
      <div className="p-4 max-h-[600px] overflow-auto">
        <iframe
          srcDoc={`
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body {
                    font-family: -apple-system, system-ui, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 100%;
                    padding: 1rem;
                  }
                  img {
                    max-width: 100%;
                    height: auto;
                  }
                  pre {
                    background: #f5f5f5;
                    padding: 1rem;
                    overflow-x: auto;
                  }
                </style>
              </head>
              <body>
                ${htmlContent}
              </body>
            </html>
          `}
          className="w-full min-h-[500px] border-0"
          title="HTML Preview"
        />
      </div>
    </div>
  );
};

const HtmlUploader = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [file, setFile] = useState(null);
  const [rawHtmlContent, setRawHtmlContent] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [metadata, setMetadata] = useState({
    title: '',
    slug: '',
    date: new Date().toISOString().split('T')[0],
    featuredImage: '',
    excerpt: ''
  });
  const [error, setError] = useState(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [viewMode, setViewMode] = useState('edit'); // 'edit', 'html', 'markdown'

  const extractBodyContent = (htmlString) => {
    try {
      // Use DOMParser for proper HTML parsing
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, 'text/html');
      
      console.log("Parsed document:", doc.body ? "Body exists" : "No body found");
      
      // Return only the body content
      return doc.body ? doc.body.innerHTML : htmlString;
    } catch (error) {
      console.error('Error extracting body content:', error);
      
      // Fallback: Use regex to extract body content
      const bodyMatch = htmlString.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      if (bodyMatch && bodyMatch[1]) {
        return bodyMatch[1];
      }
      
      return htmlString;
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (selectedFile.type !== 'text/html' && !selectedFile.name.toLowerCase().endsWith('.html')) {
      setError('Please select a valid HTML file');
      return;
    }

    setFile(selectedFile);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fullHtmlContent = e.target?.result;
        console.log("Raw HTML content size:", fullHtmlContent.length);
        
        // Extract just the body content
        const bodyContent = extractBodyContent(fullHtmlContent);
        console.log("Body content size:", bodyContent.length);
        
        setRawHtmlContent(bodyContent);

        const turndownService = new TurndownService({
          headingStyle: 'atx',
          hr: '---',
          bulletListMarker: '-',
          codeBlockStyle: 'fenced'
        });

        // Add rules to exclude HTML structure elements
        turndownService.addRule('ignoreDoctype', {
          filter: node => node.nodeType === 10, // Document type node
          replacement: () => ''
        });

        turndownService.addRule('ignoreHead', {
          filter: 'head',
          replacement: () => ''
        });

        turndownService.addRule('ignoreScript', {
          filter: 'script',
          replacement: () => ''
        });

        turndownService.addRule('ignoreStyle', {
          filter: 'style',
          replacement: () => ''
        });

        // Custom image rule
        turndownService.addRule('images', {
          filter: 'img',
          replacement: (content, node) => {
            const alt = node.getAttribute('alt') || '';
            const src = node.getAttribute('src') || '';
            const title = node.getAttribute('title') ? ` "${node.getAttribute('title')}"` : '';
            return `![${alt}](${src}${title})`;
          }
        });

        // Convert HTML to Markdown
        const markdownContent = turndownService.turndown(bodyContent);
        
        // Remove any DOCTYPE, HTML, HEAD tags that might have slipped through
        const cleanMarkdown = markdownContent
          .replace(/<!DOCTYPE[^>]*>/gi, '')
          .replace(/<html[^>]*>/gi, '')
          .replace(/<\/html>/gi, '')
          .replace(/<head>[\s\S]*?<\/head>/gi, '')
          .replace(/<body[^>]*>/gi, '')
          .replace(/<\/body>/gi, '');

        console.log("Markdown content size:", cleanMarkdown.length);
        setMarkdown(cleanMarkdown);

        // Extract title from first h1 or document title
        let extractedTitle = '';
        const parser = new DOMParser();
        const doc = parser.parseFromString(fullHtmlContent, 'text/html');
        
        // Try to get title from document <title> tag
        if (doc.title && doc.title.trim()) {
          extractedTitle = doc.title.trim();
        } 
        // If no document title, try to get from first <h1>
        else {
          const h1 = doc.querySelector('h1');
          if (h1 && h1.textContent) {
            extractedTitle = h1.textContent.trim();
          }
        }
        
        // If still no title, try to find a markdown # heading
        if (!extractedTitle) {
          const titleMatch = cleanMarkdown.match(/^#\s*(.+)$/m);
          if (titleMatch) {
            extractedTitle = titleMatch[1].trim();
          }
        }

        // Extract excerpt from first paragraph
        let extractedExcerpt = '';
        const firstP = doc.querySelector('p');
        if (firstP && firstP.textContent) {
          extractedExcerpt = firstP.textContent.trim().slice(0, 200);
        } else {
          // Try to find first paragraph in markdown
          const excerptMatch = cleanMarkdown.match(/^(?!\#|\>)[^\n]+/m);
          if (excerptMatch) {
            extractedExcerpt = excerptMatch[0].trim().slice(0, 200);
          }
        }

        console.log("Extracted title:", extractedTitle);
        console.log("Extracted excerpt:", extractedExcerpt);

        setMetadata(prev => ({
          ...prev,
          title: extractedTitle || 'Untitled Post',
          slug: extractedTitle ? slugify(extractedTitle.toLowerCase()) : `post-${Date.now()}`,
          excerpt: extractedExcerpt || 'No excerpt available'
        }));
      } catch (error) {
        console.error("Error processing HTML:", error);
        setError(`Error processing HTML: ${error.message}`);
      }
    };

    reader.onerror = (error) => {
      console.error("File reading error:", error);
      setError(`Error reading file: ${error.message}`);
    };

    reader.readAsText(selectedFile);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const renderViewModeSelector = () => (
    <div className="flex space-x-2 mb-4">
      <button
        onClick={() => setViewMode('edit')}
        className={`px-4 py-2 rounded-lg flex items-center ${
          viewMode === 'edit' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        <Edit className="w-4 h-4 mr-2" />
        Edit
      </button>
      <button
        onClick={() => setViewMode('html')}
        className={`px-4 py-2 rounded-lg flex items-center ${
          viewMode === 'html' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        <FileText className="w-4 h-4 mr-2" />
        HTML Preview
      </button>
      <button
        onClick={() => setViewMode('markdown')}
        className={`px-4 py-2 rounded-lg flex items-center ${
          viewMode === 'markdown' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        <Eye className="w-4 h-4 mr-2" />
        Markdown Preview
      </button>
    </div>
  );

  const handleDeploy = async () => {
    setIsDeploying(true);
    setError(null);

    try {
      if (!metadata.title || !markdown) {
        throw new Error('Title and content are required');
      }

      const slug = metadata.slug || slugify(metadata.title.toLowerCase());
      
      // Use the properly configured marked instance
      const htmlContent = marked(markdown);
      const cleanHtml = DOMPurify.sanitize(htmlContent, {
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
          'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 
          'em', 'strong', 'del', 'a', 'img', 'table', 'thead', 
          'tbody', 'tr', 'th', 'td', 'div', 'span'
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id'],
        KEEP_CONTENT: true
      });

      const payload = {
        slug,
        title: metadata.title,
        date: metadata.date,
        excerpt: metadata.excerpt || markdown.slice(0, 200),
        featured_image: metadata.featuredImage || null,
        content: markdown,
        html_content: cleanHtml,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('blog_posts')
        .insert(payload)
        .select();

      if (error) throw error;

      navigate(`/blog/${slug}`);
    } catch (err) {
      console.error('Deployment error:', err);
      setError(err.message || 'Failed to deploy blog post');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">HTML to Blog Post Converter</h2>
        
        <div className="mb-6">
          <input
            type="file"
            accept=".html"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
          />
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="block w-full p-6 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-blue-500 transition"
          >
            <Upload className="mx-auto h-10 w-10 text-gray-400 mb-4" />
            <p className="text-gray-600">
              {file ? file.name : 'Click to upload HTML file'}
            </p>
          </div>
        </div>

        {file && (
          <>
            {renderViewModeSelector()}

            {viewMode === 'edit' && (
              <div className="space-y-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={metadata.title}
                    onChange={(e) => setMetadata(prev => ({
                      ...prev,
                      title: e.target.value,
                      slug: slugify(e.target.value.toLowerCase())
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Slug</label>
                  <input
                    type="text"
                    value={metadata.slug}
                    onChange={(e) => setMetadata(prev => ({
                      ...prev,
                      slug: e.target.value
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Featured Image URL</label>
                  <input
                    type="text"
                    value={metadata.featuredImage}
                    onChange={(e) => setMetadata(prev => ({
                      ...prev,
                      featuredImage: e.target.value
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Excerpt</label>
                  <textarea
                    value={metadata.excerpt}
                    onChange={(e) => setMetadata(prev => ({
                      ...prev,
                      excerpt: e.target.value
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    rows={3}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Markdown Content</label>
                  <textarea
                    value={markdown}
                    onChange={(e) => setMarkdown(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    rows={10}
                  />
                </div>
              </div>
            )}

            {viewMode === 'html' && (
              <HtmlPreview htmlContent={rawHtmlContent} />
            )}

            {viewMode === 'markdown' && (
              <div className="border rounded-lg bg-white shadow-sm">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-lg font-semibold">Markdown Preview</h3>
                </div>
                <div className="p-4">
                  <div 
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: DOMPurify.sanitize(marked(markdown)) 
                    }} 
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleDeploy}
                disabled={!metadata.title || !markdown || isDeploying}
                className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isDeploying ? 'Deploying...' : 'Deploy Post'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HtmlUploader;
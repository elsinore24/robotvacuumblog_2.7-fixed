import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import type { BlogPost } from '../utils/markdown';
import './BlogContent.css'; // We'll create this file next

interface Props {
  post: BlogPost;
}

export default function BlogPostComponent({ post }: Props) {
  const [processedContent, setProcessedContent] = useState('');

  useEffect(() => {
    // Process the content when the component mounts or post changes
    if (post.html_content) {
      // If html_content exists, use it (but still sanitize)
      setProcessedContent(DOMPurify.sanitize(post.html_content));
    } else if (post.content) {
      try {
        // Convert markdown to HTML
        const html = marked.parse(post.content);
        setProcessedContent(DOMPurify.sanitize(html));
      } catch (error) {
        console.error("Failed to parse content:", error);
        // Fallback to sanitized content
        setProcessedContent(DOMPurify.sanitize(post.content));
      }
    }
  }, [post.content, post.html_content]);

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      <Link 
        to="/blog"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8"
      >
        <svg
          className="mr-2 w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Blog
      </Link>

      {post.featuredImage && (
        <img
          src={post.featuredImage}
          alt={post.title}
          className="w-full h-64 md:h-96 object-cover rounded-lg mb-8"
        />
      )}

      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {post.title}
        </h1>
        
        <time 
          dateTime={post.date}
          className="text-gray-500"
        >
          {new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </time>
      </header>

      <div 
        className="prose prose-lg max-w-none blog-content"
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />

      <div className="mt-12 pt-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Recommended Robot Vacuums
        </h2>
        
        {/* Add your product recommendations component here */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Product cards would go here */}
        </div>
      </div>
    </article>
  );
}

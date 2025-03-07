// src/utils/markdown.ts
import frontMatter from 'front-matter';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { supabase } from '../lib/supabaseClient';

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  content: string;
  html_content?: string; // Added html_content field
  excerpt?: string;
  featuredImage?: string;
}

interface BlogFrontMatter {
  title: string;
  date: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
}

// Get all blog posts
export async function getAllPosts(): Promise<BlogPost[]> {
  try {
    // First, try to fetch from Supabase
    const { data: supabasePosts, error: supabaseError } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (supabaseError) {
      console.error('Supabase fetch error:', supabaseError);
    }

    if (supabasePosts && supabasePosts.length > 0) {
      return supabasePosts.map(post => ({
        title: post.title,
        date: post.date,
        slug: post.slug,
        excerpt: post.excerpt,
        featuredImage: post.featured_image,
        content: post.content,
        html_content: post.html_content // Include html_content in mapping
      }));
    }

    // Fallback to local markdown files if no Supabase posts
    const posts: BlogPost[] = [];
    const markdownFiles = import.meta.glob('/content/blog/*.md', { 
      query: '?raw',
      import: 'default'
    });

    for (const path in markdownFiles) {
      try {
        const content = await markdownFiles[path]() as string;
        const { attributes, body } = frontMatter<BlogFrontMatter>(content);
        
        // Convert markdown to HTML
        const htmlContent = DOMPurify.sanitize(marked.parse(body));

        posts.push({
          ...attributes,
          content: body,
          html_content: htmlContent // Include converted HTML content
        } as BlogPost);
      } catch (error) {
        console.error(`Error processing markdown file ${path}:`, error);
      }
    }

    // Sort by date
    return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  } catch (err) {
    console.error('Error fetching blog posts:', err);
    return [];
  }
}

// Get a single post by slug
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    // First, try to fetch from Supabase
    const { data: supabaseData, error: supabaseError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .single();

    if (supabaseError) {
      console.error('Supabase fetch error:', supabaseError);
    }

    if (supabaseData) {
      return {
        title: supabaseData.title,
        date: supabaseData.date,
        slug: supabaseData.slug,
        excerpt: supabaseData.excerpt,
        featuredImage: supabaseData.featured_image,
        content: supabaseData.content,
        html_content: supabaseData.html_content // Include html_content in return
      };
    }

    // Fallback to local markdown files
    const markdownFiles = import.meta.glob('/content/blog/*.md', { 
      query: '?raw',
      import: 'default'
    });

    for (const path in markdownFiles) {
      try {
        const content = await markdownFiles[path]() as string;
        const { attributes, body } = frontMatter<BlogFrontMatter>(content);
        
        if (attributes.slug === slug) {
          // Convert markdown to HTML
          const htmlContent = DOMPurify.sanitize(marked.parse(body));

          return {
            ...attributes,
            content: body,
            html_content: htmlContent // Include converted HTML content
          } as BlogPost;
        }
      } catch (error) {
        console.error(`Error processing markdown file ${path}:`, error);
      }
    }

    return null;
  } catch (err) {
    console.error('Error fetching blog post:', err);
    return null;
  }
}

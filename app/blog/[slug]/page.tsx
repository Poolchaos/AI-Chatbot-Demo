import { notFound } from 'next/navigation';
import Link from 'next/link';
import { blogPosts, getBlogPost } from '@/content/blog-posts';
import { ArrowLeft, Clock, User, Calendar } from 'lucide-react';
import type { Metadata } from 'next';

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const post = getBlogPost(params.slug);
  if (!post) return { title: 'Post Not Found' };
  return {
    title: `${post.title} - Elevate Offsites Blog`,
    description: post.excerpt,
  };
}

export default function BlogPostPage({ params }: Props) {
  const post = getBlogPost(params.slug);
  if (!post) notFound();

  // Simple markdown-to-html for headings, bold, lists, tables, paragraphs
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let key = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Empty line
      if (line.trim() === '') {
        i++;
        continue;
      }

      // H2
      if (line.startsWith('## ')) {
        elements.push(
          <h2
            key={key++}
            className="mb-4 mt-10 text-2xl font-bold text-slate-900"
          >
            {line.slice(3)}
          </h2>
        );
        i++;
        continue;
      }

      // H3
      if (line.startsWith('### ')) {
        elements.push(
          <h3
            key={key++}
            className="mb-3 mt-8 text-xl font-semibold text-slate-900"
          >
            {line.slice(4)}
          </h3>
        );
        i++;
        continue;
      }

      // Checklist item
      if (line.trimStart().startsWith('- [ ] ')) {
        const checklistItems: string[] = [];
        while (i < lines.length && lines[i].trimStart().startsWith('- [ ] ')) {
          checklistItems.push(lines[i].trimStart().slice(6));
          i++;
        }
        elements.push(
          <ul key={key++} className="mb-4 space-y-2">
            {checklistItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-700">
                <span className="mt-1 h-4 w-4 flex-shrink-0 rounded border border-slate-300" />
                <span dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // Unordered list
      if (line.trimStart().startsWith('- ')) {
        const items: string[] = [];
        while (i < lines.length && lines[i].trimStart().startsWith('- ')) {
          items.push(lines[i].trimStart().slice(2));
          i++;
        }
        elements.push(
          <ul key={key++} className="mb-4 list-disc space-y-1 pl-6 text-slate-700">
            {items.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
            ))}
          </ul>
        );
        continue;
      }

      // Table
      if (line.includes('|') && line.trim().startsWith('|')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].includes('|') && lines[i].trim().startsWith('|')) {
          tableLines.push(lines[i]);
          i++;
        }
        // Parse table
        const rows = tableLines
          .filter((l) => !l.match(/^\|\s*-+/)) // skip separator
          .map((l) =>
            l
              .split('|')
              .slice(1, -1)
              .map((cell) => cell.trim())
          );
        if (rows.length > 0) {
          const [header, ...body] = rows;
          elements.push(
            <div key={key++} className="mb-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    {header.map((cell, idx) => (
                      <th key={idx} className="px-3 py-2 font-semibold text-slate-900">
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {body.map((row, ridx) => (
                    <tr key={ridx} className="border-b">
                      {row.map((cell, cidx) => (
                        <td key={cidx} className="px-3 py-2 text-slate-700">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        continue;
      }

      // Regular paragraph
      elements.push(
        <p
          key={key++}
          className="mb-4 leading-relaxed text-slate-700"
          dangerouslySetInnerHTML={{ __html: inlineFormat(line) }}
        />
      );
      i++;
    }

    return elements;
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <section className="border-b bg-slate-50 py-12">
        <div className="mx-auto max-w-3xl px-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>
          <span className="mt-6 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
            {post.category}
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {post.title}
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {post.author}, {post.authorRole}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(post.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.readTime}
            </span>
          </div>
        </div>
      </section>

      {/* Article body */}
      <article className="mx-auto max-w-3xl px-6 py-12">
        {renderContent(post.content)}
      </article>

      {/* CTA */}
      <section className="border-t bg-slate-50 py-12">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-xl font-bold text-slate-900">
            Ready to Start Planning Your Retreat?
          </h2>
          <p className="mt-2 text-slate-600">
            Chat with our AI assistant for instant answers, or let our events
            team build a custom proposal.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="/#packages"
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
            >
              View Packages
            </Link>
            <Link
              href="/blog"
              className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
            >
              More Articles
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

/** Convert **bold** markdown to <strong> tags */
function inlineFormat(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>');
}

import Link from 'next/link';
import { blogPosts, BLOG_CATEGORIES } from '@/content/blog-posts';
import { ArrowRight, Clock, User } from 'lucide-react';

export const metadata = {
  title: 'Blog - Elevate Offsites',
  description:
    'Expert insights on corporate retreat planning, team building, destinations, and industry trends.',
};

export default function BlogPage() {
  const featured = blogPosts.find((p) => p.featured);
  const rest = blogPosts.filter((p) => p !== featured);

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20 text-white">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Insights & Resources
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            Expert advice on planning corporate retreats, building stronger
            teams, and choosing the right destinations.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="border-b">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex gap-6 overflow-x-auto py-4 text-sm">
            <Link
              href="/blog"
              className="whitespace-nowrap font-medium text-blue-600"
            >
              All Posts
            </Link>
            {BLOG_CATEGORIES.map((cat) => (
              <span
                key={cat}
                className="whitespace-nowrap text-slate-500"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-16">
        {/* Featured post */}
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group mb-16 block overflow-hidden rounded-2xl border bg-slate-50 transition hover:shadow-lg"
          >
            <div className="p-8 sm:p-10">
              <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                Featured
              </span>
              <h2 className="mt-4 text-2xl font-bold text-slate-900 transition group-hover:text-blue-600 sm:text-3xl">
                {featured.title}
              </h2>
              <p className="mt-3 text-lg text-slate-600">{featured.excerpt}</p>
              <div className="mt-6 flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {featured.author}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {featured.readTime}
                </span>
                <span>{new Date(featured.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition group-hover:gap-2">
                Read article <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        )}

        {/* Post grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-xl border p-6 transition hover:shadow-md"
            >
              <span className="inline-block self-start rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {post.category}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-slate-900 transition group-hover:text-blue-600">
                {post.title}
              </h3>
              <p className="mt-2 flex-1 text-sm text-slate-600">
                {post.excerpt}
              </p>
              <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
                <span>{post.author}</span>
                <span>·</span>
                <span>{post.readTime}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader, Clock, ChevronRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from "react-helmet";

const R2_BASE = "https://pub-ffd0eb07a99540ac95c35c521dd8f7ae.r2.dev";

const cleanImageUrl = (url: string): string => {
   if (!url || typeof url !== 'string') {
    return '/placeholder.jpg'; // 👈 fallback image (IMPORTANT)
  }
  if (url.startsWith(R2_BASE)) return url;
  if (url.includes('unsplash.com')) return url;
  if (url.startsWith('/')) return url;
  if (url.startsWith('http')) return url; {
    const fileName = url.split('/').pop();
    return `${R2_BASE}/${fileName}`;
  }
  return `${R2_BASE}/${url}`;
};

const Blog = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        const postsWithR2 = data.map((post: any) => ({
          ...post,
          image_url: cleanImageUrl(post.image_url)
        }));
        setPosts(postsWithR2);
      }
      setLoading(false);
    };
    fetchPosts();
  }, []);

  return (
    <div className="bg-[#fafafa] min-h-screen">

      {/* ✅ SEO HEAD */}
      <Helmet>
        <title>Fastener Blog | Durable Fastener India</title>

        <meta
          name="description"
          content="Read expert blogs on screws, fasteners, manufacturing, and industrial insights from Durable Fastener Pvt Ltd."
        />

        <meta name="robots" content="index, follow" />

        <link rel="canonical" href="https://durablefastener.com/blog" />
      </Helmet>

      {/* ✅ STATIC SEO CONTENT (VERY IMPORTANT FOR GOOGLE) */}
      <div style={{ display: "none" }}>
        <h1>Fastener Blog - Durable Fastener</h1>
        <p>
          Durable Fastener blog provides insights on screw manufacturing,
          drywall screws, self drilling screws, stainless steel fasteners,
          and industrial applications in India.
        </p>
      </div>

      {/* HERO */}
      <div className="pt-32 pb-16 text-center">
        <h1 className="text-4xl font-bold">Durable Fastener Blog</h1>
        <p className="text-gray-500 mt-3">
          Industrial insights, fastener knowledge & manufacturing guides
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-20">

        {/* LOADING */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader className="animate-spin" />
          </div>
        )}

        {/* EMPTY STATE (SEO IMPORTANT) */}
        {!loading && posts.length === 0 && (
          <div className="text-center py-20">
            <h2 className="text-xl font-bold">Fastener Industry Blogs</h2>
            <p className="text-gray-500 mt-2">
              Articles about screws, fasteners, and manufacturing processes.
            </p>
          </div>
        )}

        {/* BLOG LIST */}
        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <div key={post.id} className="bg-white p-4 rounded-lg shadow">

              <Link to={`/blog/${post.slug}`}>
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-full h-48 object-cover rounded"
                />
              </Link>

              <div className="mt-3 text-sm text-gray-400 flex gap-3">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} /> 5 min
                </span>
              </div>

              <h2 className="text-lg font-bold mt-2">
                <Link to={`/blog/${post.slug}`}>
                  {post.title}
                </Link>
              </h2>

              <p className="text-gray-500 text-sm mt-2">
                {post.excerpt}
              </p>

              <Link
                to={`/blog/${post.slug}`}
                className="text-blue-600 mt-3 inline-flex items-center gap-1"
              >
                Read More <ChevronRight size={16} />
              </Link>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Blog;

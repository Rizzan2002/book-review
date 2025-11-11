import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchBooks = async (e) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setSearched(true);
    
    // Use our own API route to search
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.books || []);
    } catch (error) {
      console.error('Error searching books:', error);
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-800">Book Nook</h1>
        <p className="text-lg text-gray-600 mt-2">Find your next great read.</p>
      </div>

      <form onSubmit={searchBooks} className="max-w-xl mx-auto mb-12">
        <div className="flex rounded-full shadow-lg">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for books, authors, or ISBN..."
            className="w-full py-3 px-6 rounded-l-full focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-6 sm:px-8 py-3 rounded-r-full font-semibold hover:bg-green-700 transition-colors"
          >
            {loading ? '...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Results Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {results.map((book) => (
          <Link href={`/book/${book.id}`} key={book.id}>
            <div className="cursor-pointer group">
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-full h-auto object-cover aspect-[2/3] rounded-lg shadow-md group-hover:shadow-xl transition-shadow"
              />
              <h3 className="text-sm font-semibold mt-2 truncate">{book.title}</h3>
              <p className="text-xs text-gray-600 truncate">{book.author}</p>
            </div>
          </Link>
        ))}
      </div>
      
      {searched && !loading && results.length === 0 && (
        <p className="text-center text-gray-500">No results found for "{query}".</p>
      )}
    </div>
  );
}
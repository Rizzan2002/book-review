export default async function handler(req, res) {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  // This uses the key from your .env.local file
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;
  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=18&key=${apiKey}`
    );
    
    if (!response.ok) {
      console.error("Google Books API Error:", await response.text());
      throw new Error('Failed to fetch from Google Books API');
    }

    const data = await response.json();
    const books = (data.items || []).map(item => ({
      id: item.id,
      title: item.volumeInfo.title,
      author: item.volumeInfo.authors ? item.volumeInfo.authors.join(', ') : 'Unknown',
      coverUrl: item.volumeInfo.imageLinks?.thumbnail || 'https://placehold.co/300x450?text=No+Cover',
    }));

    res.status(200).json({ books });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
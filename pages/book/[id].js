import { db as adminDb } from '../../lib/firebase-admin';
import { collection, query, where, getDocs } from 'firebase/firestore';
import ReviewManager from '../../components/ReviewManager';

// This is the individual book page
export default function BookPage({ book, staticReviews }) {
  if (!book) return <div>Book not found.</div>;

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Book Info */}
        <div className="md:col-span-1 space-y-4">
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-auto object-cover aspect-[2/3] rounded-lg shadow-lg"
          />
          <h1 className="text-3xl font-bold text-gray-900">{book.title}</h1>
          <h2 className="text-xl text-gray-600">{book.author}</h2>
          
          <a
            href={book.purchaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            View on Google Books
          </a>
          
          <div className="prose text-gray-700 max-w-none">
            <h3>Summary</h3>
            <p dangerouslySetInnerHTML={{ __html: book.description }} />
          </div>
        </div>

        {/* Right Column: Reviews */}
        <div className="md:col-span-2">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Community Reviews</h3>
          <ReviewManager bookId={book.id} staticReviews={staticReviews} />
        </div>
      </div>
    </div>
  );
}

// This function runs on the SERVER
export async function getStaticProps(context) {
  const { id } = context.params;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;

  try {
    // 1. Fetch Book Details from Google API
    const bookRes = await fetch(
      `https://www.googleapis.com/books/v1/volumes/${id}?key=${apiKey}`
    );
    if (!bookRes.ok) {
      throw new Error(`Google Books API failed with status: ${bookRes.status}`);
    }
    const bookData = await bookRes.json();
    
    if (!bookData || bookData.error) {
      return { notFound: true }; // Show 404 page
    }

    const book = {
      id: bookData.id,
      title: bookData.volumeInfo.title || 'Title not available',
      author: bookData.volumeInfo.authors ? bookData.volumeInfo.authors.join(', ') : 'Unknown',
      coverUrl: bookData.volumeInfo.imageLinks?.thumbnail || 'https://placehold.co/300x450?text=No+Cover',
      description: bookData.volumeInfo.description || 'No summary available.',
      purchaseUrl: bookData.volumeInfo.infoLink || '#',
    };

    // 2. Fetch Reviews from *our* Firebase Admin SDK
    const reviewsColPath = `/artifacts/${process.env.NEXT_PUBLIC_APP_ID}/public/data/reviews`;
    const q = query(collection(adminDb, reviewsColPath), where("bookId", "==", id));
    
    const querySnapshot = await getDocs(q);
    const staticReviews = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        rating: data.rating || 5,
        text: data.text || '',
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
        // THIS IS THE NEW, SAFER CODE
        // It checks if 'userId' exists before trying to slice it.
        userId: data.userId ? data.userId.substring(0, 8) : 'Anonymous',
      };
    }).sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // 3. Send all this data as props to our page
    return {
      props: {
        book,
        staticReviews,
      },
      revalidate: 60, // Re-build this page in the background every 60 seconds
    };

  } catch (error) {
    console.error(`Error in getStaticProps for book [${id}]:`, error.message);
    // This will show the 500 error page, which is what you are seeing.
    // This is most likely caused by the environment variables being wrong.
    return { props: { error: 'Failed to load book data.' }, revalidate: 10 };
  }
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking',
  };
}
import { useState, useEffect } from 'react';
import { db, auth, getAuthenticatedUser } from '../lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

export default function ReviewManager({ bookId, staticReviews }) {
  const [reviews, setReviews] = useState(staticReviews); // Start with server-rendered reviews
  const [newRating, setNewRating] = useState(5);
  const [newText, setNewText] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Get the authenticated user
  useEffect(() => {
    getAuthenticatedUser()
      .then((user) => setUser(user))
      .catch((err) => setError('Could not sign in to review.'));
  }, []);

  // 2. Listen for new reviews from Firebase
  useEffect(() => {
    setLoading(true);
    const reviewsColPath = `/artifacts/${process.env.NEXT_PUBLIC_APP_ID}/public/data/reviews`;
    const q = query(collection(db, reviewsColPath), where('bookId', '==', bookId));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const liveReviews = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          liveReviews.push({
            id: doc.id,
            rating: data.rating,
            text: data.text,
            createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
            userId: data.userId.substring(0, 8), // Show partial ID
          });
        });
        
        // Sort newest first
        liveReviews.sort((a, b) => {
            if (!a.createdAt) return 1;
            if (!b.createdAt) return -1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        setReviews(liveReviews);
        setLoading(false);
      },
      (err) => {
        console.error('Snapshot error:', err);
        setError('Could not load new reviews.');
        setLoading(false);
      }
    );

    return () => unsubscribe(); // Stop listening when component unmounts
  }, [bookId]);

  // 3. Handle submitting a new review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('You must be signed in to leave a review.');
      return;
    }
    if (!newText.trim()) {
        setError('Review text cannot be empty.');
        return;
    }

    const review = {
      bookId,
      userId: user.uid,
      rating: Number(newRating),
      text: newText,
      createdAt: serverTimestamp(),
    };

    try {
      const reviewsColPath = `/artifacts/${process.env.NEXT_PUBLIC_APP_ID}/public/data/reviews`;
      await addDoc(collection(db, reviewsColPath), review);
      setNewText('');
      setNewRating(5);
      setError(null);
    } catch (err) {
      console.error('Error adding review:', err);
      setError('Could not post review.');
    }
  };
  
  // Helper to format dates
  const formatDate = (isoString) => {
    if (!isoString) return 'Just now';
    return new Date(isoString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
  }

  return (
    <div className="space-y-6">
      {/* Review Submission Form */}
      <form onSubmit={handleSubmitReview} className="bg-gray-50 p-4 rounded-lg shadow">
        <h4 className="text-lg font-semibold mb-2">Write a review</h4>
        <div className="mb-2">
          <label htmlFor="rating" className="block text-sm font-medium text-gray-700">Rating</label>
          <select
            id="rating"
            value={newRating}
            onChange={(e) => setNewRating(e.target.value)}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          >
            {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{'★'.repeat(r)}{'☆'.repeat(5-r)}</option>)}
          </select>
        </div>
        <div className="mb-2">
          <label htmlFor="reviewText" className="block text-sm font-medium text-gray-700">Review</label>
          <textarea
            id="reviewText"
            rows="3"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="What did you think?"
            className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          ></textarea>
        </div>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <button
          type="submit"
          disabled={!user}
          className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
        >
          {user ? 'Submit Review' : 'Loading User...'}
        </button>
      </form>

      {/* List of Reviews */}
      <div className="space-y-4">
        {loading && reviews.length === 0 && <p>Loading reviews...</p>}
        {!loading && reviews.length === 0 && <p>Be the first to write a review!</p>}
        
        {reviews.map((review) => (
          <div key={review.id} className="bg-white p-4 rounded-lg shadow border">
            <div className="flex justify-between items-center mb-1">
                <span className="text-lg font-semibold text-yellow-500">{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</span>
                <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
            </div>
            <p className="text-gray-700 mb-2">{review.text}</p>
            <p className="text-xs text-gray-400">User: {review.userId}...</p>
          </div>
        ))}
      </div>
    </div>
  );
}
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { auth, db } from '../firebaseConfig';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  limit,
  startAfter,
  Timestamp,
} from 'firebase/firestore';

const Comment = ({ comment }) => (
  <div className="p-3 bg-gray-100 rounded-lg shadow-md">
    <p className="text-gray-800 font-medium">{comment.userName}</p>
    <p className="text-gray-700">{comment.text}</p>
    <span className="text-gray-500 text-sm">
      {new Date(comment.timestamp?.seconds * 1000).toLocaleString()}
    </span>
  </div>
);

const Comments = ({ onClose, channelId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const ITEMS_PER_PAGE = 6;

  const observer = useRef();
  const user = auth.currentUser;

  const handleError = (error, fallbackMessage) => {
    if (error.message.includes('The query requires an index')) {
      setErrorMessage('Comments are temporarily unavailable. Please try again later.');
    } else {
      console.error(error);
      setErrorMessage(fallbackMessage || 'An unexpected error occurred.');
    }
  };

  const fetchComments = useCallback(
    async (loadMore = false) => {
      if (!channelId || isLoading) return;

      setIsLoading(true);
      try {
        const commentsRef = collection(db, 'comments');
        let commentsQuery = query(
          commentsRef,
          where('channelId', '==', channelId),
          orderBy('timestamp', 'desc'),
          limit(ITEMS_PER_PAGE)
        );

        if (loadMore && lastVisible) {
          commentsQuery = query(
            commentsRef,
            where('channelId', '==', channelId),
            orderBy('timestamp', 'desc'),
            startAfter(lastVisible),
            limit(ITEMS_PER_PAGE)
          );
        }

        const snapshot = await getDocs(commentsQuery);
        const fetchedComments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setComments((prev) =>
          loadMore ? [...prev, ...fetchedComments] : fetchedComments
        );

        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        setLastVisible(lastDoc);

        setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);
      } catch (error) {
        handleError(error, 'Failed to fetch comments.');
      } finally {
        setIsLoading(false);
      }
    },
    [channelId, isLoading, lastVisible]
  );

  const checkCommentLimit = async () => {
    if (!user) {
      setErrorMessage('You must be logged in to comment.');
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of the day

    try {
      const commentsRef = collection(db, 'comments');
      const dailyQuery = query(
        commentsRef,
        where('channelId', '==', channelId),
        where('userId', '==', user.uid),
        where('timestamp', '>=', Timestamp.fromDate(today))
      );

      const dailyCommentsSnapshot = await getDocs(dailyQuery);

      if (dailyCommentsSnapshot.size >= 5) {
        setErrorMessage('You have reached the daily limit of 5 comments.');
        return false;
      }

      return true;
    } catch (error) {
      handleError(error, 'Failed to check comment limit.');
      return false;
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      setErrorMessage('Comment cannot be empty.');
      return;
    }

    const canAddComment = await checkCommentLimit();
    if (!canAddComment) return;

    const commentData = {
      text: newComment,
      channelId,
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      timestamp: Timestamp.now(),
    };

    try {
      const commentsRef = collection(db, 'comments');
      await addDoc(commentsRef, commentData);
      setNewComment('');
      fetchComments(); // Refresh comments
    } catch (error) {
      handleError(error, 'Failed to add comment.');
    }
  };

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    if (!hasMore || isLoading) return;

    const loadMore = (entries) => {
      if (entries[0].isIntersecting) {
        fetchComments(true);
      }
    };

    observer.current = new IntersectionObserver(loadMore);
    const node = document.querySelector('#load-more-trigger');
    if (node) observer.current.observe(node);

    return () => observer.current?.disconnect();
  }, [hasMore, isLoading, fetchComments]);

  return (
    <div className="fixed inset-0 flex justify-center items-start z-40">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>

      <div className="relative z-50 bg-white rounded-b-lg shadow-lg w-full md:w-3/4 lg:w-1/2 max-h-[80vh] p-4 mt-0 overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Comments</h2>
        </div>
        <div className="overflow-y-auto max-h-[60vh]">
          <div className="mt-4 space-y-4">
            {errorMessage ? (
              <p className="text-red-600">{errorMessage}</p>
            ) : comments.length > 0 ? (
              comments.map((comment) => <Comment key={comment.id} comment={comment} />)
            ) : isLoading ? (
              <p className="text-gray-500">Loading...</p>
            ) : (
              <p className="text-gray-500">No comments yet. Be the first to comment!</p>
            )}
          </div>
          {hasMore && <div id="load-more-trigger" className="w-full h-10"></div>}
        </div>
        <div className="mt-4 flex items-center space-x-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={handleAddComment}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
};

export default Comments;

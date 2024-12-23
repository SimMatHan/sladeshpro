import React, { useState, useEffect, useCallback, useRef } from "react";
import { auth, db } from "../firebaseConfig";
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  limit,
  where,
  startAfter,
  Timestamp,
  collectionGroup,
  doc,
  getDoc
} from "firebase/firestore";

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
  const [newComment, setNewComment] = useState("");
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const ITEMS_PER_PAGE = 6;

  const observer = useRef();
  const user = auth.currentUser;

  const handleError = (error, fallbackMessage) => {
    console.error(error);
    setErrorMessage(fallbackMessage || "An unexpected error occurred.");
  };

  const fetchComments = useCallback(
    async (loadMore = false) => {
      if (!channelId || isLoading) return;
  
      setIsLoading(true);
      try {
        const commentsCollection = collection(db, "comments");
        let commentsQuery = query(
          commentsCollection,
          where("channelId", "==", channelId),
          orderBy("timestamp", "desc"),
          limit(ITEMS_PER_PAGE)
        );
  
        if (loadMore && lastVisible) {
          commentsQuery = query(
            commentsCollection,
            where("channelId", "==", channelId),
            orderBy("timestamp", "desc"),
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
  
        if (snapshot.docs.length > 0) {
          const lastDoc = snapshot.docs[snapshot.docs.length - 1];
          setLastVisible(lastDoc);
        } else {
          setHasMore(false);
        }
      } catch (error) {
        handleError(error, "Failed to fetch comments.");
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
      const channelCommentsRef = collection(db, `channels/${channelId}/comments`);
      const dailyQuery = query(
        channelCommentsRef,
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
      setErrorMessage("Comment cannot be empty.");
      return;
    }
  
    if (!user) {
      setErrorMessage("You must be logged in to comment.");
      return;
    }
  
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      let userName = "Anonymous";
  
      if (userDoc.exists()) {
        userName = userDoc.data().username || "Anonymous";
      }
  
      const commentData = {
        text: newComment,
        userId: user.uid,
        userName: userName,
        channelId: channelId, // Include channelId for filtering
        timestamp: Timestamp.now(),
      };
  
      const commentsCollection = collection(db, "comments");
      await addDoc(commentsCollection, commentData);
  
      setNewComment("");
      fetchComments(); // Refresh comments
    } catch (error) {
      handleError(error, "Failed to add comment.");
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
    const node = document.querySelector("#load-more-trigger");
    if (node) observer.current.observe(node);

    return () => observer.current?.disconnect();
  }, [hasMore, isLoading, fetchComments]);

  return (
    <div className="fixed inset-0 flex justify-center items-start z-40">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>

      {/* Comments Container */}
      <div className="relative z-50 bg-[var(--bg-color)] rounded-b-lg shadow-heavy w-full md:w-3/4 lg:w-1/2 max-h-[80vh] p-4 overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-color)]">
            Comments
          </h2>
        </div>

        {/* Comments List */}
        <div className="overflow-y-auto max-h-[60vh]">
          <div className="mt-4 space-y-4">
            {errorMessage ? (
              <p className="text-[var(--delete-btn)]">{errorMessage}</p>
            ) : comments.length > 0 ? (
              comments.map((comment) => <Comment key={comment.id} comment={comment} />)
            ) : isLoading ? (
              <p className="text-[var(--text-muted)]">Loading...</p>
            ) : (
              <p className="text-[var(--text-muted)]">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
          {hasMore && <div id="load-more-trigger" className="w-full h-10"></div>}
        </div>

        {/* Add Comment Input */}
        <div className="mt-4 flex items-center space-x-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="input px-4 py-2"
          />
          <button onClick={handleAddComment} className="button-primary">
            Post
          </button>
        </div>
      </div>
    </div>
  );
};

export default Comments;

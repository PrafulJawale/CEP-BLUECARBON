import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  category: 'general' | 'mangrove' | 'seagrass' | 'saltmarsh' | 'policy' | 'technology';
  timestamp: string;
  upvotes: number;
  downvotes: number;
  replies: ForumReply[];
  tags: string[];
  pinned: boolean;
}

export interface ForumReply {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  timestamp: string;
  upvotes: number;
  downvotes: number;
}

export interface Vote {
  id: string;
  userId: string;
  targetId: string; // post or reply id
  type: 'upvote' | 'downvote';
}

interface ForumContextType {
  posts: ForumPost[];
  votes: Vote[];
  createPost: (post: Omit<ForumPost, 'id' | 'timestamp' | 'upvotes' | 'downvotes' | 'replies'>) => void;
  addReply: (reply: Omit<ForumReply, 'id' | 'timestamp' | 'upvotes' | 'downvotes'>) => void;
  voteOnPost: (postId: string, userId: string, voteType: 'upvote' | 'downvote') => void;
  voteOnReply: (replyId: string, userId: string, voteType: 'upvote' | 'downvote') => void;
  getPostsByCategory: (category: string) => ForumPost[];
  getUserVote: (targetId: string, userId: string) => Vote | null;
}

const ForumContext = createContext<ForumContextType | undefined>(undefined);

export const useForum = () => {
  const context = useContext(ForumContext);
  if (context === undefined) {
    throw new Error('useForum must be used within a ForumProvider');
  }
  return context;
};

export const ForumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);

  useEffect(() => {
    const storedPosts = localStorage.getItem('bluecarbon_forum_posts');
    if (!storedPosts) {
      const samplePosts: ForumPost[] = [
        {
          id: '1',
          title: 'Best practices for mangrove restoration in shallow waters',
          content: 'I\'m working on a mangrove restoration project in Kerala and looking for advice on the best species to plant in areas with varying salinity levels. Any experiences to share?',
          authorId: '2',
          authorName: 'GreenEarth NGO',
          category: 'mangrove',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          upvotes: 12,
          downvotes: 1,
          replies: [
            {
              id: 'r1',
              postId: '1',
              content: 'Rhizophora mucronata works well in your region. Make sure to check soil salinity levels first.',
              authorId: '3',
              authorName: 'Dr. Marine Biologist',
              timestamp: new Date(Date.now() - 43200000).toISOString(),
              upvotes: 8,
              downvotes: 0,
            }
          ],
          tags: ['mangrove', 'kerala', 'restoration'],
          pinned: false,
        },
        {
          id: '2',
          title: 'Carbon credit pricing trends - What to expect in 2024?',
          content: 'The blue carbon credit market seems volatile. What are your thoughts on fair pricing for mangrove restoration credits?',
          authorId: '4',
          authorName: 'Carbon Trader Inc',
          category: 'policy',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          upvotes: 25,
          downvotes: 3,
          replies: [],
          tags: ['pricing', 'market', 'credits'],
          pinned: true,
        },
      ];
      localStorage.setItem('bluecarbon_forum_posts', JSON.stringify(samplePosts));
      setPosts(samplePosts);
    } else {
      setPosts(JSON.parse(storedPosts));
    }

    const storedVotes = localStorage.getItem('bluecarbon_forum_votes');
    if (storedVotes) {
      setVotes(JSON.parse(storedVotes));
    }
  }, []);

  const createPost = (postData: Omit<ForumPost, 'id' | 'timestamp' | 'upvotes' | 'downvotes' | 'replies'>) => {
    const newPost: ForumPost = {
      ...postData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0,
      replies: [],
    };

    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    localStorage.setItem('bluecarbon_forum_posts', JSON.stringify(updatedPosts));
  };

  const addReply = (replyData: Omit<ForumReply, 'id' | 'timestamp' | 'upvotes' | 'downvotes'>) => {
    const newReply: ForumReply = {
      ...replyData,
      id: `r${Date.now()}`,
      timestamp: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0,
    };

    const updatedPosts = posts.map(post =>
      post.id === replyData.postId
        ? { ...post, replies: [...post.replies, newReply] }
        : post
    );

    setPosts(updatedPosts);
    localStorage.setItem('bluecarbon_forum_posts', JSON.stringify(updatedPosts));
  };

  const voteOnPost = (postId: string, userId: string, voteType: 'upvote' | 'downvote') => {
    const existingVote = votes.find(v => v.targetId === postId && v.userId === userId);
    
    let updatedVotes = [...votes];
    if (existingVote) {
      if (existingVote.type === voteType) {
        // Remove vote if same type
        updatedVotes = votes.filter(v => v.id !== existingVote.id);
      } else {
        // Change vote type
        updatedVotes = votes.map(v => 
          v.id === existingVote.id ? { ...v, type: voteType } : v
        );
      }
    } else {
      // Add new vote
      updatedVotes.push({
        id: Date.now().toString(),
        userId,
        targetId: postId,
        type: voteType,
      });
    }

    setVotes(updatedVotes);
    localStorage.setItem('bluecarbon_forum_votes', JSON.stringify(updatedVotes));

    // Update post vote counts
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const postVotes = updatedVotes.filter(v => v.targetId === postId);
        const upvotes = postVotes.filter(v => v.type === 'upvote').length;
        const downvotes = postVotes.filter(v => v.type === 'downvote').length;
        return { ...post, upvotes, downvotes };
      }
      return post;
    });

    setPosts(updatedPosts);
    localStorage.setItem('bluecarbon_forum_posts', JSON.stringify(updatedPosts));
  };

  const voteOnReply = (replyId: string, userId: string, voteType: 'upvote' | 'downvote') => {
    const existingVote = votes.find(v => v.targetId === replyId && v.userId === userId);
    
    let updatedVotes = [...votes];
    if (existingVote) {
      if (existingVote.type === voteType) {
        updatedVotes = votes.filter(v => v.id !== existingVote.id);
      } else {
        updatedVotes = votes.map(v => 
          v.id === existingVote.id ? { ...v, type: voteType } : v
        );
      }
    } else {
      updatedVotes.push({
        id: Date.now().toString(),
        userId,
        targetId: replyId,
        type: voteType,
      });
    }

    setVotes(updatedVotes);
    localStorage.setItem('bluecarbon_forum_votes', JSON.stringify(updatedVotes));

    // Update reply vote counts
    const updatedPosts = posts.map(post => ({
      ...post,
      replies: post.replies.map(reply => {
        if (reply.id === replyId) {
          const replyVotes = updatedVotes.filter(v => v.targetId === replyId);
          const upvotes = replyVotes.filter(v => v.type === 'upvote').length;
          const downvotes = replyVotes.filter(v => v.type === 'downvote').length;
          return { ...reply, upvotes, downvotes };
        }
        return reply;
      })
    }));

    setPosts(updatedPosts);
    localStorage.setItem('bluecarbon_forum_posts', JSON.stringify(updatedPosts));
  };

  const getPostsByCategory = (category: string) => {
    return posts.filter(post => post.category === category);
  };

  const getUserVote = (targetId: string, userId: string) => {
    return votes.find(v => v.targetId === targetId && v.userId === userId) || null;
  };

  return (
    <ForumContext.Provider
      value={{
        posts,
        votes,
        createPost,
        addReply,
        voteOnPost,
        voteOnReply,
        getPostsByCategory,
        getUserVote,
      }}
    >
      {children}
    </ForumContext.Provider>
  );
};
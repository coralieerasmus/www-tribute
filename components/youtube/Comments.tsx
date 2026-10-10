"use client";

import { useState } from "react";
import type { Comment, Video } from "./videos";
import styles from "./youtube.module.css";

let uid = 0;
const newId = () => `mine-${Date.now()}-${uid++}`;

export default function Comments({ video }: { video: Video }) {
  const [comments, setComments] = useState<Comment[]>(video.comments);
  const [sort, setSort] = useState<"top" | "new">("top");
  const total = comments.reduce((s, c) => s + 1 + (c.replies?.length ?? 0), 0) + 1840;

  const post = (text: string) => {
    setComments((cs) => [
      { id: newId(), author: "You", avatarColor: "#888", time: "just now", text, likes: 0 },
      ...cs,
    ]);
  };

  const reply = (parentId: string, text: string) => {
    setComments((cs) =>
      cs.map((c) =>
        c.id === parentId
          ? {
              ...c,
              replies: [
                ...(c.replies ?? []),
                { id: newId(), author: "You", avatarColor: "#888", time: "just now", text, likes: 0 },
              ],
            }
          : c,
      ),
    );
  };

  const sorted = sort === "top" ? [...comments].sort((a, b) => b.likes - a.likes) : comments;

  return (
    <section className={styles.card}>
      <div className={styles.commentsHeader}>
        <span>
          ALL COMMENTS <span className={styles.commentCount}>({total.toLocaleString("en-US")})</span>
        </span>
        <select value={sort} onChange={(e) => setSort(e.target.value as "top" | "new")} className={styles.sortSelect}>
          <option value="top">Top comments</option>
          <option value="new">Newest first</option>
        </select>
      </div>
      <Composer placeholder="Share your thoughts" onPost={post} />
      <div className={styles.commentList}>
        {sorted.map((c) => (
          <CommentItem key={c.id} comment={c} onReply={(t) => reply(c.id, t)} />
        ))}
      </div>
    </section>
  );
}

function Composer({
  placeholder,
  onPost,
  autoFocus,
  onCancel,
}: {
  placeholder: string;
  onPost: (t: string) => void;
  autoFocus?: boolean;
  onCancel?: () => void;
}) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(!!autoFocus);
  const submit = () => {
    if (!text.trim()) return;
    onPost(text.trim());
    setText("");
    setFocused(false);
    onCancel?.();
  };
  return (
    <div className={styles.composer}>
      <div className={styles.commentAvatar} style={{ background: "#888" }} />
      <div className={styles.composerBody}>
        <textarea
          value={text}
          placeholder={placeholder}
          autoFocus={autoFocus}
          rows={focused ? 3 : 1}
          onFocus={() => setFocused(true)}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        {focused && (
          <div className={styles.composerActions}>
            <button
              className={styles.greyBtn}
              onClick={() => {
                setText("");
                setFocused(false);
                onCancel?.();
              }}
            >
              Cancel
            </button>
            <button className={styles.blueBtn} disabled={!text.trim()} onClick={submit}>
              Post
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  onReply,
  isReply,
}: {
  comment: Comment;
  onReply?: (t: string) => void;
  isReply?: boolean;
}) {
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const likes = comment.likes + (vote === "up" ? 1 : 0);
  const replies = comment.replies ?? [];

  return (
    <div className={`${styles.comment} ${isReply ? styles.commentReply : ""}`}>
      <div className={styles.commentAvatar} style={{ background: comment.avatarColor }}>
        {comment.author.charAt(0).toUpperCase()}
      </div>
      <div className={styles.commentBody}>
        <div className={styles.commentMeta}>
          <span className={styles.commentAuthor}>{comment.author}</span>
          <span className={styles.commentTime}>{comment.time}</span>
        </div>
        <div className={styles.commentText}>{comment.text}</div>
        <div className={styles.commentActions}>
          {!isReply && (
            <button className={styles.replyBtn} onClick={() => setReplying((r) => !r)}>
              Reply
            </button>
          )}
          <span className={styles.commentLikes}>{likes > 0 ? likes.toLocaleString("en-US") : ""}</span>
          <button
            className={`${styles.thumbBtn} ${vote === "up" ? styles.thumbOn : ""}`}
            onClick={() => setVote(vote === "up" ? null : "up")}
            aria-label="Like"
          >
            <svg width="14" height="14" viewBox="0 0 24 24">
              <path d="M2 10h4v12H2zM8 22h10c1 0 1.8-.6 2-1.5l2-8c.3-1.3-.7-2.5-2-2.5h-6l1-5c.2-1-.6-2-1.6-2L8 10z" fill="currentColor" />
            </svg>
          </button>
          <button
            className={`${styles.thumbBtn} ${vote === "down" ? styles.thumbOn : ""}`}
            onClick={() => setVote(vote === "down" ? null : "down")}
            aria-label="Dislike"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" style={{ transform: "scaleY(-1)" }}>
              <path d="M2 10h4v12H2zM8 22h10c1 0 1.8-.6 2-1.5l2-8c.3-1.3-.7-2.5-2-2.5h-6l1-5c.2-1-.6-2-1.6-2L8 10z" fill="currentColor" />
            </svg>
          </button>
        </div>

        {replying && onReply && (
          <Composer
            placeholder="Reply…"
            autoFocus
            onPost={(t) => {
              onReply(t);
              setShowReplies(true);
            }}
            onCancel={() => setReplying(false)}
          />
        )}

        {replies.length > 0 && (
          <button className={styles.viewReplies} onClick={() => setShowReplies((s) => !s)}>
            {showReplies ? "Hide replies ▴" : `View all ${replies.length} ${replies.length === 1 ? "reply" : "replies"} ▾`}
          </button>
        )}
        {showReplies &&
          replies.map((r) => <CommentItem key={r.id} comment={r} isReply />)}
      </div>
    </div>
  );
}

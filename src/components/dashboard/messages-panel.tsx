"use client";

import type { MessageThread } from "@/lib/dashboard-types";
import { ChevronDown, ChevronRight, ExternalLink, MessageCircle, User } from "lucide-react";
import { Fragment, useState } from "react";

interface MessagesPanelProps {
  threads: MessageThread[];
  loading: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function MessagesPanel({ threads, loading }: MessagesPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-300">
          <MessageCircle className="h-4 w-4 text-purple-400" />
          Message Threads
          {threads.length > 0 && (
            <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-400">
              {threads.length}
            </span>
          )}
        </h3>
      </div>

      {/* Thread list */}
      <div className="divide-y divide-white/5">
        {threads.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            No message threads yet
          </div>
        ) : (
          threads.map((thread) => {
            const isExpanded = expandedId === thread.id;
            return (
              <Fragment key={thread.id}>
                <div
                  className={`cursor-pointer p-4 transition-colors hover:bg-white/[0.04] ${
                    !thread.isRead ? "border-l-2 border-l-purple-500" : ""
                  } ${isExpanded ? "bg-white/[0.03]" : ""}`}
                  onClick={() => setExpandedId(isExpanded ? null : thread.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Expand icon */}
                      <div className="mt-1 text-gray-600">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>

                      {/* Avatar */}
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-200">
                          @{thread.clientUsername}
                          {thread.clientName && (
                            <span className="ml-1 font-normal text-gray-500">({thread.clientName})</span>
                          )}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {thread.projectTitle || `Thread #${thread.threadId}`}
                        </p>
                        {/* Preview */}
                        <p className="mt-1 line-clamp-1 text-xs text-gray-400">
                          {thread.lastMessage || "(no preview)"}
                        </p>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-[10px] text-gray-600">
                        {thread.lastMessageAt ? timeAgo(thread.lastMessageAt) : "—"}
                      </span>
                      <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-gray-500">
                        {thread.messageCount} msg{thread.messageCount !== 1 ? "s" : ""}
                      </span>
                      {thread.projectId && (
                        <a
                          href={`https://www.freelancer.com/projects/${thread.projectId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-400"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded: Full conversation */}
                {isExpanded && thread.messages.length > 0 && (
                  <div className="border-b border-white/10 bg-white/[0.02] px-6 py-4">
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      💬 Conversation
                    </h4>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {thread.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${
                              msg.from === "me"
                                ? "bg-blue-500/15 text-blue-200 border border-blue-500/20"
                                : msg.from === "system"
                                ? "bg-white/5 text-gray-500 italic"
                                : "bg-white/5 text-gray-300 border border-white/10"
                            }`}
                          >
                            <div className="mb-1 flex items-center gap-2">
                              <span className="font-medium text-[10px]">
                                {msg.from === "me" ? "Eric" : `@${msg.username}`}
                              </span>
                              <span className="text-[9px] text-gray-600">
                                {new Date(msg.sentAt).toLocaleString("en-US", {
                                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Fragment>
            );
          })
        )}
      </div>
    </div>
  );
}
